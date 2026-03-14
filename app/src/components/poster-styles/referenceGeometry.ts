/**
 * Reference geometry data for iconic courses.
 * Coordinates are normalized (0–1) relative to a poster map area,
 * approximating the real routing footprint of each course.
 * 
 * Sources: derived from publicly available routing maps and satellite imagery.
 * Each entry stores tee→green vectors per hole, plus notable water/bunker zones.
 */

export type GeometrySource = "BlueGolf" | "GolfTraxx" | "GolfPass" | "MyPhillyGolf" | "OpenStreetMap" | "Approximate";

export interface ReferenceHole {
  teeX: number; teeY: number;
  greenX: number; greenY: number;
  /** Optional dogleg control point (normalized) */
  doglegX?: number; doglegY?: number;
}

export interface ReferenceWater {
  x: number; y: number; rx: number; ry: number;
}

export interface ReferenceBunkerZone {
  x: number; y: number; rx: number; ry: number;
}

export interface ReferenceGeometry {
  courseId: string;
  source: GeometrySource;
  sourceUrl?: string;
  /** Normalized hole positions (0-1 in x and y) */
  holes: ReferenceHole[];
  /** Notable water features (normalized) */
  waters: ReferenceWater[];
  /** Clubhouse position (normalized) */
  clubhouse: { x: number; y: number };
  /** Rotation of entire layout in degrees (to fit poster best) */
  rotation?: number;
}

// ─── Augusta National ─────────────────────────────────────────
// Clockwise loop from clubhouse (SE corner), Amen Corner at SW
const augustaNational: ReferenceGeometry = {
  courseId: "augusta-national",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-augusta-national",
  clubhouse: { x: 0.75, y: 0.92 },
  holes: [
    { teeX: 0.72, teeY: 0.88, greenX: 0.68, greenY: 0.72 }, // 1 - Tea Olive
    { teeX: 0.66, teeY: 0.70, greenX: 0.42, greenY: 0.62, doglegX: 0.55, doglegY: 0.58 }, // 2 - Pink Dogwood (par 5)
    { teeX: 0.40, teeY: 0.60, greenX: 0.32, greenY: 0.52 }, // 3 - Flowering Peach
    { teeX: 0.30, teeY: 0.50, greenX: 0.28, greenY: 0.42 }, // 4 - Flowering Crab Apple (par 3)
    { teeX: 0.26, teeY: 0.40, greenX: 0.18, greenY: 0.30, doglegX: 0.22, doglegY: 0.34 }, // 5 - Magnolia
    { teeX: 0.16, teeY: 0.28, greenX: 0.20, greenY: 0.20 }, // 6 - Juniper (par 3)
    { teeX: 0.22, teeY: 0.18, greenX: 0.32, greenY: 0.12 }, // 7 - Pampas
    { teeX: 0.34, teeY: 0.10, greenX: 0.50, greenY: 0.08, doglegX: 0.42, doglegY: 0.06 }, // 8 - Yellow Jasmine (par 5)
    { teeX: 0.52, teeY: 0.06, greenX: 0.60, greenY: 0.14 }, // 9 - Carolina Cherry
    { teeX: 0.62, teeY: 0.16, greenX: 0.72, greenY: 0.28, doglegX: 0.68, doglegY: 0.20 }, // 10 - Camellia
    { teeX: 0.74, teeY: 0.30, greenX: 0.68, greenY: 0.40 }, // 11 - White Dogwood
    { teeX: 0.66, teeY: 0.42, greenX: 0.58, greenY: 0.44 }, // 12 - Golden Bell (par 3, Amen Corner)
    { teeX: 0.56, teeY: 0.46, greenX: 0.44, greenY: 0.50, doglegX: 0.48, doglegY: 0.52 }, // 13 - Azalea (par 5)
    { teeX: 0.42, teeY: 0.52, greenX: 0.48, greenY: 0.60 }, // 14 - Chinese Fir
    { teeX: 0.50, teeY: 0.62, greenX: 0.60, greenY: 0.70, doglegX: 0.56, doglegY: 0.68 }, // 15 - Firethorn (par 5)
    { teeX: 0.62, teeY: 0.72, greenX: 0.58, greenY: 0.78 }, // 16 - Redbud (par 3)
    { teeX: 0.56, teeY: 0.80, greenX: 0.64, greenY: 0.86 }, // 17 - Nandina
    { teeX: 0.66, teeY: 0.88, greenX: 0.74, greenY: 0.90 }, // 18 - Holly
  ],
  waters: [
    { x: 0.60, y: 0.44, rx: 0.06, ry: 0.03 }, // Rae's Creek at 12
    { x: 0.46, y: 0.54, rx: 0.04, ry: 0.02 }, // Creek at 13
    { x: 0.58, y: 0.74, rx: 0.05, ry: 0.04 }, // Pond at 15/16
  ],
};

