import { useState, useEffect, useRef } from "react";
import { OSMCourseData } from "@/services/osmService";
import { fetchCourseGeoJSONByName, fetchCourseGeoJSON, geoJSONToOSMCourseData } from "@/services/courseMapService";
import { Course } from "@/data/mockData";

export interface OSMGeometryState {
  osmData: OSMCourseData | null;
  geojson: GeoJSON.FeatureCollection | null;
  loading: boolean;
  tier: 1 | 2 | 3 | 4;
  fallbackReason: string | null;
}

/**
 * Hook to fetch course geometry from the course-api microservice.
 * No fallbacks — if the microservice is unavailable, shows an error.
 */
export const useOSMGeometry = (course: Course | null): OSMGeometryState => {
  const [state, setState] = useState<OSMGeometryState>({
    osmData: null,
    geojson: null,
    loading: true,
    tier: 3,
    fallbackReason: null,
  });
  const courseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!course) {
      setState({ osmData: null, geojson: null, loading: false, tier: 4, fallbackReason: "No course selected" });
      return;
    }

    if (courseIdRef.current === course.id && !state.loading) return;
    courseIdRef.current = course.id;

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const fetchData = async () => {
      try {
        // If this course came from the API search, use the OSM ID directly
        const osmMatch = course.id.match(/^osm-(node|way|relation)-(\d+)$/);
        const geoData = osmMatch
          ? await fetchCourseGeoJSON(osmMatch[1], parseInt(osmMatch[2], 10))
          : await fetchCourseGeoJSONByName(course.name);
        if (cancelled) return;

        if (geoData && geoData.geojson.features.length > 0) {
          const osmData = geoJSONToOSMCourseData(geoData);
          // Enrich course with metadata from the API if available
          if (geoData.metadata) {
            if (geoData.metadata.name && !course.name) course.name = geoData.metadata.name;
            if (geoData.metadata.holes) course.holes = geoData.metadata.holes;
            if (geoData.metadata.par) course.par = geoData.metadata.par;
          }
          setState({
            osmData,
            geojson: geoData.geojson,
            loading: false,
            tier: 1,
            fallbackReason: null,
          });
        } else {
          const msg = "No course geometry found in OpenStreetMap";
          console.error(`[useOSMGeometry] ${msg} for "${course.name}"`);
          setState({
            osmData: null,
            geojson: null,
            loading: false,
            tier: 4,
            fallbackReason: msg,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const msg = `Course API error: ${err instanceof Error ? err.message : "microservice unavailable"}. Is course-api running on port 8001?`;
        console.error(`[useOSMGeometry] ${msg}`);
        setState({
          osmData: null,
          geojson: null,
          loading: false,
          tier: 4,
          fallbackReason: msg,
        });
      }
    };

    fetchData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  return state;
};
