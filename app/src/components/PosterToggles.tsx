import { motion } from "framer-motion";
import { PosterToggles as PosterTogglesType } from "@/data/mockData";
import { MapPin, Ruler, Table2, Info, Hash } from "lucide-react";

interface PosterTogglesProps {
  toggles: PosterTogglesType;
  onChange: (toggles: PosterTogglesType) => void;
}

const TOGGLE_ITEMS = [
  { key: "showLocation" as const, label: "Location", icon: MapPin },
  { key: "showYardagePar" as const, label: "Yardage & Par", icon: Ruler },
  { key: "showScorecard" as const, label: "Scorecard", icon: Table2 },
  { key: "showCourseFacts" as const, label: "Course Facts", icon: Info },
  { key: "showHoleNumbers" as const, label: "Hole Numbers", icon: Hash },
];

const PosterToggles = ({ toggles, onChange }: PosterTogglesProps) => {
  const handleToggle = (key: keyof PosterTogglesType) => {
    onChange({ ...toggles, [key]: !toggles[key] });
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
          return (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleToggle(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                isOn
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isOn ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium flex-1 text-left ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
              {/* Toggle switch */}
              <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
                isOn ? "bg-primary" : "bg-muted"
              }`}>
                <motion.div
                  animate={{ x: isOn ? 16 : 2 }}
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
