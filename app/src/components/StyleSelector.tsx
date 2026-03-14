import { motion } from "framer-motion";
import { POSTER_STYLES, PosterStyleId } from "@/data/mockData";

interface StyleSelectorProps {
  selected: PosterStyleId;
  onChange: (style: PosterStyleId) => void;
}

const styleColors: Record<PosterStyleId, { bg: string; ring: string }> = {
  classic: { bg: "bg-background", ring: "ring-primary" },
  dark: { bg: "bg-foreground", ring: "ring-foreground" },
  vintage: { bg: "bg-sand", ring: "ring-sand-foreground" },
  blueprint: { bg: "bg-accent", ring: "ring-accent" },
  watercolor: { bg: "bg-muted", ring: "ring-primary" },
  minimalist: { bg: "bg-background border border-border", ring: "ring-foreground" },
};

const StyleSelector = ({ selected, onChange }: StyleSelectorProps) => {
  return (
    <div className="w-full max-w-sm mx-auto">
      <h3 className="font-display text-xl font-semibold text-foreground text-center italic tracking-tight mb-3">
        Choose Style
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {POSTER_STYLES.map((style, i) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(style.id)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-300 ${
              selected === style.id
                ? "border-primary bg-primary/5 shadow-golf"
                : "border-border bg-card hover:border-muted-foreground/30"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg ${styleColors[style.id].bg} shadow-card`} />
            <span className="text-xs font-medium text-foreground">{style.label}</span>
            {selected === style.id && (
              <motion.div
                layoutId="style-indicator"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="hsl(40, 30%, 97%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
