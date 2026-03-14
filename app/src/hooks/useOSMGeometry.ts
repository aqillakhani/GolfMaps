import { useState, useEffect, useRef } from "react";
import { OSMCourseData } from "@/services/osmService";
import { fetchCourseGeoJSONByName, geoJSONToOSMCourseData } from "@/services/courseMapService";
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
        const geoData = await fetchCourseGeoJSONByName(course.name);
        if (cancelled) return;

        if (geoData && geoData.geojson.features.length > 0) {
          const osmData = geoJSONToOSMCourseData(geoData);
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
