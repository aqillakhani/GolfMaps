import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ValidatedCourse, getSourceLabel } from "@/services/courseValidation";

interface InlineCourseCardProps {
  validated: ValidatedCourse;
}

const InlineCourseCard = ({ validated }: InlineCourseCardProps) => {
  const navigate = useNavigate();
  const isVerified = validated.validated;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-4 mb-5 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isVerified ? "bg-primary/10" : "bg-muted"
        }`}>
          {isVerified ? (
            <ShieldCheck className="w-4.5 h-4.5 text-primary" />
          ) : (
            <ShieldAlert className="w-4.5 h-4.5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-display font-bold text-foreground italic truncate">
              {validated.name}
            </h3>
            <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isVerified
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {isVerified ? getSourceLabel(validated.validationSource) : "Unverified"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{validated.city}, {validated.region} · {validated.country}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate("/search")}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Change course
      </button>
    </motion.div>
  );
};

export default InlineCourseCard;
