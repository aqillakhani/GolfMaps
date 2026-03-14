/**
 * Source Audit Trail for course map generation.
 * Tracks exactly where every piece of data comes from.
 */

import { ValidationSource } from "@/data/mockData";
import { GeometrySource } from "@/components/poster-styles/referenceGeometry";

/** Approved geometry/validation sources */
export const APPROVED_SOURCES: readonly string[] = [
  "BlueGolf",
  "GolfTraxx",
  "GolfPass",
  "MyPhillyGolf",
  "OpenStreetMap",
] as const;

export type ApprovedSource = typeof APPROVED_SOURCES[number];

export interface CourseAuditRecord {
  courseId: string;
  courseName: string;
  courseLocation: string;
  validationSource: ValidationSource;
  mapGeometrySource: GeometrySource;
  mapGeometrySourceUrl: string | null;
  mapImageSourceUrl: string | null; // null = no external image used (SVG only)
  geometryMode: "Reference" | "Approximate";
  dataTimestamp: number;
  fallbackReason: string | null;
  cacheStatus: "hit" | "miss";
  isApproved: boolean;
}

// In-memory audit log (dev inspection)
const auditLog: CourseAuditRecord[] = [];

// Active audit per course (latest)
const activeAudits = new Map<string, CourseAuditRecord>();

export const isApprovedSource = (source: string | null | undefined): boolean => {
  if (!source) return false;
  return APPROVED_SOURCES.includes(source);
};

export const createAuditRecord = (params: {
  courseId: string;
  courseName: string;
  courseLocation: string;
  validationSource: ValidationSource;
  geometrySource: GeometrySource;
  geometrySourceUrl?: string | null;
  geometryMode: "Reference" | "Approximate";
  cacheStatus: "hit" | "miss";
  fallbackReason?: string | null;
}): CourseAuditRecord => {
  const record: CourseAuditRecord = {
    courseId: params.courseId,
    courseName: params.courseName,
    courseLocation: params.courseLocation,
    validationSource: params.validationSource,
    mapGeometrySource: params.geometrySource,
    mapGeometrySourceUrl: params.geometrySourceUrl ?? null,
    mapImageSourceUrl: null, // We only use SVG generation, never external images
    geometryMode: params.geometryMode,
    dataTimestamp: Date.now(),
    fallbackReason: params.fallbackReason ?? null,
    cacheStatus: params.cacheStatus,
    isApproved: isApprovedSource(params.geometrySource) || params.geometryMode === "Approximate",
  };

  activeAudits.set(params.courseId, record);
  auditLog.push(record);

  if (import.meta.env.DEV) {
    console.log("[CourseAudit]", record.courseId, {
      validation: record.validationSource,
      geometry: `${record.mapGeometrySource} (${record.geometryMode})`,
      approved: record.isApproved,
      cache: record.cacheStatus,
    });
  }

  return record;
};

export const getActiveAudit = (courseId: string): CourseAuditRecord | null => {
  return activeAudits.get(courseId) ?? null;
};

export const getAuditLog = (): readonly CourseAuditRecord[] => auditLog;

export const clearAuditForCourse = (courseId: string): void => {
  activeAudits.delete(courseId);
};

/**
 * Verification gate: checks if a course can proceed to poster generation.
 * Returns null if approved, or an error message string if blocked.
 */
export const verifySourceApproval = (courseId: string): string | null => {
  const audit = activeAudits.get(courseId);
  if (!audit) return "No audit record found. Course must be validated first.";

  // Validation source must be approved (or null for approximate mode)
  if (audit.validationSource && !isApprovedSource(audit.validationSource)) {
    return `Validation source "${audit.validationSource}" is not in the approved list.`;
  }

  // Geometry source must be approved OR explicitly "Approximate"
  if (audit.mapGeometrySource !== "Approximate" && !isApprovedSource(audit.mapGeometrySource)) {
    return `Geometry source "${audit.mapGeometrySource}" is not approved.`;
  }

  return null; // All good
};