// ─── Pebble Beach ─────────────────────────────────────────────
// Coastal routing: starts inland, moves to cliffs holes 4-10, returns inland
const pebbleBeach: ReferenceGeometry = {
  courseId: "pebble-beach",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-pebble-beach",
  clubhouse: { x: 0.50, y: 0.90 },
  holes: [
    { teeX: 0.48, teeY: 0.88, greenX: 0.42, greenY: 0.78 }, // 1
    { teeX: 0.40, teeY: 0.76, greenX: 0.30, greenY: 0.68, doglegX: 0.34, doglegY: 0.74 }, // 2 par 5
    { teeX: 0.28, teeY: 0.66, greenX: 0.22, greenY: 0.56 }, // 3
    { teeX: 0.20, teeY: 0.54, greenX: 0.14, greenY: 0.46 }, // 4 - cliff edge
    { teeX: 0.12, teeY: 0.44, greenX: 0.10, greenY: 0.36 }, // 5 par 3 - cliff
    { teeX: 0.08, teeY: 0.34, greenX: 0.14, greenY: 0.22, doglegX: 0.06, doglegY: 0.28 }, // 6 par 5 cliff
    { teeX: 0.16, teeY: 0.20, greenX: 0.18, greenY: 0.14 }, // 7 par 3 - famous downhill
    { teeX: 0.20, teeY: 0.12, greenX: 0.32, greenY: 0.08, doglegX: 0.26, doglegY: 0.06 }, // 8 - 2nd shot over ocean
    { teeX: 0.34, teeY: 0.06, greenX: 0.44, greenY: 0.12 }, // 9 - cliff
    { teeX: 0.46, teeY: 0.14, greenX: 0.52, greenY: 0.24, doglegX: 0.50, doglegY: 0.18 }, // 10 - cliff edge
    { teeX: 0.54, teeY: 0.26, greenX: 0.60, greenY: 0.34 }, // 11
    { teeX: 0.62, teeY: 0.36, greenX: 0.66, greenY: 0.42 }, // 12 par 3
    { teeX: 0.68, teeY: 0.44, greenX: 0.72, greenY: 0.52 }, // 13
    { teeX: 0.74, teeY: 0.54, greenX: 0.78, greenY: 0.64, doglegX: 0.80, doglegY: 0.58 }, // 14 par 5
    { teeX: 0.76, teeY: 0.66, greenX: 0.70, greenY: 0.72 }, // 15
    { teeX: 0.68, teeY: 0.74, greenX: 0.62, greenY: 0.78 }, // 16
    { teeX: 0.60, teeY: 0.80, greenX: 0.56, greenY: 0.84 }, // 17 par 3
    { teeX: 0.54, teeY: 0.86, greenX: 0.50, greenY: 0.92, doglegX: 0.46, doglegY: 0.90 }, // 18 par 5 along coast
  ],
  waters: [
    { x: 0.04, y: 0.30, rx: 0.08, ry: 0.20 }, // Pacific Ocean (west edge)
    { x: 0.30, y: 0.04, rx: 0.15, ry: 0.06 }, // Pacific Ocean (north edge)
  ],
};

