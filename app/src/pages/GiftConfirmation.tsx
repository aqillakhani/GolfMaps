import { motion } from "framer-motion";
import { Check, ArrowRight, Mail, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CANVAS_SIZES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";

const GiftConfirmation = () => {
  const navigate = useNavigate();
  const { selectedCourse, posterStyle, canvasSize, giftConfig, reset } = useApp();

  if (!selectedCourse || !giftConfig) {
    navigate("/search");
    return null;
  }

  const selectedCanvas = CANVAS_SIZES.find((s) => s.id === canvasSize);
  const isCanvas = giftConfig.giftDeliveryType === "canvas";

  const handleNewPoster = () => {
    reset();
    navigate("/search");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(170deg, hsl(var(--primary)) 0%, hsl(150 40% 12%) 100%)" }}
    >
      {/* Gold checkmark */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #d4a853, #f0d080)" }}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute inset-0 rounded-full"
          style={{ background: "rgba(212, 168, 83, 0.3)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="font-display text-4xl font-bold text-white italic tracking-tight mb-2">
          Gift Sent! 🎁
        </h1>
        <p className="text-white/70 text-base max-w-xs mx-auto">
          {isCanvas && selectedCanvas
            ? `A ${selectedCanvas.label} canvas print of ${selectedCourse.name} is being prepared for ${giftConfig.recipientName}`
            : `Your digital gift card for ${selectedCourse.name} is on its way to ${giftConfig.recipientName}`}
        </p>
      </motion.div>

      {/* Poster preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-[160px] mx-auto mb-6"
      >
        <div className="shadow-poster rounded-xl overflow-hidden">
          <CoursePosterSVG course={selectedCourse} styleId={posterStyle} />
        </div>
      </motion.div>

      {/* Gift details card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm rounded-2xl p-5 space-y-3 mb-6"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="flex items-center gap-2 text-white/60 text-xs font-semibold uppercase tracking-wider">
          <Gift className="w-3 h-3" /> Gift Summary
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-white/60">To</span>
          <span className="font-medium text-white">{giftConfig.recipientName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Course</span>
          <span className="font-medium text-white">{selectedCourse.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Delivery</span>
          <span className="font-medium text-white">
            {isCanvas ? "Canvas Print" : "Digital Gift Card"}
          </span>
        </div>
        {isCanvas && selectedCanvas && (
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Canvas Size</span>
            <span className="font-medium text-white">{selectedCanvas.label} ({selectedCanvas.dimensions})</span>
          </div>
        )}
        {isCanvas && selectedCanvas && (
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total</span>
            <span className="font-bold text-white">${selectedCanvas.price}</span>
          </div>
        )}

        {giftConfig.personalMessage && (
          <>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div>
              <p className="text-white/60 text-xs mb-1">Your message</p>
              <p className="text-white text-sm italic font-display">"{giftConfig.personalMessage}"</p>
              <p className="text-white/50 text-xs mt-1">— {giftConfig.fromName}</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Email sent badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "rgba(212, 168, 83, 0.2)", color: "#f0d080" }}
        >
          <Mail className="w-3.5 h-3.5" /> Gift card email sent to {giftConfig.recipientEmail}
        </span>
      </motion.div>

      {/* Actions */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleNewPoster}
        className="w-full max-w-sm py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #d4a853, #f0d080)", color: "hsl(150 40% 12%)" }}
      >
        Create Another Poster
        <ArrowRight className="w-5 h-5" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/library")}
        className="w-full max-w-sm py-4 mt-3 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2 transition-colors"
        style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}
      >
        View My Library
      </motion.button>
    </div>
  );
};

export default GiftConfirmation;
