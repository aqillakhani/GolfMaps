import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, ShieldAlert } from "lucide-react";
import { CourseAuditRecord, APPROVED_SOURCES } from "@/services/courseAudit";

interface SourceDebugPanelProps {
  audit: CourseAuditRecord | null;
  context: "verify" | "preview";
}

/**
 * Dev-only collapsible panel showing data source audit info.
 */
const SourceDebugPanel = ({ audit, context }: SourceDebugPanelProps) => {
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70 py-2 hover:text-muted-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span>Debug → Data Sources</span>
      </button>

      {open && (
        <div className="glass-card rounded-xl p-4 space-y-2 text-xs font-mono">
          {!audit ? (
            <p className="text-destructive">No audit record found for this course.</p>
          ) : (
            <>
              {/* Approval status */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                {audit.isApproved ? (
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <span className={audit.isApproved ? "text-primary font-semibold" : "text-destructive font-semibold"}>
                  {audit.isApproved ? "Sources Approved" : "UNAPPROVED SOURCE DETECTED"}
                </span>
              </div>

              <Row label="course_id" value={audit.courseId} />
              <Row label="Verified by" value={audit.validationSource || "None"} approved={!!audit.validationSource && APPROVED_SOURCES.includes(audit.validationSource)} />
              <Row label="Geometry from" value={audit.mapGeometrySource} approved={APPROVED_SOURCES.includes(audit.mapGeometrySource) || audit.mapGeometrySource === "Approximate"} />
              {audit.mapGeometrySourceUrl && (
                <Row label="Geometry URL" value={audit.mapGeometrySourceUrl} isUrl />
              )}
              <Row label="Image from" value={audit.mapImageSourceUrl || "None (SVG only)"} />
              <Row label="Mode" value={audit.geometryMode} highlight={audit.geometryMode === "Approximate"} />
              <Row label="Cache" value={audit.cacheStatus} />
              <Row label="Timestamp" value={new Date(audit.dataTimestamp).toISOString()} />
              {audit.fallbackReason && (
                <Row label="Fallback reason" value={audit.fallbackReason} highlight />
              )}

              {/* Approved sources reference */}
              <div className="pt-2 border-t border-border/50 text-muted-foreground/60">
                <span className="text-[9px]">Approved: {APPROVED_SOURCES.join(", ")}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, approved, highlight, isUrl }: {
  label: string;
  value: string;
  approved?: boolean;
  highlight?: boolean;
  isUrl?: boolean;
}) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-muted-foreground flex-shrink-0">{label}</span>
    {isUrl ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline text-right break-all">{value}</a>
    ) : (
      <span className={`text-right break-all ${
        approved === true ? "text-primary" :
        approved === false ? "text-destructive" :
        highlight ? "text-amber-500" :
        "text-foreground"
      }`}>
        {value}
      </span>
    )}
  </div>
);

export default SourceDebugPanel;
