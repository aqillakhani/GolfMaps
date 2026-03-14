/**
 * OpenStreetMap Overpass API service for fetching real golf course geometry.
 * 
 * Tiered lookup:
 *   Tier 1: Query by course name + country
 *   Tier 2: Query by GPS coordinates (from course lat/lng)
 *   Tier 3: Return null → caller falls back to procedural generation
 */

// ─── Types ────────────────────────────────────────────────────

export interface OSMFeature {
  type: "fairway" | "green" | "bunker" | "water" | "tee";
  /** SVG-space polygon points (already projected) */
  points: [number, number][];
  /** Original centroid in GPS */
  centroidLat: number;
  centroidLng: number;
}

export interface OSMCourseData {
  courseName: string;
  features: OSMFeature[];
  bounds: {
    minLat: number; maxLat: number;
    minLng: number; maxLng: number;
  };
  fetchedAt: number;
  source: "overpass-name" | "overpass-coords";
}

// ─── Constants ────────────────────────────────────────────────

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const CACHE_PREFIX = "osm_course_";
const FETCH_TIMEOUT = 12000; // 12s timeout

// ─── localStorage cache ───────────────────────────────────────

const getCacheKey = (courseName: string, country: string): string =>
  `${CACHE_PREFIX}${courseName.toLowerCase().replace(/\s+/g, "_")}_${country.toLowerCase().replace(/\s+/g, "_")}`;

const getCachedOSM = (courseName: string, country: string): OSMCourseData | null => {
  try {
    const key = getCacheKey(courseName, country);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as OSMCourseData;
    // OSM data is stable — no expiry needed
    return data;
  } catch {
    return null;
  }
};

const setCachedOSM = (courseName: string, country: string, data: OSMCourseData): void => {
  try {
    const key = getCacheKey(courseName, country);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full — silently fail
  }
};

// ─── Overpass query builders ──────────────────────────────────

const buildNameQuery = (courseName: string): string => {
  // Clean name for OSM lookup (remove suffixes like "Golf Club", "Country Club", etc.)
  const cleanName = courseName
    .replace(/\s*\(.*?\)\s*/g, "") // Remove parentheticals like "(South)"
    .replace(/\s*(Golf Club|Golf Links|Golf Course|Country Club|Golf Resort)\s*/gi, "")
    .trim();
  
  return `[out:json][timeout:10];
area[name~"${cleanName}",i][leisure=golf_course]->.course;
(
  way[golf=fairway](area.course);
  way[golf=green](area.course);
  way[golf=bunker](area.course);
  way[natural=water](area.course);
  way[water](area.course);
  way[golf=tee](area.course);
);
out geom;`;
};

const buildCoordQuery = (lat: number, lng: number, radius: number = 800): string => {
  return `[out:json][timeout:10];
(
  way[golf=fairway](around:${radius},${lat},${lng});
  way[golf=green](around:${radius},${lat},${lng});
  way[golf=bunker](around:${radius},${lat},${lng});
  way[natural=water](around:${radius},${lat},${lng});
  way[golf=tee](around:${radius},${lat},${lng});
);
out geom;`;
};

// ─── Overpass fetch ───────────────────────────────────────────

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const fetchOverpass = async (query: string): Promise<OverpassResponse | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    return (await res.json()) as OverpassResponse;
  } catch {
    clearTimeout(timer);
    return null;
  }
};

// ─── Parse OSM tags to feature type ──────────────────────────

const tagToFeatureType = (tags: Record<string, string>): OSMFeature["type"] | null => {
  if (tags.golf === "fairway") return "fairway";
  if (tags.golf === "green") return "green";
  if (tags.golf === "bunker") return "bunker";
  if (tags.golf === "tee") return "tee";
  if (tags.natural === "water" || tags.water) return "water";
  return null;
};

// ─── Parse Overpass response into features ───────────────────

const parseOverpassResponse = (
  response: OverpassResponse,
  source: OSMCourseData["source"]
): OSMCourseData | null => {
  const features: OSMFeature[] = [];
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

  for (const el of response.elements) {
    if (!el.geometry || !el.tags) continue;
    const featureType = tagToFeatureType(el.tags);
    if (!featureType) continue;

    const coords: [number, number][] = el.geometry.map((g) => {
      minLat = Math.min(minLat, g.lat);
      maxLat = Math.max(maxLat, g.lat);
      minLng = Math.min(minLng, g.lon);
      maxLng = Math.max(maxLng, g.lon);
      return [g.lon, g.lat];
    });

    // Compute centroid
    const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    features.push({
      type: featureType,
      points: coords,
      centroidLat,
      centroidLng,
    });
  }

  // Need at least a few features to be useful
  if (features.length < 3) return null;

  return {
    courseName: "",
    features,
    bounds: { minLat, maxLat, minLng, maxLng },
    fetchedAt: Date.now(),
    source,
  };
};

// ─── GPS → SVG projection ────────────────────────────────────

export const projectToSVG = (
  coords: [number, number][],
  svgWidth: number,
  svgHeight: number,
  bounds: OSMCourseData["bounds"],
  padding = 0.04
): [number, number][] => {
  const lngRange = bounds.maxLng - bounds.minLng || 0.001;
  const latRange = bounds.maxLat - bounds.minLat || 0.001;

  // Initial projection into SVG space
  const projected: [number, number][] = coords.map(([lng, lat]) => [
    ((lng - bounds.minLng) / lngRange) * svgWidth * (1 - padding * 2) + svgWidth * padding,
    svgHeight -
      (((lat - bounds.minLat) / latRange) * svgHeight * (1 - padding * 2) + svgHeight * padding),
  ]);

  return projected;
};

