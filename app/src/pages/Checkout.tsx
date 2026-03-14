import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CANVAS_SIZES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import { createPaymentIntent } from "@/services/stripeService";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const inputClass =
  "w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-base outline-none focus:border-primary focus:shadow-golf transition-all duration-300 font-sans";

const Checkout = () => {
  const navigate = useNavigate();
  const { selectedCourse, deliveryType, canvasSize, posterStyle, giftConfig } = useApp();
  const [processing, setProcessing] = useState(false);

  if (!selectedCourse) {
    navigate("/search");
    return null;
  }

  const selectedCanvas = CANVAS_SIZES.find((s) => s.id === canvasSize);
  const total = deliveryType === "digital" ? 0 : selectedCanvas?.price ?? 0;

  const handleCheckout = async () => {
    if (deliveryType === "canvas") {
      // Canvas: go to shipping flow
      navigate("/shipping");
    } else {
      setProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate("/confirmation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <button
            onClick={() => navigate("/preview")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">Checkout</h1>
        </motion.div>

        {/* Large poster preview */}
        <motion.div
          {...fadeUp(0.05)}
          className="max-w-[200px] mx-auto mb-6"
        >
          <div className="shadow-poster rounded-xl overflow-hidden">
            <CoursePosterSVG course={selectedCourse} styleId={posterStyle} />
          </div>
          <p className="text-center text-xs font-medium text-foreground mt-3">{selectedCourse.name}</p>
          <p className="text-center text-[10px] text-muted-foreground">{selectedCourse.location}</p>
        </motion.div>

        {/* Order summary */}
        <motion.div
          {...fadeUp(0.1)}
          className="glass-card rounded-2xl p-5 space-y-4 mb-6 shadow-card"
        >
          <h3 className="font-display text-lg font-semibold text-foreground italic">Order Summary</h3>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Format</span>
            <span className="font-medium text-foreground">
              {deliveryType === "digital" ? "Digital Download" : `Canvas ${selectedCanvas?.label}`}
            </span>
          </div>

          {deliveryType === "digital" && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium text-primary">Included with membership</span>
            </div>
          )}

          {deliveryType === "canvas" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Canvas print</span>
                <span className="font-medium text-foreground">${selectedCanvas?.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-primary">Free</span>
              </div>
            </>
          )}

          <div className="h-px bg-border/50" />

          <div className="flex justify-between">
            <span className="font-display text-lg font-semibold text-foreground italic">Total</span>
            <span className="font-bold text-foreground text-xl">
              {total === 0 ? "Free" : `$${total}`}
            </span>
          </div>
        </motion.div>

        {/* Payment — only for canvas */}
        {deliveryType === "canvas" && (
          <motion.div
            {...fadeUp(0.2)}
            className="glass-card rounded-2xl p-5 space-y-4 mb-6 shadow-card"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-display text-lg font-semibold text-foreground italic">Payment</h3>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Card number" className={inputClass} />
              <div className="flex gap-3">
                <input type="text" placeholder="MM / YY" className={`${inputClass} flex-1`} />
                <input type="text" placeholder="CVC" className={`${inputClass} flex-1`} />
              </div>
            </div>
          </motion.div>
        )}

        <motion.button
          {...fadeUp(0.3)}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleCheckout}
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
              {deliveryType === "digital" ? "Download Now" : "Continue to Shipping"}
            </>
          )}
        </motion.button>

        <motion.div
          {...fadeUp(0.4)}
          className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground"
        >
          <Lock className="w-3 h-3" />
          <span>Secured with SSL encryption</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
