import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, Image } from "lucide-react";
import { CANVAS_SIZES } from "@/data/mockData";

interface CanvasSizeSelectorProps {
  deliveryType: "digital" | "canvas";
  selectedSize: string | null;
  onTypeChange: (type: "digital" | "canvas") => void;
  onSizeChange: (size: string) => void;
  onContinue: () => void;
}

const CanvasSizeSelector = ({
  deliveryType,
  selectedSize,
  onTypeChange,
  onSizeChange,
  onContinue,
}: CanvasSizeSelectorProps) => {
  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <h3 className="font-display text-2xl font-semibold text-foreground text-center italic tracking-tight">
        Choose Your Format
      </h3>

      {/* Delivery type toggle */}
      <div className="flex gap-1.5 p-1.5 glass-card rounded-2xl">
        <button
          onClick={() => onTypeChange("digital")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            deliveryType === "digital"
              ? "bg-gradient-green text-primary-foreground shadow-golf"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Download className="w-4 h-4" />
          Digital Download
        </button>
        <button
          onClick={() => onTypeChange("canvas")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            deliveryType === "canvas"
              ? "bg-gradient-green text-primary-foreground shadow-golf"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Image className="w-4 h-4" />
          Canvas Print
        </button>
      </div>

      <AnimatePresence mode="wait">
        {deliveryType === "digital" && (
          <motion.div
            key="digital"
            initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.35 }}
            className="text-center py-6 space-y-2"
          >
            <p className="font-display text-xl font-semibold text-foreground italic">
              Included with subscription
            </p>
            <p className="text-sm text-muted-foreground">
              High-resolution PNG & PDF download
            </p>
          </motion.div>
        )}

        {deliveryType === "canvas" && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.35 }}
            className="space-y-2"
          >
            {CANVAS_SIZES.map((size, i) => (
              <motion.button
                key={size.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                onClick={() => onSizeChange(size.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all duration-300 ${
                  selectedSize === size.id
                    ? "border-primary bg-primary/5 shadow-golf"
                    : "border-border bg-card hover:border-muted-foreground/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      selectedSize === size.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedSize === size.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                  <span className="font-medium text-foreground">{size.label}</span>
                </div>
                <span className="font-bold text-foreground">${size.price}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={onContinue}
        disabled={deliveryType === "canvas" && !selectedSize}
        className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-50 disabled:cursor-not-allowed shimmer"
      >
        {deliveryType === "digital" ? "Download Poster" : "Order Canvas Print"}
      </motion.button>
    </div>
  );
};

export default CanvasSizeSelector;
