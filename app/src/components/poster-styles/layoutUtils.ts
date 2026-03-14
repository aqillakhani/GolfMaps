import { Course } from "@/data/mockData";
import { getReferenceGeometry, GeometrySource, ReferenceGeometry } from "./referenceGeometry";
import { createAuditRecord, clearAuditForCourse } from "@/services/courseAudit";
import { OSMCourseData, projectToSVG, autoFitToCanvas, getKnownCoords } from "@/services/osmService";

const hashStr = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number, i: number): number => {
  const x = Math.sin(seed + i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export interface HoleLayout {
  teeX: number; teeY: number;
  greenX: number; greenY: number;
  fairwayPath: string;
  fairwayBlob: string;
  greenRx: number; greenRy: number; greenRot: number;
  bunkers: { x: number; y: number; rx: number; ry: number; rot: number }[];
  trees: { x: number; y: number; r: number }[];
  par: number;
  yards: number;
}

export interface CourseLayout {
  holes: HoleLayout[];
  waters: { x: number; y: number; rx: number; ry: number; path: string }[];
  clubhouse: { x: number; y: number };
  cartPaths: string[];
  routingLine: string;
  roughPatches: { x: number; y: number; rx: number; ry: number; rot: number }[];
  front9: { hole: number; yards: number; par: number }[];
  back9: { hole: number; yards: number; par: number }[];
  r: (i: number) => number;
  mapBounds?: { x: number; y: number; width: number; height: number };
  debugInfo: {
    seed: number;
    holeCount: number;
    totalYardage: number;
    parDist: string;
    geometrySource: GeometrySource;
    geometryMode: "Reference" | "Approximate";
  };
}

// Cache key includes course.id + location hash for hygiene
interface CacheEntry {
  layout: CourseLayout;
  locationHash: number;
}
const layoutCache = new Map<string, CacheEntry>();

/** Purge cached geometry for a course (call when user changes selection). */
export const purgeLayoutCache = (courseId: string): void => {
  layoutCache.delete(courseId);
  clearAuditForCourse(courseId);
};

// ─── Safe-zone system ─────────────────────────────────────────
export interface SafeZone {
  x: number; y: number; width: number; height: number; label: string;
}

/** Canvas is 400×560. Safe zones are reserved for scorecard + title. */
export const POSTER_WIDTH = 400;
export const POSTER_HEIGHT = 560;
const MARGIN = 15;

export const SAFE_ZONES: SafeZone[] = [
  // Scorecard area (top-left for most styles, top-right for Classic)
  // We reserve both regions; the map avoids both.
  { x: 0, y: 0, width: 175, height: 120, label: "scorecard" },
  // Title block at bottom
  { x: 0, y: 455, width: POSTER_WIDTH, height: 105, label: "title" },
];

/** The drawable map area after excluding safe zones + margin. */
export const MAP_BOUNDS = {
  left: MARGIN,
  top: MARGIN,
  right: POSTER_WIDTH - MARGIN,
  bottom: 455 - MARGIN, // above title safe zone
};

// ─── Poster coordinate space (initial generation) ─────────────
// Generate into a neutral workspace, then auto-fit.
const GEN_LEFT = 0;
const GEN_TOP = 0;
const GEN_WIDTH = 400;
const GEN_HEIGHT = 460;

/**
 * Convert normalized (0-1) coords to generation workspace.
 */
const toSVG = (nx: number, ny: number): [number, number] => [
  GEN_LEFT + nx * GEN_WIDTH,
  GEN_TOP + ny * GEN_HEIGHT,
];

// ─── Bounding-box + auto-fit ──────────────────────────────────
interface BBox { minX: number; minY: number; maxX: number; maxY: number; }

const computeBBox = (holes: HoleLayout[], waters: CourseLayout["waters"], clubhouse: { x: number; y: number }): BBox => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const expand = (x: number, y: number, pad = 0) => {
    minX = Math.min(minX, x - pad); minY = Math.min(minY, y - pad);
    maxX = Math.max(maxX, x + pad); maxY = Math.max(maxY, y + pad);
  };
  for (const h of holes) {
    expand(h.teeX, h.teeY, 6);
    expand(h.greenX, h.greenY, h.greenRx + 12);
    for (const b of h.bunkers) expand(b.x, b.y, b.rx + 2);
    for (const t of h.trees) expand(t.x, t.y, t.r + 2);
  }
  for (const w of waters) expand(w.x, w.y, Math.max(w.rx, w.ry) + 2);
  expand(clubhouse.x, clubhouse.y, 10);
  return { minX, minY, maxX, maxY };
};

/**
 * Checks if a rectangle overlaps any safe zone.
 */
const overlapsAny = (x: number, y: number, w: number, h: number, zones: SafeZone[]): boolean =>
  zones.some(z => x < z.x + z.width && x + w > z.x && y < z.y + z.height && y + h > z.y);

/**
 * Scale & translate all geometry to fit inside MAP_BOUNDS while avoiding safe zones.
 */
const autoFitLayout = (layout: CourseLayout): CourseLayout => {
  const bbox = computeBBox(layout.holes, layout.waters, layout.clubhouse);
  const bw = bbox.maxX - bbox.minX || 1;
  const bh = bbox.maxY - bbox.minY || 1;

  const targetW = MAP_BOUNDS.right - MAP_BOUNDS.left;
  const targetH = MAP_BOUNDS.bottom - MAP_BOUNDS.top;

  // Determine available region (avoid scorecard safe zone)
  // Try fitting with scorecard exclusion first
  const scorecardZone = SAFE_ZONES.find(z => z.label === "scorecard")!;
  
  // Attempt 1: fit in full target area
  let scale = Math.min(targetW / bw, targetH / bh) * 0.88; // 88% to add breathing room
  let offsetX = MAP_BOUNDS.left + (targetW - bw * scale) / 2 - bbox.minX * scale;
  let offsetY = MAP_BOUNDS.top + (targetH - bh * scale) / 2 - bbox.minY * scale;

  // Check if transformed bbox overlaps scorecard
  const txMinX = bbox.minX * scale + offsetX;
  const txMinY = bbox.minY * scale + offsetY;
  const txW = bw * scale;
  const txH = bh * scale;

  if (overlapsAny(txMinX, txMinY, txW, txH, [scorecardZone])) {
    // Attempt 2: shrink further
    scale *= 0.85;
    offsetX = MAP_BOUNDS.left + (targetW - bw * scale) / 2 - bbox.minX * scale;
    offsetY = MAP_BOUNDS.top + (targetH - bh * scale) / 2 - bbox.minY * scale;
    
    // Attempt 3: nudge right/down to avoid scorecard
    const tx2MinX = bbox.minX * scale + offsetX;
    const tx2MinY = bbox.minY * scale + offsetY;
    if (overlapsAny(tx2MinX, tx2MinY, bw * scale, bh * scale, [scorecardZone])) {
      const nudgeX = Math.max(0, (scorecardZone.x + scorecardZone.width + 5) - tx2MinX);
      const nudgeY = Math.max(0, (scorecardZone.y + scorecardZone.height + 5) - tx2MinY);
      // Only nudge in the smaller direction
      if (nudgeX < nudgeY) {
        offsetX += nudgeX;
      } else {
        offsetY += nudgeY;
      }
    }
  }

  const xf = (x: number) => x * scale + offsetX;
  const yf = (y: number) => y * scale + offsetY;
  const sf = (v: number) => v * scale;

  const transformHole = (h: HoleLayout): HoleLayout => ({
    ...h,
    teeX: xf(h.teeX), teeY: yf(h.teeY),
    greenX: xf(h.greenX), greenY: yf(h.greenY),
    greenRx: sf(h.greenRx), greenRy: sf(h.greenRy),
    greenRot: h.greenRot,
    fairwayPath: transformPath(h.fairwayPath, scale, offsetX, offsetY),
    fairwayBlob: transformPath(h.fairwayBlob, scale, offsetX, offsetY),
    bunkers: h.bunkers.map(b => ({
      x: xf(b.x), y: yf(b.y), rx: sf(b.rx), ry: sf(b.ry), rot: b.rot,
    })),
    trees: h.trees.map(t => ({
      x: xf(t.x), y: yf(t.y), r: sf(t.r),
    })),
  });

  return {
    ...layout,
    holes: layout.holes.map(transformHole),
    waters: layout.waters.map(w => ({
      x: xf(w.x), y: yf(w.y), rx: sf(w.rx), ry: sf(w.ry),
      path: transformPath(w.path, scale, offsetX, offsetY),
    })),
    clubhouse: { x: xf(layout.clubhouse.x), y: yf(layout.clubhouse.y) },
    cartPaths: layout.cartPaths.map(p => transformPath(p, scale, offsetX, offsetY)),
    routingLine: transformPath(layout.routingLine, scale, offsetX, offsetY),
    roughPatches: layout.roughPatches.map(rp => ({
      x: xf(rp.x), y: yf(rp.y), rx: sf(rp.rx), ry: sf(rp.ry), rot: rp.rot,
    })),
    mapBounds: {
      x: bbox.minX * scale + offsetX,
      y: bbox.minY * scale + offsetY,
      width: bw * scale,
      height: bh * scale,
    },
  };
};

/**
 * Transform SVG path string coordinates by scale + offset.
 * Handles M, L, Q, Z commands with numeric coordinate pairs.
 */
const transformPath = (d: string, scale: number, offsetX: number, offsetY: number): string => {
  if (!d) return d;
  return d.replace(/(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/g, (_, xStr, yStr) => {
    const x = parseFloat(xStr) * scale + offsetX;
    const y = parseFloat(yStr) * scale + offsetY;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
};

// ─── Build hole detail (fairway blobs, bunkers, trees) ────────
const buildHoleDetail = (
  teeX: number, teeY: number,
  greenX: number, greenY: number,
  doglegX: number | undefined, doglegY: number | undefined,
  par: number, yards: number,
  seed: number, holeIndex: number,
  r: (i: number) => number,
): HoleLayout => {
  const i = holeIndex;
  const midX = doglegX !== undefined ? doglegX : (teeX + greenX) / 2 + (r(i * 19 + 8) - 0.5) * 20;
  const midY = doglegY !== undefined ? doglegY : (teeY + greenY) / 2 + (r(i * 21 + 9) - 0.5) * 20;

  const fairwayPath = `M ${teeX} ${teeY} Q ${midX} ${midY} ${greenX} ${greenY}`;

  // Perpendicular vector
  const perpX = -(greenY - teeY);
  const perpY = greenX - teeX;
  const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;

  // Fairway blob
  const fw = par === 3 ? 5 : par === 5 ? 10 : 7.5;
  const fwScale = (yards / 400) * (0.8 + r(i * 25 + 11) * 0.4);
  const blobW = fw * fwScale;
  const pts: string[] = [];
  const steps = 8;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = (1 - t) * (1 - t) * teeX + 2 * (1 - t) * t * midX + t * t * greenX;
    const py = (1 - t) * (1 - t) * teeY + 2 * (1 - t) * t * midY + t * t * greenY;
    const wobble = (r(i * 30 + s * 7 + 12) - 0.5) * blobW * 0.4;
    const nx = perpX / perpLen;
    const ny = perpY / perpLen;
    pts.push(`${px + nx * (blobW + wobble)},${py + ny * (blobW + wobble)}`);
  }
  for (let s = steps; s >= 0; s--) {
    const t = s / steps;
    const px = (1 - t) * (1 - t) * teeX + 2 * (1 - t) * t * midX + t * t * greenX;
    const py = (1 - t) * (1 - t) * teeY + 2 * (1 - t) * t * midY + t * t * greenY;
    const wobble = (r(i * 31 + s * 7 + 13) - 0.5) * blobW * 0.4;
    const nx = perpX / perpLen;
    const ny = perpY / perpLen;
    pts.push(`${px - nx * (blobW + wobble)},${py - ny * (blobW + wobble)}`);
  }
  const fairwayBlob = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")} Z`;

  const greenRx = par === 3 ? 5.5 + r(i * 23 + 14) * 3.5 : 7 + r(i * 23 + 14) * 5;
  const greenRy = par === 3 ? 4.5 + r(i * 25 + 15) * 3 : 5.5 + r(i * 25 + 15) * 4;
  const greenRot = r(i * 27 + 16) * 120;

  const bunkerCount = par === 3 ? 1 + Math.floor(r(i * 29 + 17) * 2) : 2 + Math.floor(r(i * 31 + 18) * 2);
  const bunkers = Array.from({ length: bunkerCount }, (_, j) => {
    const bAngle = r(i * 33 + j * 7 + 19) * Math.PI * 2;
    const bDist = greenRx * 1.3 + r(i * 35 + j * 11 + 20) * 8;
    return {
      x: greenX + Math.cos(bAngle) * bDist,
      y: greenY + Math.sin(bAngle) * bDist,
      rx: 2.5 + r(i * 37 + j * 13 + 21) * 4,
      ry: 1.8 + r(i * 39 + j * 17 + 22) * 3,
      rot: r(i * 41 + j * 19 + 23) * 180,
    };
  });

  const treeCount = 3 + Math.floor(r(i * 41 + 24) * 6);
  const trees = Array.from({ length: treeCount }, (_, j) => {
    const t = r(i * 43 + j * 19 + 25);
    const px = teeX + (greenX - teeX) * t;
    const py = teeY + (greenY - teeY) * t;
    const offset = (r(i * 45 + j * 23 + 26) - 0.5) * 45;
    return {
      x: px + (perpX / perpLen) * offset,
      y: py + (perpY / perpLen) * offset,
      r: 2 + r(i * 47 + j * 29 + 27) * 4.5,
    };
  });

  return { teeX, teeY, greenX, greenY, fairwayPath, fairwayBlob, greenRx, greenRy, greenRot, bunkers, trees, par, yards };
};

// ─── Build water feature blob path ────────────────────────────
const buildWaterPath = (wx: number, wy: number, wrx: number, wry: number, r: (i: number) => number, offset: number): string => {
  const pts: string[] = [];
  const segs = 10;
  for (let a = 0; a < segs; a++) {
    const ang = (a / segs) * Math.PI * 2;
    const rad = 0.85 + r(600 + offset * 10 + a) * 0.35;
    pts.push(`${wx + Math.cos(ang) * wrx * rad},${wy + Math.sin(ang) * wry * rad}`);
  }
  return `M ${pts[0]} ${pts.slice(1).map((p, idx) => {
    const next = pts[(idx + 2) % pts.length];
    return `Q ${p} ${next || pts[0]}`;
  }).join(" ")} Z`;
};

// ─── Generate from reference geometry ─────────────────────────
const generateFromReference = (course: Course, ref: ReferenceGeometry, seed: number, r: (i: number) => number): CourseLayout => {
  const holeCount = Math.min(ref.holes.length, course.scorecard.length || ref.holes.length);

  const holes: HoleLayout[] = [];
  for (let i = 0; i < holeCount; i++) {
    const rh = ref.holes[i];
    const sc = course.scorecard[i];
    const par = sc?.par ?? 4;
    const yards = sc?.yards ?? 400;

    const [teeX, teeY] = toSVG(rh.teeX, rh.teeY);
    const [greenX, greenY] = toSVG(rh.greenX, rh.greenY);
    const doglegX = rh.doglegX !== undefined ? toSVG(rh.doglegX, rh.doglegY!)[0] : undefined;
    const doglegY = rh.doglegY !== undefined ? toSVG(rh.doglegX!, rh.doglegY!)[1] : undefined;

    holes.push(buildHoleDetail(teeX, teeY, greenX, greenY, doglegX, doglegY, par, yards, seed, i, r));
  }

  // Waters from reference
  const waters = ref.waters.map((w, i) => {
    const [wx, wy] = toSVG(w.x, w.y);
    const wrx = w.rx * GEN_WIDTH;
    const wry = w.ry * GEN_HEIGHT;
    return { x: wx, y: wy, rx: wrx, ry: wry, path: buildWaterPath(wx, wy, wrx, wry, r, i) };
  });

  const [chX, chY] = toSVG(ref.clubhouse.x, ref.clubhouse.y);
  const clubhouse = { x: chX, y: chY };

  // Routing line
  const routingPts = holes.map(h => `${h.greenX},${h.greenY}`);
  const routingLine = holes.length > 0 ? `M ${holes[0].teeX},${holes[0].teeY} L ${routingPts.join(" L ")}` : "";

  // Cart paths
  const cartPaths: string[] = [];
  for (let i = 0; i < holes.length - 1; i++) {
    const from = holes[i];
    const to = holes[i + 1];
    const mx = (from.greenX + to.teeX) / 2 + (r(700 + i) - 0.5) * 20;
    const my = (from.greenY + to.teeY) / 2 + (r(800 + i) - 0.5) * 20;
    cartPaths.push(`M ${from.greenX} ${from.greenY} Q ${mx} ${my} ${to.teeX} ${to.teeY}`);
  }

  // Rough patches
  const roughCount = 6 + Math.floor(r(900) * 8);
  const roughPatches = Array.from({ length: roughCount }, (_, i) => ({
    x: GEN_LEFT + r(1000 + i) * GEN_WIDTH,
    y: GEN_TOP + r(1100 + i) * GEN_HEIGHT,
    rx: 12 + r(1200 + i) * 35,
    ry: 8 + r(1300 + i) * 28,
    rot: r(1400 + i) * 360,
  }));

  const front9 = course.scorecard.slice(0, 9);
  const back9 = course.scorecard.slice(9, 18);
  const par3Count = course.scorecard.filter(h => h.par === 3).length;
  const par5Count = course.scorecard.filter(h => h.par === 5).length;
  const parDist = `3s:${par3Count} 4s:${holeCount - par3Count - par5Count} 5s:${par5Count}`;

  return {
    holes, waters, clubhouse, cartPaths, routingLine, roughPatches, front9, back9, r,
    debugInfo: {
      seed,
      holeCount,
      totalYardage: course.yardage,
      parDist,
      geometrySource: ref.source,
      geometryMode: "Reference",
    },
  };
};

// ─── Generate procedural (approximate) layout ─────────────────
const generateProcedural = (course: Course, seed: number, r: (i: number) => number): CourseLayout => {
  const holeCount = Math.min(course.holes, 18);
  const cx = 200, cy = 235;

  const par3Count = course.scorecard.filter(h => h.par === 3).length;
  const par5Count = course.scorecard.filter(h => h.par === 5).length;
  const compactness = par3Count / Math.max(holeCount, 1);
  const sprawl = par5Count / Math.max(holeCount, 1);
  const yardageScale = Math.max(0.7, Math.min(1.3, course.yardage / 6800));

  const routingType = r(0) + compactness * 0.3 - sprawl * 0.2;
  const isLoop = routingType < 0.33;
  const isFigure8 = routingType >= 0.33 && routingType < 0.66;

  const holes: HoleLayout[] = [];
  for (let i = 0; i < holeCount; i++) {
    const scorecard = course.scorecard[i];
    const par = scorecard?.par ?? 4;
    const yards = scorecard?.yards ?? 400;

    let angle: number;
    if (isLoop) {
      angle = (i / holeCount) * Math.PI * 2 - Math.PI / 2;
    } else if (isFigure8) {
      const half = holeCount / 2;
      if (i < half) {
        angle = (i / half) * Math.PI * 2 - Math.PI / 2;
      } else {
        angle = ((i - half) / (holeCount - half)) * Math.PI * 2 + Math.PI / 2;
      }
    } else {
      if (i < holeCount / 2) {
        angle = -Math.PI / 2 + (i / (holeCount / 2)) * Math.PI;
      } else {
        angle = Math.PI / 2 + ((i - holeCount / 2) / (holeCount / 2)) * Math.PI;
      }
    }

    angle += (r(i * 5 + 1) - 0.5) * 0.6;

    const baseRadius = (75 + r(i * 3 + 2) * 55) * yardageScale;
    const lengthScale = Math.min(yards / 380, 1.6) * (22 + r(i * 9 + 3) * 22);

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const teeX = cx + dirX * (baseRadius - lengthScale * 0.5) + (r(i * 11 + 4) - 0.5) * 30;
    const teeY = cy + dirY * (baseRadius - lengthScale * 0.5) * 0.85 + (r(i * 13 + 5) - 0.5) * 25;
    const greenX = cx + dirX * (baseRadius + lengthScale * 0.5) + (r(i * 15 + 6) - 0.5) * 25;
    const greenY = cy + dirY * (baseRadius + lengthScale * 0.5) * 0.85 + (r(i * 17 + 7) - 0.5) * 20;

    holes.push(buildHoleDetail(teeX, teeY, greenX, greenY, undefined, undefined, par, yards, seed, i, r));
  }

  const routingPts = holes.map(h => `${h.greenX},${h.greenY}`);
  const routingLine = holes.length > 0 ? `M ${holes[0].teeX},${holes[0].teeY} L ${routingPts.join(" L ")}` : "";

  const waterCount = 1 + Math.floor(r(99) * 3) + (course.yardage > 7000 ? 1 : 0);
  const waters = Array.from({ length: waterCount }, (_, i) => {
    const wx = 70 + r(200 + i) * 260;
    const wy = 120 + r(300 + i) * 240;
    const wrx = 10 + r(400 + i) * 28;
    const wry = 7 + r(500 + i) * 20;
    return { x: wx, y: wy, rx: wrx, ry: wry, path: buildWaterPath(wx, wy, wrx, wry, r, i) };
  });

  const clubhouse = {
    x: holes[0] ? holes[0].teeX - 15 + r(950) * 10 : 100,
    y: holes[0] ? holes[0].teeY + 8 + r(951) * 10 : 350,
  };

  const cartPaths: string[] = [];
  for (let i = 0; i < holes.length - 1; i++) {
    const from = holes[i];
    const to = holes[i + 1];
    const mx = (from.greenX + to.teeX) / 2 + (r(700 + i) - 0.5) * 20;
    const my = (from.greenY + to.teeY) / 2 + (r(800 + i) - 0.5) * 20;
    cartPaths.push(`M ${from.greenX} ${from.greenY} Q ${mx} ${my} ${to.teeX} ${to.teeY}`);
  }

  const roughCount = 6 + Math.floor(r(900) * 8);
  const roughPatches = Array.from({ length: roughCount }, (_, i) => ({
    x: 35 + r(1000 + i) * 330,
    y: 55 + r(1100 + i) * 350,
    rx: 12 + r(1200 + i) * 35,
    ry: 8 + r(1300 + i) * 28,
    rot: r(1400 + i) * 360,
  }));

  const front9 = course.scorecard.slice(0, 9);
  const back9 = course.scorecard.slice(9, 18);
  const parDist = `3s:${par3Count} 4s:${holeCount - par3Count - par5Count} 5s:${par5Count}`;

  return {
    holes, waters, clubhouse, cartPaths, routingLine, roughPatches, front9, back9, r,
    debugInfo: {
      seed,
      holeCount,
      totalYardage: course.yardage,
      parDist,
      geometrySource: "Approximate",
      geometryMode: "Approximate",
    },
  };
};

// ─── Generate from OSM real geometry ──────────────────────────
const generateFromOSM = (course: Course, osmData: OSMCourseData, seed: number, r: (i: number) => number): CourseLayout => {
  const svgW = GEN_WIDTH;
  const svgH = GEN_HEIGHT;
  const bounds = osmData.bounds;

  // Project ALL features first, then auto-fit to fill canvas
  const allRawPolygons = osmData.features.map(f => projectToSVG(f.points, svgW, svgH, bounds, 0.04));
  const allFitted = autoFitToCanvas(allRawPolygons, svgW, svgH, 0.04);

  // Rebuild projected features with fitted coordinates
  let featureIdx = 0;
  const fittedFeatures = osmData.features.map((f) => {
    const fitted = allFitted[featureIdx++];
    return { ...f, projectedPoints: fitted };
  });

  const fittedGreens = fittedFeatures.filter(f => f.type === "green");
  const fittedTees = fittedFeatures.filter(f => f.type === "tee");
  const fittedBunkers = fittedFeatures.filter(f => f.type === "bunker");
  const fittedWaters = fittedFeatures.filter(f => f.type === "water");

  // Sort greens by proximity to build hole routing
  const holes: HoleLayout[] = [];
  const usedGreens = new Set<number>();
  const usedTees = new Set<number>();

  const greenCentroids = fittedGreens.map((g, i) => {
    const cx = g.projectedPoints.reduce((s, p) => s + p[0], 0) / g.projectedPoints.length;
    const cy = g.projectedPoints.reduce((s, p) => s + p[1], 0) / g.projectedPoints.length;
    return { idx: i, cx, cy, lat: g.centroidLat, lng: g.centroidLng };
  });

  const teeCentroids = fittedTees.map((t, i) => {
    const cx = t.projectedPoints.reduce((s, p) => s + p[0], 0) / t.projectedPoints.length;
    const cy = t.projectedPoints.reduce((s, p) => s + p[1], 0) / t.projectedPoints.length;
    return { idx: i, cx, cy };
  });

  // Sort greens to approximate routing order (nearest-neighbor from first)
  const sortedGreens: typeof greenCentroids = [];
  if (greenCentroids.length > 0) {
    // Start from the green closest to bottom-center (near clubhouse)
    let remaining = [...greenCentroids];
    let current = remaining.reduce((best, g) =>
      Math.hypot(g.cx - svgW / 2, g.cy - svgH) < Math.hypot(best.cx - svgW / 2, best.cy - svgH) ? g : best
    );
    sortedGreens.push(current);
    remaining = remaining.filter(g => g.idx !== current.idx);

    while (remaining.length > 0) {
      const next = remaining.reduce((best, g) =>
        Math.hypot(g.cx - current.cx, g.cy - current.cy) < Math.hypot(best.cx - current.cx, best.cy - current.cy) ? g : best
      );
      sortedGreens.push(next);
      remaining = remaining.filter(g => g.idx !== next.idx);
      current = next;
    }
  }

  // Build holes from sorted greens
  const holeCount = Math.min(sortedGreens.length, course.holes || 18);
  for (let i = 0; i < holeCount; i++) {
    const green = sortedGreens[i];
    usedGreens.add(green.idx);
    const sc = course.scorecard[i];
    const par = sc?.par ?? 4;
    const yards = sc?.yards ?? 400;

    // Find nearest unused tee
    let teeX: number, teeY: number;
    const unusedTees = teeCentroids.filter(t => !usedTees.has(t.idx));
    if (unusedTees.length > 0) {
      // Find tee closest to this green but at reasonable distance
      const best = unusedTees.reduce((b, t) => {
        const dist = Math.hypot(t.cx - green.cx, t.cy - green.cy);
        const bDist = Math.hypot(b.cx - green.cx, b.cy - green.cy);
        return dist < bDist ? t : b;
      });
      usedTees.add(best.idx);
      teeX = best.cx;
      teeY = best.cy;
    } else {
      // Synthesize tee position based on previous green or offset
      const prevGreen = i > 0 ? sortedGreens[i - 1] : null;
      if (prevGreen) {
        teeX = prevGreen.cx + (r(i * 7) - 0.5) * 20;
        teeY = prevGreen.cy + (r(i * 7 + 1) - 0.5) * 20;
      } else {
        teeX = green.cx + (r(i * 11) - 0.5) * 40;
        teeY = green.cy + 30 + r(i * 13) * 20;
      }
    }

    holes.push(buildHoleDetail(teeX, teeY, green.cx, green.cy, undefined, undefined, par, yards, seed, i, r));
  }

  // If no greens found, use fairway centroids as hole positions
  if (holes.length === 0) {
    const fittedFairways = fittedFeatures.filter(f => f.type === "fairway");
    if (fittedFairways.length > 0) {
      const fwCentroids = fittedFairways.map((f, i) => {
        const pp = f.projectedPoints;
        const cx = pp.reduce((s, p) => s + p[0], 0) / pp.length;
        const cy = pp.reduce((s, p) => s + p[1], 0) / pp.length;
        const first = pp[0];
        const last = pp[Math.floor(pp.length / 2)];
        return { idx: i, cx, cy, first, last };
      });

      const count = Math.min(fwCentroids.length, course.holes || 18);
      for (let i = 0; i < count; i++) {
        const fw = fwCentroids[i];
        const sc = course.scorecard[i];
        const par = sc?.par ?? 4;
        const yards = sc?.yards ?? 400;
        holes.push(buildHoleDetail(fw.first[0], fw.first[1], fw.last[0], fw.last[1], undefined, undefined, par, yards, seed, i, r));
      }
    }
  }

  // Build waters from fitted water features
  const waters = fittedWaters.map((w, i) => {
    const pp = w.projectedPoints;
    const cx = pp.reduce((s, p) => s + p[0], 0) / pp.length;
    const cy = pp.reduce((s, p) => s + p[1], 0) / pp.length;
    const maxDx = Math.max(...pp.map(p => Math.abs(p[0] - cx)));
    const maxDy = Math.max(...pp.map(p => Math.abs(p[1] - cy)));
    const wrx = Math.max(maxDx, 8);
    const wry = Math.max(maxDy, 6);
    return { x: cx, y: cy, rx: wrx, ry: wry, path: buildWaterPath(cx, cy, wrx, wry, r, i) };
  });

  // Add bunkers to nearest holes
  for (const bf of fittedBunkers) {
    const pp = bf.projectedPoints;
    const cx = pp.reduce((s, p) => s + p[0], 0) / pp.length;
    const cy = pp.reduce((s, p) => s + p[1], 0) / pp.length;
    const maxDx = Math.max(...pp.map(p => Math.abs(p[0] - cx)), 2);
    const maxDy = Math.max(...pp.map(p => Math.abs(p[1] - cy)), 1.5);

    let bestHole = 0;
    let bestDist = Infinity;
    for (let h = 0; h < holes.length; h++) {
      const dist = Math.hypot(holes[h].greenX - cx, holes[h].greenY - cy);
      if (dist < bestDist) { bestDist = dist; bestHole = h; }
    }
    if (holes[bestHole]) {
      holes[bestHole].bunkers.push({
        x: cx, y: cy, rx: Math.min(maxDx, 6), ry: Math.min(maxDy, 4.5), rot: r(bf.centroidLat * 100) * 180,
      });
    }
  }

  const clubhouse = {
    x: holes[0] ? holes[0].teeX - 15 : svgW / 2,
    y: holes[0] ? holes[0].teeY + 10 : svgH * 0.9,
  };

  const routingPts = holes.map(h => `${h.greenX},${h.greenY}`);
  const routingLine = holes.length > 0 ? `M ${holes[0].teeX},${holes[0].teeY} L ${routingPts.join(" L ")}` : "";

  const cartPaths: string[] = [];
  for (let i = 0; i < holes.length - 1; i++) {
    const from = holes[i];
    const to = holes[i + 1];
    const mx = (from.greenX + to.teeX) / 2 + (r(700 + i) - 0.5) * 15;
    const my = (from.greenY + to.teeY) / 2 + (r(800 + i) - 0.5) * 15;
    cartPaths.push(`M ${from.greenX} ${from.greenY} Q ${mx} ${my} ${to.teeX} ${to.teeY}`);
  }

  const roughCount = 4 + Math.floor(r(900) * 6);
  const roughPatches = Array.from({ length: roughCount }, (_, i) => ({
    x: GEN_LEFT + r(1000 + i) * GEN_WIDTH,
    y: GEN_TOP + r(1100 + i) * GEN_HEIGHT,
    rx: 12 + r(1200 + i) * 35,
    ry: 8 + r(1300 + i) * 28,
    rot: r(1400 + i) * 360,
  }));

  const front9 = course.scorecard.slice(0, 9);
  const back9 = course.scorecard.slice(9, 18);
  const par3Count = course.scorecard.filter(h => h.par === 3).length;
  const par5Count = course.scorecard.filter(h => h.par === 5).length;
  const parDist = `3s:${par3Count} 4s:${holes.length - par3Count - par5Count} 5s:${par5Count}`;

  return {
    holes, waters, clubhouse, cartPaths, routingLine, roughPatches, front9, back9, r,
    debugInfo: {
      seed,
      holeCount: holes.length,
      totalYardage: course.yardage,
      parDist,
      geometrySource: "OpenStreetMap",
      geometryMode: "Reference",
    },
  };
};

// ─── Public API ───────────────────────────────────────────────
export const generateCourseLayout = (course: Course, osmData?: OSMCourseData | null): CourseLayout => {
  // Build cache key that includes OSM availability
  const osmKey = osmData ? "_osm" : "";
  const cacheId = course.id + osmKey;
  const locationHash = hashStr(course.location || course.city || "");
  const cached = layoutCache.get(cacheId);

  // Cache hygiene: verify location matches
  if (cached && cached.locationHash === locationHash) {
    const ref = getReferenceGeometry(course.id);
    createAuditRecord({
      courseId: course.id,
      courseName: course.name,
      courseLocation: course.location,
      validationSource: course.validationSource ?? null,
      geometrySource: cached.layout.debugInfo.geometrySource,
      geometrySourceUrl: osmData ? "OpenStreetMap Overpass API" : ref?.sourceUrl ?? null,
      geometryMode: cached.layout.debugInfo.geometryMode,
      cacheStatus: "hit",
      fallbackReason: ref || osmData ? null : "No reference geometry available for this course",
    });
    return cached.layout;
  }

  // Purge stale entry
  if (cached) layoutCache.delete(cacheId);

  const baseSeed = hashStr(course.id);
  // Use real GPS coords as seed when available (Tier 3 improvement)
  const coords = getKnownCoords(course.id);
  const coordSeed = coords ? Math.abs(Math.floor(coords.lat * 10000) ^ Math.floor(coords.lng * 10000)) : 0;
  const seed = baseSeed ^ (locationHash >>> 3) ^ coordSeed;
  const r = (i: number) => seededRandom(seed, i);

  let rawLayout: CourseLayout;
  let geometrySourceUrl: string | null = null;

  if (osmData && osmData.features.length >= 3) {
    // Priority 1: Real OSM geometry
    rawLayout = generateFromOSM(course, osmData, seed, r);
    geometrySourceUrl = "OpenStreetMap Overpass API";
  } else {
    // Priority 2: Hand-crafted reference geometry
    const ref = getReferenceGeometry(course.id);
    if (ref) {
      rawLayout = generateFromReference(course, ref, seed, r);
      geometrySourceUrl = ref.sourceUrl ?? null;
    } else {
      // Priority 3: Procedural (approximate)
      rawLayout = generateProcedural(course, seed, r);
    }
  }

  const layout = autoFitLayout(rawLayout);
  layoutCache.set(cacheId, { layout, locationHash });

  createAuditRecord({
    courseId: course.id,
    courseName: course.name,
    courseLocation: course.location,
    validationSource: course.validationSource ?? null,
    geometrySource: layout.debugInfo.geometrySource,
    geometrySourceUrl,
    geometryMode: layout.debugInfo.geometryMode,
    cacheStatus: "miss",
    fallbackReason: layout.debugInfo.geometrySource === "Approximate"
      ? "No OSM or reference geometry available — using coordinate-seeded approximate layout"
      : null,
  });

  return layout;
};
