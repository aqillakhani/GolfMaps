import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, User, Mail, MessageSquare, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CANVAS_SIZES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const inputClass =
  "w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-base outline-none focus:border-primary focus:shadow-golf transition-all duration-300 font-sans";

const GiftPoster = () => {
  const navigate = useNavigate();
  const { selectedCourse, posterStyle, deliveryType, canvasSize, setGiftConfig } = useApp();
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [fromName, setFromName] = useState("");

  if (!selectedCourse) {
    navigate("/search");
    return null;
  }

  const selectedCanvas = CANVAS_SIZES.find((s) => s.id === canvasSize);
  const isCanvas = deliveryType === "canvas" && !!selectedCanvas;

  const isValid = recipientName.trim() && recipientEmail.trim() && fromName.trim();

  const handleContinue = () => {
    const config = {
      recipientName,
      recipientEmail,
      personalMessage,
      fromName,
      giftDeliveryType: isCanvas ? "canvas" as const : "digital" as const,
    };
    setGiftConfig(config);

    if (isCanvas) {
      navigate("/gift-shipping");
    } else {
      navigate("/gift-confirmation");
    }
  };

  const priceLabel = isCanvas
    ? `Gift: ${selectedCanvas!.label} · $${selectedCanvas!.price}`
    : "Gift — Included";

  return (
    <div className="min-h-screen bg-gradient-cream pb-28">
      <div className="px-6 pt-12 pb-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground italic tracking-tight">
              Gift This Poster 🎁
            </h1>
            <p className="text-xs text-muted-foreground">Send a personal gift</p>
          </div>
        </motion.div>

        {/* Locked selection summary card */}
        <motion.div
          {...fadeUp(0.05)}
          className="glass-card rounded-2xl p-4 shadow-card mb-2 flex items-center gap-4"
        >
          <div className="w-16 flex-shrink-0 rounded-lg overflow-hidden shadow-poster">
            <CoursePosterSVG course={selectedCourse} styleId={posterStyle} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-semibold text-foreground truncate">
              {selectedCourse.name}
            </p>
            {isCanvas ? (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCanvas!.label} Canvas ({selectedCanvas!.dimensions})
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Selected</span>
                  <span className="text-xs font-bold text-foreground ml-auto">${selectedCanvas!.price}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">Digital Download</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Selected</span>
                  <span className="text-xs font-medium text-primary ml-auto">Included</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.08)} className="mb-6">
          <button
            onClick={() => navigate("/preview")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Change size or style
          </button>
        </motion.div>

        {/* Form */}
        <motion.div {...fadeUp(0.1)} className="space-y-4 mb-6">
          {/* Recipient Name */}
          <div className="glass-card rounded-2xl p-4 shadow-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3 h-3" /> Recipient's Full Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>

          {/* Recipient Email */}
          <div className="glass-card rounded-2xl p-4 shadow-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="w-3 h-3" /> Recipient's Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>

          {/* Personal Message */}
          <div className="glass-card rounded-2xl p-4 shadow-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3 h-3" /> Personal Message
            </label>
            <textarea
              value={personalMessage}
              onChange={(e) => {
                if (e.target.value.length <= 200) setPersonalMessage(e.target.value);
              }}
              placeholder="Happy Birthday! Here's to many more rounds together..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <p className="text-right text-[11px] text-muted-foreground mt-1.5">
              {personalMessage.length}/200
            </p>
          </div>

          {/* From Name */}
          <div className="glass-card rounded-2xl p-4 shadow-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Gift className="w-3 h-3" /> From
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

        </motion.div>
      </div>

      {/* Floating price bar + CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border px-6 py-4 z-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{priceLabel}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-50 disabled:cursor-not-allowed shimmer flex items-center justify-center gap-2"
        >
          <Gift className="w-5 h-5" />
          {isCanvas ? "Continue to Shipping" : "Send Gift"}
        </motion.button>
      </div>
    </div>
  );
};

export default GiftPoster;
