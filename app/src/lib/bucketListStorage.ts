import { PosterStyleId } from "@/data/mockData";

export interface BucketListCourse {
  courseId: string;
  courseName: string;
  city: string;
  country: string;
  type: string; // Links / Parkland / Coastal / Sandbelt
}

export interface PlayedCourse extends BucketListCourse {
  playedDate: string; // ISO date
}

export interface BucketListData {
  wantToPlay: BucketListCourse[];
  played: PlayedCourse[];
}

const STORAGE_KEY = "fc_bucketlist";

const DEFAULT_WANT_TO_PLAY: BucketListCourse[] = [
  { courseId: "augusta-national", courseName: "Augusta National Golf Club", city: "Augusta", country: "USA", type: "Parkland" },
  { courseId: "pebble-beach", courseName: "Pebble Beach Golf Links", city: "Pebble Beach", country: "USA", type: "Coastal" },
  { courseId: "st-andrews", courseName: "St Andrews Old Course", city: "St Andrews", country: "Scotland", type: "Links" },
  { courseId: "royal-melbourne", courseName: "Royal Melbourne Golf Club", city: "Melbourne", country: "Australia", type: "Sandbelt" },
  { courseId: "cypress-point", courseName: "Cypress Point Club", city: "Pebble Beach", country: "USA", type: "Coastal" },
];

export const getBucketList = (): BucketListData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First launch — seed with defaults
      const initial: BucketListData = { wantToPlay: DEFAULT_WANT_TO_PLAY, played: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as BucketListData;
  } catch {
    return { wantToPlay: DEFAULT_WANT_TO_PLAY, played: [] };
  }
};

const save = (data: BucketListData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silent
  }
};

export const addToWantToPlay = (course: BucketListCourse) => {
  const data = getBucketList();
  if (data.wantToPlay.some((c) => c.courseId === course.courseId)) return;
  data.wantToPlay.unshift(course);
  save(data);
};

export const addToPlayed = (course: PlayedCourse) => {
  const data = getBucketList();
  if (data.played.some((c) => c.courseId === course.courseId)) return;
  // Also remove from wantToPlay if present
  data.wantToPlay = data.wantToPlay.filter((c) => c.courseId !== course.courseId);
  data.played.unshift(course);
  save(data);
};

export const removeFromWantToPlay = (courseId: string) => {
  const data = getBucketList();
  data.wantToPlay = data.wantToPlay.filter((c) => c.courseId !== courseId);
  save(data);
};

export const removeFromPlayed = (courseId: string) => {
  const data = getBucketList();
  data.played = data.played.filter((c) => c.courseId !== courseId);
  save(data);
};

export const isInBucketList = (courseId: string): boolean => {
  const data = getBucketList();
  return data.wantToPlay.some((c) => c.courseId === courseId);
};

export const isInPlayed = (courseId: string): boolean => {
  const data = getBucketList();
  return data.played.some((c) => c.courseId === courseId);
};

export const getCourseType = (courseId: string): string => {
  // Simple heuristic based on known course data
  const types: Record<string, string> = {
    "augusta-national": "Parkland",
    "pebble-beach": "Coastal",
    "st-andrews": "Links",
    "royal-melbourne": "Sandbelt",
    "cypress-point": "Coastal",
    "pinehurst-no2": "Parkland",
    "royal-county-down": "Links",
    "muirfield": "Links",
    "carnoustie": "Links",
    "royal-portrush": "Links",
    "turnberry": "Links",
    "shinnecock-hills": "Links",
    "bandon-dunes": "Links",
    "pacific-dunes": "Links",
    "bethpage-black": "Parkland",
    "torrey-pines-south": "Coastal",
    "tpc-sawgrass": "Parkland",
    "sand-valley": "Links",
    "kingston-heath": "Sandbelt",
    "merion": "Parkland",
    "oakmont": "Parkland",
    "winged-foot": "Parkland",
    "riviera": "Parkland",
    "cape-kidnappers": "Coastal",
    "valderrama": "Parkland",
    "casa-de-campo": "Coastal",
  };
  return types[courseId] || "Parkland";
};