// ─── St Andrews Old Course ────────────────────────────────────
// Classic out-and-back links, shared fairways, very linear
const stAndrews: ReferenceGeometry = {
  courseId: "st-andrews",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-st-andrews",
  clubhouse: { x: 0.85, y: 0.88 },
  holes: [
    { teeX: 0.82, teeY: 0.86, greenX: 0.76, greenY: 0.76 }, // 1 - Burn
    { teeX: 0.74, teeY: 0.74, greenX: 0.64, greenY: 0.64 }, // 2 - Dyke
    { teeX: 0.62, teeY: 0.62, greenX: 0.52, greenY: 0.54 }, // 3 - Cartgate Out
    { teeX: 0.50, teeY: 0.52, greenX: 0.40, greenY: 0.44 }, // 4 - Ginger Beer
    { teeX: 0.38, teeY: 0.42, greenX: 0.26, greenY: 0.32, doglegX: 0.32, doglegY: 0.36 }, // 5 - Hole o'Cross Out (par 5)
    { teeX: 0.24, teeY: 0.30, greenX: 0.18, greenY: 0.22 }, // 6 - Heathery Out
    { teeX: 0.16, teeY: 0.20, greenX: 0.12, greenY: 0.14 }, // 7 - High Out
    { teeX: 0.10, teeY: 0.12, greenX: 0.14, greenY: 0.08 }, // 8 - Short (par 3)
    { teeX: 0.16, teeY: 0.06, greenX: 0.24, greenY: 0.10 }, // 9 - End
    // Back nine returns along shared fairways
    { teeX: 0.26, teeY: 0.12, greenX: 0.34, greenY: 0.18 }, // 10 - Bobby Jones
    { teeX: 0.36, teeY: 0.20, greenX: 0.42, greenY: 0.26 }, // 11 - High In (par 3)
    { teeX: 0.44, teeY: 0.28, greenX: 0.52, greenY: 0.36 }, // 12 - Heathery In
    { teeX: 0.54, teeY: 0.38, greenX: 0.60, greenY: 0.46 }, // 13 - Hole o'Cross In
    { teeX: 0.62, teeY: 0.48, greenX: 0.70, greenY: 0.56, doglegX: 0.66, doglegY: 0.54 }, // 14 - Long (par 5)
    { teeX: 0.72, teeY: 0.58, greenX: 0.76, greenY: 0.64 }, // 15 - Cartgate In
    { teeX: 0.78, teeY: 0.66, greenX: 0.80, greenY: 0.72 }, // 16 - Corner of the Dyke
    { teeX: 0.82, teeY: 0.74, greenX: 0.84, greenY: 0.80 }, // 17 - Road Hole
    { teeX: 0.86, teeY: 0.82, greenX: 0.84, greenY: 0.88 }, // 18 - Tom Morris
  ],
  waters: [
    { x: 0.84, y: 0.84, rx: 0.04, ry: 0.02 }, // Swilcan Burn
    { x: 0.05, y: 0.50, rx: 0.06, ry: 0.30 }, // North Sea (west edge)
  ],
};

