import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CANVAS_SIZES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const ReviewOrder = () => {
  const navigate = useNavigate();
  const { selectedCourse, canvasSize, posterStyle, giftConfig } = useApp();
  const [processing, setProcessing] = useState(false);

  if (!selectedCourse) {
    navigate("/search");
    return null;
  }

  const selectedCanvas = CANVAS_SIZES.find((s) => s.id === canvasSize);
  const total = selectedCanvas?.price ?? 0;

  const handlePlaceOrder = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    navigate(giftConfig ? "/gift-confirmation" : "/confirmation");
  };

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8"
        >
          <button
            onClick={() => navigate("/shipping")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
            Review Order
          </h1>
        </motion.div>

        {/* Poster preview */}
        <motion.div
          {...fadeUp(0.1)}
          className="max-w-[180px] mx-auto mb-6"
        >
          <div className="shadow-poster rounded-xl overflow-hidden">
            <CoursePosterSVG course={selectedCourse} styleId={posterStyle} />
          </div>
        </motion.div>

        {/* Order details card */}
        <motion.div
          {...fadeUp(0.15)}
          className="glass-card rounded-2xl p-5 space-y-4 mb-4 shadow-card"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Course</span>
            <span className="font-medium text-foreground">{selectedCourse.name}</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Format</span>
            <span className="font-medium text-foreground">Canvas {selectedCanvas?.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-primary">Free</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between">
            <span className="font-display text-lg font-semibold text-foreground italic">Total</span>
            <span className="font-bold text-foreground text-xl">${total}</span>
          </div>
        </motion.div>

        {/* Shipping address card */}
        <motion.div
          {...fadeUp(0.2)}
          className="glass-card rounded-2xl p-5 mb-8 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Shipping To</p>
          </div>
          <p className="text-sm text-muted-foreground">
            John Doe<br />
            123 Fairway Lane<br />
            Pebble Beach, CA 93953<br />
            United States
          </p>
          <button
            onClick={() => navigate("/shipping")}
            className="text-xs text-primary font-medium mt-3"
          >
            Edit address
          </button>
        </motion.div>

        {/* Place order */}
        <motion.button
          {...fadeUp(0.3)}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={handlePlaceOrder}
          disabled={processing}
          className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-70 flex items-center justify-center gap-2 shimmer"
        >
          {processing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
            />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Place Order · ${total}
            </>
          )}
        </motion.button>

        <motion.div
          {...fadeUp(0.35)}
          className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground"
        >
          <Lock className="w-3 h-3" />
          <span>Secured with SSL encryption</span>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewOrder;
