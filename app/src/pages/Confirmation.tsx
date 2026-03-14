import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Download, ArrowRight, BookOpen, Monitor, Smartphone, Tv, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CANVAS_SIZES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import RatePrompt from "@/components/RatePrompt";
import ShareComposer from "@/components/ShareComposer";
import { useEffect, useState, useRef } from "react";
import { addToCollectionStorage } from "@/lib/collectionStorage";

type Resolution = "sd" | "hd" | "4k";

const RESOLUTIONS: { id: Resolution; label: string; desc: string; pixels: string; icon: typeof Smartphone }[] = [
  { id: "sd", label: "SD", desc: "Standard", pixels: "1080 × 1440", icon: Smartphone },
  { id: "hd", label: "HD", desc: "High Definition", pixels: "2160 × 2880", icon: Monitor },
  { id: "4k", label: "4K", desc: "Ultra HD", pixels: "4320 × 5760", icon: Tv },
];

const Confirmation = () => {
  const navigate = useNavigate();
  const { selectedCourse, deliveryType, canvasSize, posterStyle, posterToggles, customText, reset, savePoster } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [resolution, setResolution] = useState<Resolution>("hd");
  const [shareOpen, setShareOpen] = useState(false);
  const shareComposerRef = useRef<{ trigger: () => void }>(null);

  const selectedCanvas = CANVAS_SIZES.find((s) => s.id === canvasSize);
  const orderRef = `GM-${Date.now().toString(36).toUpperCase()}`;

  // Auto-save poster on confirmation (in useEffect, not during render)
  useEffect(() => {
    if (selectedCourse) {
      savePoster(selectedCourse.id, posterStyle);
      addToCollectionStorage({
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        styleId: posterStyle,
        canvasId: canvasSize,
        orderedAt: Date.now(),
      });
    }
  }, [selectedCourse, posterStyle, savePoster, canvasSize]);

  const handleNewPoster = () => {
    reset();
    navigate("/search");
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Mock download — in production, render SVG at selected resolution
      await new Promise((res) => setTimeout(res, 1200));
      const resLabel = RESOLUTIONS.find((r) => r.id === resolution);
      const blob = new Blob([`mock-poster-${resolution}`], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedCourse?.name ?? "poster"}-${resLabel?.label ?? "HD"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cream flex flex-col items-center justify-center px-6">
      {/* Success icon with ripple */}
      <div className="relative mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute inset-0 rounded-full bg-primary/20"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="font-display text-4xl font-bold text-foreground italic tracking-tight mb-2">
          {deliveryType === "digital" ? "Your Poster is Ready!" : "Order Confirmed!"}
        </h1>
        <p className="text-muted-foreground text-base">
          {deliveryType === "digital"
            ? "Save your creation or get it on a canvas."
            : "Your canvas print is on its way."}
        </p>
      </motion.div>

      {/* Poster preview */}
      {selectedCourse && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-[200px] mx-auto mb-6"
        >
          <div className="shadow-poster rounded-xl overflow-hidden">
            <CoursePosterSVG course={selectedCourse} styleId={posterStyle} />
          </div>
        </motion.div>
      )}

      {/* Order details */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm glass-card rounded-2xl p-5 space-y-3 mb-6 shadow-elevated"
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order</span>
          <span className="font-mono font-medium text-foreground">{orderRef}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Course</span>
          <span className="font-medium text-foreground">{selectedCourse?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Format</span>
          <span className="font-medium text-foreground">
            {deliveryType === "digital" ? "Digital" : `Canvas ${selectedCanvas?.label}`}
          </span>
        </div>
        {deliveryType === "canvas" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. delivery</span>
            <span className="font-medium text-foreground">5–7 business days</span>
          </div>
        )}
      </motion.div>

      {/* Saved to Library confirmation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <CheckCircle className="w-3.5 h-3.5" /> Saved to your Library
        </span>
      </motion.div>

      {/* Resolution picker for digital */}
      {deliveryType === "digital" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="w-full max-w-sm mb-5"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Save Resolution
          </p>
          <div className="grid grid-cols-3 gap-2">
            {RESOLUTIONS.map((res) => {
              const Icon = res.icon;
              const isSelected = resolution === res.id;
              return (
                <motion.button
                  key={res.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setResolution(res.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-golf"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {res.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{res.pixels}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Download / Save button */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleDownload}
        className="w-full max-w-sm py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf flex items-center justify-center gap-2 mb-4 shimmer"
      >
        <Download className="w-5 h-5" />
        {downloading ? "Preparing…" : `Save ${RESOLUTIONS.find((r) => r.id === resolution)?.label} Image`}
      </motion.button>

      {/* Get on Canvas CTA */}
      {deliveryType === "digital" && (
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.66 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/preview")}
          className="w-full max-w-sm py-4 rounded-2xl border-2 border-primary/60 text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors mb-3"
        >
          🖼️ Get it on Canvas
        </motion.button>
      )}

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/journal")}
        className="w-full max-w-sm py-4 rounded-2xl border-2 border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors mb-3"
      >
        <BookOpen className="w-4 h-4" />
        View My Library
      </motion.button>

      {/* Share Your Print button — gold outlined */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.74 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShareOpen(true)}
        className="w-full max-w-sm py-4 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2 transition-colors mb-3"
        style={{ borderColor: "hsl(42 78% 60%)", color: "hsl(42 78% 60%)" }}
      >
        Share Your Print 📲
      </motion.button>

      {selectedCourse && (
        <ShareComposer
          course={selectedCourse}
          styleId={posterStyle}
          toggles={posterToggles}
          customText={customText}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.78 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleNewPoster}
        className="w-full max-w-sm py-4 rounded-2xl text-muted-foreground font-medium flex items-center justify-center gap-2 hover:text-foreground transition-colors mb-4"
      >
        Create Another Poster
        <ArrowRight className="w-4 h-4" />
      </motion.button>

      {/* Gentle rate prompt — only shown if not previously rated */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-sm mb-6"
      >
        <RatePrompt
          show={!localStorage.getItem("golfmaps_rated")}
          onDismiss={() => {}}
        />
      </motion.div>
    </div>
  );
};

export default Confirmation;