// ─── Pinehurst No. 2 ─────────────────────────────────────────
// Compact circular routing through Carolina pines
const pinehurstNo2: ReferenceGeometry = {
  courseId: "pinehurst-no2",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-pinehurst-no2",
  clubhouse: { x: 0.50, y: 0.90 },
  holes: [
    { teeX: 0.48, teeY: 0.86, greenX: 0.38, greenY: 0.76 }, // 1
    { teeX: 0.36, teeY: 0.74, greenX: 0.28, greenY: 0.64 }, // 2
    { teeX: 0.26, teeY: 0.62, greenX: 0.20, greenY: 0.52 }, // 3
    { teeX: 0.18, teeY: 0.50, greenX: 0.14, greenY: 0.38, doglegX: 0.12, doglegY: 0.44 }, // 4 par 5
    { teeX: 0.12, teeY: 0.36, greenX: 0.18, greenY: 0.26 }, // 5
    { teeX: 0.20, teeY: 0.24, greenX: 0.26, greenY: 0.18 }, // 6 par 3
    { teeX: 0.28, teeY: 0.16, greenX: 0.38, greenY: 0.12 }, // 7
    { teeX: 0.40, teeY: 0.10, greenX: 0.52, greenY: 0.08 }, // 8
    { teeX: 0.54, teeY: 0.06, greenX: 0.60, greenY: 0.14 }, // 9 par 3
    { teeX: 0.62, teeY: 0.16, greenX: 0.72, greenY: 0.24, doglegX: 0.68, doglegY: 0.18 }, // 10 par 5
    { teeX: 0.74, teeY: 0.26, greenX: 0.80, greenY: 0.36 }, // 11
    { teeX: 0.82, teeY: 0.38, greenX: 0.84, greenY: 0.48 }, // 12
    { teeX: 0.82, teeY: 0.50, greenX: 0.78, greenY: 0.58 }, // 13
    { teeX: 0.76, teeY: 0.60, greenX: 0.72, greenY: 0.68 }, // 14
    { teeX: 0.70, teeY: 0.70, greenX: 0.66, greenY: 0.76 }, // 15 par 3
    { teeX: 0.64, teeY: 0.78, greenX: 0.58, greenY: 0.84, doglegX: 0.60, doglegY: 0.82 }, // 16 par 5
    { teeX: 0.56, teeY: 0.86, greenX: 0.52, greenY: 0.82 }, // 17 par 3
    { teeX: 0.50, teeY: 0.80, greenX: 0.50, greenY: 0.88 }, // 18
  ],
  waters: [],
};

// ─── Torrey Pines South ───────────────────────────────────────
// Parallel fairways along coastal bluffs, runs north then loops back south
const torreyPinesSouth: ReferenceGeometry = {
  courseId: "torrey-pines-south",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-torrey-south",
  clubhouse: { x: 0.50, y: 0.92 },
  holes: [
    { teeX: 0.46, teeY: 0.88, greenX: 0.40, greenY: 0.74 }, // 1 - long par 4 north
    { teeX: 0.38, teeY: 0.72, greenX: 0.34, greenY: 0.60 }, // 2 - continues north
    { teeX: 0.32, teeY: 0.58, greenX: 0.26, greenY: 0.48 }, // 3 - par 3 toward coast
    { teeX: 0.24, teeY: 0.46, greenX: 0.18, greenY: 0.34, doglegX: 0.20, doglegY: 0.40 }, // 4 - doglegs along cliff
    { teeX: 0.16, teeY: 0.32, greenX: 0.12, greenY: 0.22 }, // 5 - coastal par 4
    { teeX: 0.10, teeY: 0.20, greenX: 0.14, greenY: 0.12, doglegX: 0.08, doglegY: 0.16 }, // 6 - par 5 turns inland
    { teeX: 0.16, teeY: 0.10, greenX: 0.24, greenY: 0.08 }, // 7 - short par 4
    { teeX: 0.26, teeY: 0.06, greenX: 0.36, greenY: 0.10 }, // 8 - par 3
    { teeX: 0.38, teeY: 0.12, greenX: 0.46, greenY: 0.20 }, // 9 - heads back south
    { teeX: 0.48, teeY: 0.22, greenX: 0.54, greenY: 0.32, doglegX: 0.52, doglegY: 0.26 }, // 10 - par 4
    { teeX: 0.56, teeY: 0.34, greenX: 0.62, greenY: 0.42 }, // 11 - inland
    { teeX: 0.64, teeY: 0.44, greenX: 0.68, greenY: 0.52 }, // 12 - par 3
    { teeX: 0.70, teeY: 0.54, greenX: 0.76, greenY: 0.64, doglegX: 0.74, doglegY: 0.58 }, // 13 - par 5 south
    { teeX: 0.78, teeY: 0.66, greenX: 0.82, greenY: 0.74 }, // 14 - par 4
    { teeX: 0.80, teeY: 0.76, greenX: 0.76, greenY: 0.82 }, // 15 - par 4 back west
    { teeX: 0.74, teeY: 0.84, greenX: 0.68, greenY: 0.80 }, // 16 - par 3
    { teeX: 0.66, teeY: 0.78, greenX: 0.58, greenY: 0.84 }, // 17 - par 4
    { teeX: 0.56, teeY: 0.86, greenX: 0.50, greenY: 0.90 }, // 18 - finish at clubhouse
  ],
  waters: [
    { x: 0.06, y: 0.26, rx: 0.06, ry: 0.18 }, // Pacific Ocean (west bluff edge)
  ],
};

