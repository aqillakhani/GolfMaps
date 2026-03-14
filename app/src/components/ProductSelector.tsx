import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, Frame, ChevronRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CANVAS_SIZES } from "@/data/mockData";

interface ProductSelectorProps {
  deliveryType: "digital" | "canvas";
  selectedSize: string | null;
  onTypeChange: (type: "digital" | "canvas") => void;
  onSizeChange: (size: string) => void;
  onContinue: () => void;
}

const ProductSelector = ({
  deliveryType,
  selectedSize,
  onTypeChange,
  onSizeChange,
  onContinue,
}: ProductSelectorProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      <h3 className="font-display text-2xl font-semibold text-foreground text-center italic tracking-tight">
        Choose Your Format
      </h3>

      {/* Product cards — Apple-style large tappable cards */}
      <div className="space-y-3">
        {/* Digital Download card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onTypeChange("digital")}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-300 ${
            deliveryType === "digital"
              ? "border-primary bg-primary/5 shadow-golf"
              : "border-border bg-card hover:border-muted-foreground/30"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                deliveryType === "digital"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-foreground">
                  Digital Download
                </p>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    deliveryType === "digital"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {deliveryType === "digital" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                High-resolution PNG & PDF
              </p>
              <p className="text-sm font-semibold text-primary mt-2">
                Included with membership
              </p>
            </div>
          </div>
        </motion.button>

        {/* Canvas Print card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onTypeChange("canvas")}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-300 ${
            deliveryType === "canvas"
              ? "border-primary bg-primary/5 shadow-golf"
              : "border-border bg-card hover:border-muted-foreground/30"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                deliveryType === "canvas"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Frame className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-foreground">
                  Canvas Print
                </p>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    deliveryType === "canvas"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {deliveryType === "canvas" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Museum-quality print, shipped to you
              </p>
              <p className="text-sm font-medium text-foreground mt-2">
                From $49
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Canvas size picker — slides in when canvas is selected */}
      <AnimatePresence mode="wait">
        {deliveryType === "canvas" && (
          <motion.div
            key="canvas-sizes"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Select Size
            </p>
            <div className="space-y-2">
              {CANVAS_SIZES.map((size, i) => (
                <motion.button
                  key={size.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
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
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    <span className="font-medium text-foreground">
                      {size.label}
                    </span>
                  </div>
                  <span className="font-bold text-foreground">${size.price}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy as a Gift */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/gift")}
        className="w-full py-3.5 rounded-2xl border-2 border-primary font-semibold text-base text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
      >
        <Gift className="w-4 h-4" />
        Buy as a Gift 🎁
      </motion.button>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={onContinue}
        disabled={deliveryType === "canvas" && !selectedSize}
        className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-50 disabled:cursor-not-allowed shimmer flex items-center justify-center gap-2"
      >
        {deliveryType === "digital" ? "Download Poster" : "Continue"}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default ProductSelector;
