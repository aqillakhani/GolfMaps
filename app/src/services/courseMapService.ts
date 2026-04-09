/**
 * Client for the course-api microservice (port 8001).
 * Fetches accurate GeoJSON course geometry via OSM Overpass + Shapely processing.
 */

import { ENV } from "../config/env";

const API_BASE = ENV.COURSE_API_URL;
const FETCH_TIMEOUT = 30000;

export interface CourseSearchResult {
  osm_id: number;
  osm_type: string;
  name: string;
  location: string | null;
  lat: number;
  lon: number;
}

export interface CourseMetadata {
  name: string;
  location: string | null;
  holes: number | null;
  par: number | null;
}

export interface CourseGeoJSON {
  metadata: CourseMetadata;
  geojson: GeoJSON.FeatureCollection;
}

const GEOJSON_CACHE_PREFIX = "course_geojson_";

function getCacheKey(osmType: string, osmId: number): string {
  return `${GEOJSON_CACHE_PREFIX}${osmType}_${osmId}`;
}

function getCached(osmType: string, osmId: number): CourseGeoJSON | null {
  try {
    const raw = localStorage.getItem(getCacheKey(osmType, osmId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache(osmType: string, osmId: number, data: CourseGeoJSON): void {
  try {
    localStorage.setItem(getCacheKey(osmType, osmId), JSON.stringify(data));
  } catch {
    // Storage full
  }
}

export async function searchCourses(query: string, limit = 10): Promise<CourseSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    clearTimeout(timer);
    return [];
  }
}

export async function fetchCourseGeoJSON(
  osmType: string,
  osmId: number
): Promise<CourseGeoJSON | null> {
  // Check cache
  const cached = getCached(osmType, osmId);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}/course/${osmType}/${osmId}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data: CourseGeoJSON = await res.json();
    if (!data.geojson?.features?.length) return null;
    setCache(osmType, osmId, data);
    return data;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * One-shot: search for a course by name, pick the best match, fetch its GeoJSON.
 */
export async function fetchCourseGeoJSONByName(
  courseName: string
): Promise<CourseGeoJSON | null> {
  // Try full name first, then progressively strip suffixes for better Nominatim matching
  const suffixes = [" Golf Links", " Golf Club", " Golf Course", " Country Club", " Golf Resort"];
  const queries = [courseName];
  for (const suffix of suffixes) {
    if (courseName.endsWith(suffix)) {
      queries.push(courseName.replace(suffix, ""));
      break;
    }
  }
  // Also try just the core name words (strip parentheticals)
  const stripped = courseName.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (stripped !== courseName && !queries.includes(stripped)) {
    queries.push(stripped);
  }

  for (const query of queries) {
    const results = await searchCourses(query, 3);
    if (results.length > 0) {
      const best = results[0];
      return fetchCourseGeoJSON(best.osm_type, best.osm_id);
    }
  }
  return null;
}

// ─── GeoJSON → OSMCourseData converter ──────────────────────
// Converts the microservice's GeoJSON response into the OSMCourseData
// format that the existing rendering pipeline expects.

import type { OSMCourseData, OSMFeature } from "./osmService";

const VALID_FEATURE_TYPES = new Set(["fairway", "green", "bunker", "water", "tee", "rough", "outline"]);

function extractCoords(geometry: any): [number, number][] {
  if (geometry.type === "Polygon") {
    return (geometry.coordinates[0] as number[][]).map(
      (c) => [c[0], c[1]] as [number, number]
    );
  }
  if (geometry.type === "MultiPolygon") {
    // Flatten: use the first (outer) ring of each polygon
    const coords: [number, number][] = [];
    for (const polygon of geometry.coordinates) {
      for (const c of polygon[0]) {
        coords.push([c[0], c[1]] as [number, number]);
      }
    }
    return coords;
  }
  if (geometry.type === "LineString") {
    return (geometry.coordinates as number[][]).map(
      (c) => [c[0], c[1]] as [number, number]
    );
  }
  if (geometry.type === "Point") {
    const c = geometry.coordinates as number[];
    return [[c[0], c[1]] as [number, number]];
  }
  return [];
}

export function geoJSONToOSMCourseData(
  courseGeoJSON: CourseGeoJSON
): OSMCourseData | null {
  const features: OSMFeature[] = [];
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const feature of courseGeoJSON.geojson.features) {
    const featureType = feature.properties?.type;
    if (!featureType || !VALID_FEATURE_TYPES.has(featureType)) continue;

    const coords = extractCoords(feature.geometry);
    if (coords.length < 1) continue;

    // Update bounds
    for (const [lng, lat] of coords) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    // Compute centroid
    const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    features.push({
      type: featureType as OSMFeature["type"],
      points: coords,
      centroidLat,
      centroidLng,
    });
  }

  if (features.length < 1) return null;

  return {
    courseName: courseGeoJSON.metadata.name || "",
    features,
    bounds: { minLat, maxLat, minLng, maxLng },
    fetchedAt: Date.now(),
    source: "overpass-name",
  };
}

/**
 * Fetch accurate course data from the microservice and return as OSMCourseData.
 * This is the main entry point for the existing rendering pipeline.
 */
export async function fetchAccurateCourseData(
  courseName: string
): Promise<OSMCourseData | null> {
  const geoJSON = await fetchCourseGeoJSONByName(courseName);
  if (!geoJSON) return null;
  return geoJSONToOSMCourseData(geoJSON);
}