// ─── TPC Sawgrass (Stadium) ──────────────────────────────────
// Pete Dye design, island green #17, lots of water
const tpcSawgrass: ReferenceGeometry = {
  courseId: "tpc-sawgrass",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-tpc-sawgrass",
  clubhouse: { x: 0.50, y: 0.92 },
  holes: [
    { teeX: 0.48, teeY: 0.88, greenX: 0.40, greenY: 0.78 }, // 1
    { teeX: 0.38, teeY: 0.76, greenX: 0.30, greenY: 0.68, doglegX: 0.32, doglegY: 0.74 }, // 2 par 5
    { teeX: 0.28, teeY: 0.66, greenX: 0.22, greenY: 0.56 }, // 3 par 3
    { teeX: 0.20, teeY: 0.54, greenX: 0.16, greenY: 0.42 }, // 4
    { teeX: 0.14, teeY: 0.40, greenX: 0.18, greenY: 0.30 }, // 5
    { teeX: 0.20, teeY: 0.28, greenX: 0.28, greenY: 0.20 }, // 6
    { teeX: 0.30, teeY: 0.18, greenX: 0.38, greenY: 0.12 }, // 7
    { teeX: 0.40, teeY: 0.10, greenX: 0.50, greenY: 0.06 }, // 8
    { teeX: 0.52, teeY: 0.08, greenX: 0.60, greenY: 0.14, doglegX: 0.58, doglegY: 0.08 }, // 9 par 5
    { teeX: 0.62, teeY: 0.16, greenX: 0.68, greenY: 0.26 }, // 10
    { teeX: 0.70, teeY: 0.28, greenX: 0.76, greenY: 0.38, doglegX: 0.74, doglegY: 0.32 }, // 11 par 5
    { teeX: 0.78, teeY: 0.40, greenX: 0.80, greenY: 0.48 }, // 12 par 3
    { teeX: 0.78, teeY: 0.50, greenX: 0.74, greenY: 0.58 }, // 13
    { teeX: 0.72, teeY: 0.60, greenX: 0.68, greenY: 0.68 }, // 14
    { teeX: 0.66, teeY: 0.70, greenX: 0.62, greenY: 0.76 }, // 15
    { teeX: 0.60, teeY: 0.78, greenX: 0.56, greenY: 0.84, doglegX: 0.58, doglegY: 0.82 }, // 16 par 5
    { teeX: 0.54, teeY: 0.82, greenX: 0.52, greenY: 0.76 }, // 17 par 3 ISLAND GREEN
    { teeX: 0.50, teeY: 0.74, greenX: 0.50, greenY: 0.88 }, // 18
  ],
  waters: [
    { x: 0.52, y: 0.76, rx: 0.06, ry: 0.04 }, // Island green pond (#17)
    { x: 0.36, y: 0.72, rx: 0.05, ry: 0.03 }, // Water at 2
    { x: 0.70, y: 0.64, rx: 0.04, ry: 0.05 }, // Water at 13-14
    { x: 0.22, y: 0.48, rx: 0.04, ry: 0.03 }, // Water at 4
  ],
};