/**
 * Auto-fit all projected feature polygons to fill the SVG canvas.
 * Call this ONCE after projecting all features, passing all point arrays.
 */
export const autoFitToCanvas = (
  allPolygons: [number, number][][],
  svgWidth: number,
  svgHeight: number,
  padding = 0.04
): [number, number][][] => {
  // Collect all points
  const allX = allPolygons.flatMap(p => p.map(c => c[0]));
  const allY = allPolygons.flatMap(p => p.map(c => c[1]));
  
  if (allX.length === 0) return allPolygons;

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const usedWidth = maxX - minX || 1;
  const usedHeight = maxY - minY || 1;

  // Scale up to fill canvas with padding
  const scaleX = (svgWidth * (1 - padding * 2)) / usedWidth;
  const scaleY = (svgHeight * (1 - padding * 2)) / usedHeight;
  const scale = Math.min(scaleX, scaleY); // uniform scale, no distortion

  // Center in canvas
  const offsetX = (svgWidth - usedWidth * scale) / 2;
  const offsetY = (svgHeight - usedHeight * scale) / 2;

  return allPolygons.map(polygon =>
    polygon.map(([x, y]) => [
      (x - minX) * scale + offsetX,
      (y - minY) * scale + offsetY,
    ] as [number, number])
  );
};

// ─── Approximate GPS coords from course location ─────────────
// Hardcoded coords for known courses; for unknowns we return null.

const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  "augusta-national": { lat: 33.5032, lng: -82.0225 },
  "pebble-beach": { lat: 36.5681, lng: -121.9498 },
  "st-andrews": { lat: 56.3428, lng: -2.8032 },
  "pinehurst-no2": { lat: 35.1901, lng: -79.4694 },
  "torrey-pines-south": { lat: 32.9002, lng: -117.2524 },
  "tpc-sawgrass": { lat: 30.1975, lng: -81.3946 },
  "bethpage-black": { lat: 40.7449, lng: -73.4539 },
  "cypress-point": { lat: 36.5811, lng: -121.9660 },
  "oakmont": { lat: 40.5275, lng: -79.8269 },
  "royal-melbourne": { lat: -37.8497, lng: 145.0599 },
  "merion": { lat: 40.0040, lng: -75.3098 },
  "shinnecock-hills": { lat: 40.8910, lng: -72.4440 },
  "royal-portrush": { lat: 55.2063, lng: -6.6558 },
  "muirfield": { lat: 56.0481, lng: -2.8176 },
  "carnoustie": { lat: 56.5011, lng: -2.7100 },
  "winged-foot": { lat: 40.9626, lng: -73.7866 },
  "riviera": { lat: 34.0472, lng: -118.5025 },
  "bandon-dunes": { lat: 43.1831, lng: -124.3835 },
  "pacific-dunes": { lat: 43.1798, lng: -124.3880 },
  "sand-valley": { lat: 44.2200, lng: -89.9100 },
  "streamsong-red": { lat: 27.6167, lng: -81.9500 },
  "streamsong-blue": { lat: 27.6167, lng: -81.9500 },
  "cape-kidnappers": { lat: -39.6400, lng: 177.0700 },
  "turnberry": { lat: 55.3217, lng: -4.8300 },
  "royal-county-down": { lat: 54.2200, lng: -5.8900 },
  "valderrama": { lat: 36.2900, lng: -5.3000 },
  "casa-de-campo": { lat: 18.4100, lng: -68.9600 },
};

export const getKnownCoords = (courseId: string): { lat: number; lng: number } | null =>
  KNOWN_COORDS[courseId] ?? null;

// ─── Public API: Tiered fetch ────────────────────────────────

export const fetchOSMCourseData = async (
  courseId: string,
  courseName: string,
  country: string
): Promise<{ data: OSMCourseData | null; tier: 1 | 2 | 3 | 4; fallbackReason: string | null }> => {
  // Check cache first
  const cached = getCachedOSM(courseName, country);
  if (cached) {
    return { data: cached, tier: cached.source === "overpass-name" ? 1 : 2, fallbackReason: null };
  }

  // Tier 1: Query by name
  const nameQuery = buildNameQuery(courseName);
  const nameResult = await fetchOverpass(nameQuery);
  if (nameResult) {
    const parsed = parseOverpassResponse(nameResult, "overpass-name");
    if (parsed) {
      parsed.courseName = courseName;
      setCachedOSM(courseName, country, parsed);
      return { data: parsed, tier: 1, fallbackReason: null };
    }
  }

  // Tier 2: Query by GPS coordinates
  const coords = getKnownCoords(courseId);
  if (coords) {
    const coordQuery = buildCoordQuery(coords.lat, coords.lng);
    const coordResult = await fetchOverpass(coordQuery);
    if (coordResult) {
      const parsed = parseOverpassResponse(coordResult, "overpass-coords");
      if (parsed) {
        parsed.courseName = courseName;
        setCachedOSM(courseName, country, parsed);
        return { data: parsed, tier: 2, fallbackReason: "Name lookup returned insufficient data; used GPS coordinates" };
      }
    }
    // Tier 3: no OSM data but have coords → procedural with real seed
    return { data: null, tier: 3, fallbackReason: "No OSM polygon data available; using coordinate-seeded approximate layout" };
  }

  // Tier 4: no coords either
  return { data: null, tier: 4, fallbackReason: "No OSM data or GPS coordinates available for this course" };
};
