import { motion } from "framer-motion";
import { PosterToggles as PosterTogglesType } from "@/data/mockData";
import { MapPin, Ruler, Table2, Info, Hash, ClipboardList } from "lucide-react";

interface PosterTogglesProps {
  toggles: PosterTogglesType;
  onChange: (toggles: PosterTogglesType) => void;
}

const TOGGLE_ITEMS = [
  { key: "showLocation" as const, label: "Location", icon: MapPin },
  { key: "showYardagePar" as const, label: "Yardage & Par", icon: Ruler },
  { key: "showScorecard" as const, label: "Holes + Par", icon: Table2 },
  { key: "showScore" as const, label: "Add your score", icon: ClipboardList },
  { key: "showCourseFacts" as const, label: "Course Facts", icon: Info },
  { key: "showHoleNumbers" as const, label: "Hole Numbers", icon: Hash },
];

const PosterToggles = ({ toggles, onChange }: PosterTogglesProps) => {
  const handleToggle = (key: keyof PosterTogglesType) => {
    const next = { ...toggles, [key]: !toggles[key] };
    // Turning off "Holes + Par" also disables "Add your score" — the score
    // has no card to live on without it.
    if (key === "showScorecard" && !next.showScorecard) {
      next.showScore = false;
    }
    onChange(next);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h3 className="font-display text-xl font-semibold text-foreground text-center italic tracking-tight mb-3">
        Design
      </h3>
      <div className="space-y-1.5">
        {TOGGLE_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isOn = toggles[item.key];
          const disabled = item.key === "showScore" && !toggles.showScorecard;
          return (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { if (!disabled) handleToggle(item.key); }}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                disabled
                  ? "border-border bg-card opacity-40 cursor-not-allowed"
                  : isOn
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isOn && !disabled ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium flex-1 text-left ${isOn && !disabled ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
              {/* Toggle switch */}
              <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
                isOn && !disabled ? "bg-primary" : "bg-muted"
              }`}>
                <motion.div
                  animate={{ x: isOn && !disabled ? 16 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm"
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PosterToggles;