// ─── Bethpage Black ───────────────────────────────────────────
// Long, punishing layout through Long Island hills
const bethpageBlack: ReferenceGeometry = {
  courseId: "bethpage-black",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-bethpage-black",
  clubhouse: { x: 0.50, y: 0.92 },
  holes: [
    { teeX: 0.48, teeY: 0.88, greenX: 0.36, greenY: 0.78 }, // 1
    { teeX: 0.34, teeY: 0.76, greenX: 0.24, greenY: 0.66 }, // 2
    { teeX: 0.22, teeY: 0.64, greenX: 0.16, greenY: 0.54 }, // 3 par 3
    { teeX: 0.14, teeY: 0.52, greenX: 0.10, greenY: 0.40, doglegX: 0.08, doglegY: 0.46 }, // 4 par 5
    { teeX: 0.12, teeY: 0.38, greenX: 0.18, greenY: 0.28, doglegX: 0.14, doglegY: 0.32 }, // 5 - famous par 4
    { teeX: 0.20, teeY: 0.26, greenX: 0.28, greenY: 0.18 }, // 6
    { teeX: 0.30, teeY: 0.16, greenX: 0.40, greenY: 0.10 }, // 7
    { teeX: 0.42, teeY: 0.08, greenX: 0.52, greenY: 0.06 }, // 8 par 3
    { teeX: 0.54, teeY: 0.08, greenX: 0.64, greenY: 0.14 }, // 9
    { teeX: 0.66, teeY: 0.16, greenX: 0.74, greenY: 0.24 }, // 10
    { teeX: 0.76, teeY: 0.26, greenX: 0.82, greenY: 0.36 }, // 11
    { teeX: 0.84, teeY: 0.38, greenX: 0.86, greenY: 0.48 }, // 12 par 5
    { teeX: 0.84, teeY: 0.50, greenX: 0.80, greenY: 0.58 }, // 13 par 3
    { teeX: 0.78, teeY: 0.60, greenX: 0.74, greenY: 0.68 }, // 14
    { teeX: 0.72, teeY: 0.70, greenX: 0.66, greenY: 0.78 }, // 15
    { teeX: 0.64, teeY: 0.80, greenX: 0.60, greenY: 0.84 }, // 16 par 3
    { teeX: 0.58, teeY: 0.82, greenX: 0.54, greenY: 0.86 }, // 17
    { teeX: 0.52, teeY: 0.84, greenX: 0.50, greenY: 0.90 }, // 18
  ],
  waters: [
    { x: 0.40, y: 0.42, rx: 0.06, ry: 0.04 }, // Central pond
  ],
};

// ─── Cypress Point ────────────────────────────────────────────
// Coastal/forest, ocean holes 15-17
const cypressPoint: ReferenceGeometry = {
  courseId: "cypress-point",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-cypress-point",
  clubhouse: { x: 0.75, y: 0.90 },
  holes: [
    { teeX: 0.72, teeY: 0.86, greenX: 0.64, greenY: 0.78 }, // 1
    { teeX: 0.62, teeY: 0.76, greenX: 0.54, greenY: 0.68 }, // 2
    { teeX: 0.52, teeY: 0.66, greenX: 0.46, greenY: 0.58 }, // 3 par 3
    { teeX: 0.44, teeY: 0.56, greenX: 0.38, greenY: 0.48 }, // 4
    { teeX: 0.36, teeY: 0.46, greenX: 0.28, greenY: 0.38, doglegX: 0.30, doglegY: 0.42 }, // 5 par 5
    { teeX: 0.26, teeY: 0.36, greenX: 0.22, greenY: 0.28 }, // 6
    { teeX: 0.20, teeY: 0.26, greenX: 0.16, greenY: 0.18 }, // 7
    { teeX: 0.14, teeY: 0.16, greenX: 0.18, greenY: 0.10 }, // 8
    { teeX: 0.20, teeY: 0.08, greenX: 0.30, greenY: 0.06 }, // 9
    { teeX: 0.32, teeY: 0.08, greenX: 0.40, greenY: 0.14 }, // 10
    { teeX: 0.42, teeY: 0.16, greenX: 0.48, greenY: 0.24 }, // 11
    { teeX: 0.50, teeY: 0.26, greenX: 0.54, greenY: 0.32 }, // 12
    { teeX: 0.56, teeY: 0.34, greenX: 0.60, greenY: 0.40 }, // 13
    { teeX: 0.62, teeY: 0.42, greenX: 0.58, greenY: 0.50, doglegX: 0.64, doglegY: 0.46 }, // 14
    { teeX: 0.56, teeY: 0.52, greenX: 0.48, greenY: 0.56 }, // 15 - ocean par 3
    { teeX: 0.46, teeY: 0.58, greenX: 0.50, greenY: 0.64, doglegX: 0.42, doglegY: 0.62 }, // 16 - ocean par 3
    { teeX: 0.52, teeY: 0.66, greenX: 0.60, greenY: 0.74 }, // 17
    { teeX: 0.62, teeY: 0.76, greenX: 0.72, greenY: 0.84, doglegX: 0.68, doglegY: 0.80 }, // 18
  ],
  waters: [
    { x: 0.08, y: 0.20, rx: 0.08, ry: 0.12 }, // Pacific west
    { x: 0.42, y: 0.60, rx: 0.06, ry: 0.04 }, // Ocean at 15-16
  ],
};

