import { Course, MOCK_COURSES, ValidationSource } from "@/data/mockData";

export interface ValidatedCourse extends Course {
  validated: boolean;
  bluegolfId?: string;
  matchConfidence: number; // 0-1
  validationSource: ValidationSource;
  sourceUrl?: string;
}

export interface SearchResult {
  courses: ValidatedCourse[];
  hasMultipleMatches: boolean;
  query: string;
}

// Simple in-memory cache
const cache = new Map<string, { result: SearchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validated course cache (persists verified lookups)
const validatedCache = new Map<string, ValidatedCourse>();

const getCachedResult = (key: string): SearchResult | null => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.result;
  cache.delete(key);
  return null;
};

const setCachedResult = (key: string, result: SearchResult) => {
  cache.set(key, { result, timestamp: Date.now() });
};

const computeConfidence = (course: Course, query: string): number => {
  const q = query.toLowerCase();
  const name = course.name.toLowerCase();
  const city = course.city.toLowerCase();
  const country = course.country.toLowerCase();

  if (name === q) return 1.0;
  if (name.startsWith(q)) return 0.95;
  if (name.includes(q)) return 0.8;
  if (city === q || country === q) return 0.6;
  if (city.includes(q) || country.includes(q)) return 0.4;
  return 0.3;
};

/**
 * Determine validation source for a course.
 * Priority: BlueGolf > GolfTraxx > GolfPass > MyPhillyGolf
 */
const resolveValidationSource = (course: Course): { source: ValidationSource; sourceUrl?: string } => {
  // BlueGolf: primary — courses with bluegolfId are BlueGolf-verified
  if (course.bluegolfId) {
    return {
      source: "BlueGolf",
      sourceUrl: `https://www.bluegolf.com/course/${course.bluegolfId}`,
    };
  }

  // Fallback heuristic: validated courses without bluegolfId get assigned fallback sources
  if (course.validated) {
    // Simulate fallback source assignment based on region
    const region = course.region?.toLowerCase() || "";
    const country = course.country?.toLowerCase() || "";

    if (region.includes("pennsylvania") || region.includes("philly") || course.city.toLowerCase().includes("philadelphia")) {
      return { source: "MyPhillyGolf", sourceUrl: "https://www.myphillygolf.com" };
    }
    if (country === "usa" || country === "united states") {
      return { source: "GolfTraxx", sourceUrl: "https://www.golftraxx.com" };
    }
    return { source: "GolfPass", sourceUrl: "https://www.golfpass.com" };
  }

  return { source: null };
};

/**
 * Search courses across all mock sources.
 * BlueGolf-validated courses appear first, then fallback-validated, then unverified.
 */
export const searchCourses = (query: string): SearchResult => {
  if (query.length < 2) return { courses: [], hasMultipleMatches: false, query };

  const cacheKey = query.toLowerCase().trim();
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const q = cacheKey;

  // Search all courses (simulates querying BlueGolf primary + fallback sources)
  const matches = MOCK_COURSES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.designer.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
  ).map((c) => {
    const { source, sourceUrl } = resolveValidationSource(c);
    return {
      ...c,
      validated: !!source,
      matchConfidence: computeConfidence(c, query),
      validationSource: source,
      sourceUrl,
    };
  });

  // Sort: BlueGolf first, then other validated, then unverified; within each tier by confidence
  const sourcePriority = (s: ValidationSource): number => {
    if (s === "BlueGolf") return 4;
    if (s === "GolfTraxx") return 3;
    if (s === "GolfPass") return 2;
    if (s === "MyPhillyGolf") return 1;
    return 0;
  };

  matches.sort((a, b) => {
    const aPri = sourcePriority(a.validationSource);
    const bPri = sourcePriority(b.validationSource);
    if (aPri !== bPri) return bPri - aPri;
    return b.matchConfidence - a.matchConfidence;
  });

  // Check for disambiguation
  const topName = matches[0]?.name.toLowerCase().replace(/\(.*\)/, "").trim();
  const hasMultipleMatches = matches.length > 1 && matches.filter(
    (m) => m.name.toLowerCase().replace(/\(.*\)/, "").trim().includes(topName?.split(" ")[0] || "")
  ).length > 1;

  const result: SearchResult = { courses: matches, hasMultipleMatches, query };
  setCachedResult(cacheKey, result);
  return result;
};

/**
 * Validate a specific course by ID. Returns full validated record with source traceability.
 */
export const validateCourse = (courseId: string): ValidatedCourse | null => {
  // Check validated cache first
  const cached = validatedCache.get(courseId);
  if (cached) return cached;

  const course = MOCK_COURSES.find((c) => c.id === courseId);
  if (!course) return null;

  const { source, sourceUrl } = resolveValidationSource(course);
  const validated: ValidatedCourse = {
    ...course,
    validated: !!source,
    matchConfidence: 1.0,
    validationSource: source,
    sourceUrl,
  };

  // Cache for repeat lookups
  if (validated.validated) {
    validatedCache.set(courseId, validated);
  }

  return validated;
};

/**
 * Get the display label for a validation source
 */
export const getSourceLabel = (source: ValidationSource): string => {
  if (!source) return "Unverified";
  return `Verified (${source})`;
};

/**
 * Get the source badge color class
 */
export const getSourceBadgeVariant = (source: ValidationSource): "default" | "secondary" | "outline" => {
  if (source === "BlueGolf") return "default";
  if (source) return "secondary";
  return "outline";
};
