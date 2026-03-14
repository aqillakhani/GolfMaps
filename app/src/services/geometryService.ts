/**
 * Golf Geometry Service client.
 *
 * Fetches accurate course geometry from the local geometry service
 * (BlueGolf data + geometric estimation), falling back to OSM if unavailable.
 */

import { OSMCourseData, OSMFeature } from "./osmService";

const GEOMETRY_API = "http://localhost:8000/api/v1";
const FETCH_TIMEOUT = 15000;

interface GeometryAPIResponse {
  features: {
    type: "fairway" | "green" | "bunker" | "water" | "tee";
    points: number[][]; // [lon, lat] pairs
    centroid: number[]; // [lon, lat]
    hole_number?: number;
  }[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  timestamp: number;
  source: string;
  course_name: string;
  hole_count: number;
  confidence: number;
}

/**
 * Fetch course geometry from the local geometry service.
 * Returns data in the same OSMCourseData format the app already uses.
 */
export const fetchGeometryService = async (
  courseName: string,
  location?: string
): Promise<OSMCourseData | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${GEOMETRY_API}/course/geometry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_name: courseName,
        location: location || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const data: GeometryAPIResponse = await res.json();

    if (!data.features || data.features.length < 3) return null;

    // Convert to OSMCourseData format
    const features: OSMFeature[] = data.features.map((f) => {
      const points: [number, number][] = f.points.map(
        (p) => [p[0], p[1]] as [number, number]
      );
      return {
        type: f.type,
        points,
        centroidLat: f.centroid[1],
        centroidLng: f.centroid[0],
      };
    });

    return {
      courseName: data.course_name,
      features,
      bounds: {
        minLat: data.bounds.minLat,
        maxLat: data.bounds.maxLat,
        minLng: data.bounds.minLng,
        maxLng: data.bounds.maxLng,
      },
      fetchedAt: data.timestamp,
      source: "overpass-name", // Use existing source type so downstream code works
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
};