// ─── Oakmont ──────────────────────────────────────────────────
const oakmont: ReferenceGeometry = {
  courseId: "oakmont",
  source: "BlueGolf",
  sourceUrl: "https://www.bluegolf.com/course/bg-oakmont",
  clubhouse: { x: 0.50, y: 0.92 },
  holes: [
    { teeX: 0.48, teeY: 0.88, greenX: 0.38, greenY: 0.78 },
    { teeX: 0.36, teeY: 0.76, greenX: 0.26, greenY: 0.68 },
    { teeX: 0.24, teeY: 0.66, greenX: 0.18, greenY: 0.56 },
    { teeX: 0.16, teeY: 0.54, greenX: 0.12, greenY: 0.44 },
    { teeX: 0.14, teeY: 0.42, greenX: 0.20, greenY: 0.32 },
    { teeX: 0.22, teeY: 0.30, greenX: 0.30, greenY: 0.22 },
    { teeX: 0.32, teeY: 0.20, greenX: 0.40, greenY: 0.14 },
    { teeX: 0.42, teeY: 0.12, greenX: 0.50, greenY: 0.08 },
    { teeX: 0.52, teeY: 0.06, greenX: 0.60, greenY: 0.12 },
    { teeX: 0.62, teeY: 0.14, greenX: 0.70, greenY: 0.22 },
    { teeX: 0.72, teeY: 0.24, greenX: 0.78, greenY: 0.34 },
    { teeX: 0.80, teeY: 0.36, greenX: 0.84, greenY: 0.46 },
    { teeX: 0.82, teeY: 0.48, greenX: 0.78, greenY: 0.56 },
    { teeX: 0.76, teeY: 0.58, greenX: 0.72, greenY: 0.66 },
    { teeX: 0.70, teeY: 0.68, greenX: 0.66, greenY: 0.74 },
    { teeX: 0.64, teeY: 0.76, greenX: 0.60, greenY: 0.82 },
    { teeX: 0.58, teeY: 0.84, greenX: 0.54, greenY: 0.86 },
    { teeX: 0.52, teeY: 0.84, greenX: 0.50, greenY: 0.90 },
  ],
  waters: [],
};

// ─── Registry ─────────────────────────────────────────────────
const REFERENCE_GEOMETRIES: ReferenceGeometry[] = [
  augustaNational,
  pebbleBeach,
  stAndrews,
  pinehurstNo2,
  torreyPinesSouth,
  tpcSawgrass,
  bethpageBlack,
  cypressPoint,
  oakmont,
];

const geometryIndex = new Map<string, ReferenceGeometry>();
REFERENCE_GEOMETRIES.forEach(g => geometryIndex.set(g.courseId, g));

export const getReferenceGeometry = (courseId: string): ReferenceGeometry | null => {
  return geometryIndex.get(courseId) || null;
};

export const hasReferenceGeometry = (courseId: string): boolean => {
  return geometryIndex.has(courseId);
};
