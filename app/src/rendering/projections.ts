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
      .filter((f) => f.geometry && (f.geometry as any).coordinates)
      .map((f) => ({
        ...f,
        geometry: rewindGeometry({
          ...f.geometry,
          coordinates: JSON.parse(JSON.stringify((f.geometry as any).coordinates)),
        }),
      })),
  };
}

export function createProjection(
  geojson: GeoJSON.FeatureCollection,
  width: number,
  height: number,
  padding: number = 20
): d3.GeoProjection {
  return d3.geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    geojson
  );
}
