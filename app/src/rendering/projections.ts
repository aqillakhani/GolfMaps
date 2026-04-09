import * as d3 from "d3";

function rewindRing(ring: number[][], clockwise: boolean): number[][] {
  let area = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  const isClockwise = area < 0;
  if (isClockwise !== clockwise) {
    ring.reverse();
  }
  return ring;
}

function rewindGeometry(geom: GeoJSON.Geometry): GeoJSON.Geometry {
  if (geom.type === "Polygon") {
    const coords = geom.coordinates as number[][][];
    coords[0] = rewindRing(coords[0], true);
    for (let i = 1; i < coords.length; i++) {
      coords[i] = rewindRing(coords[i], false);
    }
  } else if (geom.type === "MultiPolygon") {
    const coords = geom.coordinates as number[][][][];
    for (const polygon of coords) {
      polygon[0] = rewindRing(polygon[0], true);
      for (let i = 1; i < polygon.length; i++) {
        polygon[i] = rewindRing(polygon[i], false);
      }
    }
  }
  return geom;
}

export function rewindFeatureCollection(
  fc: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  return {
    ...fc,
    features: fc.features
      .filter((f) => {
        if (!f.geometry) return false;
        // Accept Polygon, MultiPolygon, LineString, Point (have coordinates)
        // Also accept GeometryCollection (has geometries array)
        return (f.geometry as any).coordinates || (f.geometry as any).geometries;
      })
      .map((f) => {
        // GeometryCollections and types without coordinates pass through unmodified
        if (!(f.geometry as any).coordinates) return f;
        return {
          ...f,
          geometry: rewindGeometry({
            ...f.geometry,
            coordinates: JSON.parse(JSON.stringify((f.geometry as any).coordinates)),
          }),
        };
      }),
  };
}

export interface PaddingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Rectangle to avoid when positioning the map (e.g., scorecard overlay). */
export interface AvoidZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createProjection(
  geojson: GeoJSON.FeatureCollection,
  width: number,
  height: number,
  padding: number | PaddingBox = 20,
  avoidZone?: AvoidZone,
): d3.GeoProjection {
  // Use only core golf features for projection bounds
  const GOLF_TYPES = new Set(["fairway", "green", "bunker", "tee", "rough", "outline"]);
  const golfFeatures = geojson.features.filter(
    (f) => f.properties?.type && GOLF_TYPES.has(f.properties.type as string)
  );

  const projectionSource: GeoJSON.FeatureCollection = golfFeatures.length > 0
    ? { type: "FeatureCollection", features: golfFeatures }
    : geojson;

  const pad = typeof padding === "number"
    ? padding
    : Math.min(padding.top, padding.right, padding.bottom, padding.left);

  // Start with full-size projection
  const projection = d3.geoMercator().fitExtent(
    [[pad, pad], [width - pad, height - pad]],
    projectionSource
  );

  if (!avoidZone) return projection;

  // Check if projected features overlap the avoid zone
  const path = d3.geoPath().projection(projection);
  const bounds = path.bounds(projectionSource);
  if (!bounds || !isFinite(bounds[0][0])) return projection;

  const [mapMin, mapMax] = bounds;
  const zx2 = avoidZone.x + avoidZone.width;
  const zy2 = avoidZone.y + avoidZone.height;

  // Check if the map's projected bounds overlap the avoid zone
  const overlapsX = mapMax[0] > avoidZone.x && mapMin[0] < zx2;
  const overlapsY = mapMax[1] > avoidZone.y && mapMin[1] < zy2;

  if (!(overlapsX && overlapsY)) return projection;

  // Overlap detected — scale down and shift to avoid the zone.
  // Determine which direction to shift (least displacement).
  const mapW = mapMax[0] - mapMin[0];
  const mapH = mapMax[1] - mapMin[1];

  // How much the map intrudes into the avoid zone
  const overlapRight = mapMax[0] - avoidZone.x;  // how far map extends past zone left edge
  const overlapBottom = mapMax[1] - avoidZone.y;  // (not used — zone is at top)
  const overlapTop = zy2 - mapMin[1];             // how far map extends above zone bottom edge

  // The zone is in the top-right corner. We can:
  // 1. Shift left (costs overlapRight pixels)
  // 2. Shift down (costs overlapTop pixels)
  // 3. Scale down to fit in the L-shaped remaining space
  // Use a combination: scale down slightly and shift to avoid

  // Available L-shaped space: full width below zone, or (width - zone.width) at zone height
  const availW1 = width - 2 * pad;                       // full width (below zone)
  const availH1 = height - 2 * pad - avoidZone.height;   // height below zone
  const availW2 = avoidZone.x - 2 * pad;                 // width left of zone (at zone height)
  const availH2 = height - 2 * pad;                       // full height

  // Pick the rectangle that gives the largest area
  const area1 = availW1 * availH1; // use full width, shift down below zone
  const area2 = availW2 * availH2; // use left portion, keep full height

  if (area1 >= area2) {
    // Shift map below the avoid zone
    return d3.geoMercator().fitExtent(
      [[pad, avoidZone.height + pad], [width - pad, height - pad]],
      projectionSource
    );
  } else {
    // Shrink map to fit left of the avoid zone
    return d3.geoMercator().fitExtent(
      [[pad, pad], [avoidZone.x - pad, height - pad]],
      projectionSource
    );
  }
}
