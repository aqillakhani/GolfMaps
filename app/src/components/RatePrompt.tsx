import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { useState } from "react";

interface RatePromptProps {
  show: boolean;
  onDismiss: () => void;
}

const RatePrompt = ({ show, onDismiss }: RatePromptProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !show) return null;

  const handleRate = () => {
    window.open("https://apps.apple.com/app/golfmaps/id000000000?action=write-review", "_blank");
    setDismissed(true);
    localStorage.setItem("golfmaps_rated", "true");
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm glass-card rounded-2xl shadow-elevated p-5 relative"
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Enjoying GolfMaps?</p>
            <p className="text-xs text-muted-foreground">Your rating helps other golfers find us</p>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleRate}
            className="flex-1 py-2.5 rounded-xl bg-gradient-green text-primary-foreground font-medium text-sm shadow-golf"
          >
            Rate Us ★
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground font-medium text-sm"
          >
            Later
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RatePrompt;
