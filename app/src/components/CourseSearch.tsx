import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Flag, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { Course } from "@/data/mockData";
import { searchCourses, ValidatedCourse, getSourceLabel } from "@/services/courseValidation";
import { Badge } from "@/components/ui/badge";

interface CourseSearchProps {
  onSelect: (course: Course) => void;
  initialQuery?: string;
}

const CourseSearch = ({ onSelect, initialQuery = "" }: CourseSearchProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const { courses: results, hasMultipleMatches } = useMemo(() => {
    return searchCourses(query);
  }, [query]);

  const sourceBadgeColor = (source: ValidatedCourse["validationSource"]): string => {
    if (source === "BlueGolf") return "bg-primary/10 text-primary";
    if (source === "GolfTraxx") return "bg-accent/10 text-accent-foreground";
    if (source === "GolfPass") return "bg-secondary text-secondary-foreground";
    if (source === "MyPhillyGolf") return "bg-gold/10 text-gold-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        animate={focused ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all duration-300 glass-card ${
          focused ? "border-primary shadow-golf" : "border-transparent"
        }`}
      >
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search any golf course..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base font-medium"
        />
      </motion.div>

      {/* Disambiguation notice */}
      {hasMultipleMatches && results.length > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mt-2 px-2"
        >
          Multiple matches found — select the correct course below
        </motion.p>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 rounded-2xl border border-border glass-card shadow-elevated overflow-hidden max-h-[400px] overflow-y-auto"
          >
            {results.map((course: ValidatedCourse, i: number) => (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => {
                  onSelect(course);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/5 transition-colors text-left border-b border-border/50 last:border-0 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Flag className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {course.name}
                    </p>
                    {course.validated ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">{course.city}, {course.region}, {course.country}</p>
                  </div>
                  {/* Source badge */}
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${sourceBadgeColor(course.validationSource)}`}>
                      {course.validationSource || "Unverified"}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{course.holes}H · Par {course.par}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {query.length >= 2 && results.length === 0 && (
        <motion.p
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          No courses found. Try a different search.
        </motion.p>
      )}
    </div>
  );
};

export default CourseSearch;
