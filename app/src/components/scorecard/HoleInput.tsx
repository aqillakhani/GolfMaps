import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HoleInputProps {
  hole: number;
  par: number;
  yards: number;
  value: number;
  totalHoles: number;
  onChangeScore: (score: number) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onClose: () => void;
}

const HoleInput = ({ hole, par, yards, value, totalHoles, onChangeScore, onNavigate, onClose }: HoleInputProps) => {
  const minScore = 1;
  const maxScore = par + 6;
  const options = Array.from({ length: maxScore - minScore + 1 }, (_, i) => minScore + i);

  const getScoreColor = (score: number) => {
    const diff = score - par;
    if (diff <= -2) return "bg-amber-400 text-amber-900";
    if (diff === -1) return "bg-green-500 text-white";
    if (diff === 0) return "bg-white text-foreground border-2 border-border";
    if (diff === 1) return "bg-red-200 text-red-800";
    return "bg-red-400 text-white";
  };

  const getScoreLabel = (score: number) => {
    const diff = score - par;
    if (diff <= -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double";
    return `+${diff}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-background rounded-t-3xl p-6 pb-10 shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigate("prev")}
              disabled={hole === 1}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-foreground">Hole {hole}</p>
              <p className="text-xs text-muted-foreground">Par {par} · {yards} yds</p>
            </div>
            <button
              onClick={() => onNavigate("next")}
              disabled={hole === totalHoles}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Score grid */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {options.map((score) => (
              <motion.button
                key={score}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onChangeScore(score);
                  if (hole < totalHoles) {
                    setTimeout(() => onNavigate("next"), 200);
                  }
                }}
                className={`w-12 h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                  value === score
                    ? getScoreColor(score) + " ring-2 ring-primary ring-offset-2"
                    : "glass-card shadow-card hover:shadow-elevated"
                }`}
              >
                {score}
              </motion.button>
            ))}
          </div>

          {/* Score label */}
          {value > 0 && (
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-medium text-muted-foreground"
            >
              {getScoreLabel(value)}
            </motion.p>
          )}

          {/* Done button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-green text-primary-foreground font-semibold shadow-golf"
          >
            Done
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HoleInput;
