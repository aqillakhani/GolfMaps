import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import html2canvas from "html2canvas";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import { Course, PosterStyleId, PosterToggles } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

interface ShareComposerProps {
  course: Course;
  styleId: PosterStyleId;
  toggles?: PosterToggles;
  customText?: string;
  onClose: () => void;
  open: boolean;
}

interface Platform {
  id: string;
  label: string;
  bg: string;
  icon: string;
  iconStyle?: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    label: "Instagram",
    bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    icon: "📷",
  },
  {
    id: "facebook",
    label: "Facebook",
    bg: "#1877F2",
    icon: "f",
    iconStyle: "font-bold text-xl font-serif",
  },
  {
    id: "x",
    label: "X",
    bg: "#000000",
    icon: "𝕏",
    iconStyle: "font-bold text-lg",
  },
  {
    id: "messages",
    label: "Messages",
    bg: "#34C759",
    icon: "💬",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    bg: "#25D366",
    icon: "📞",
  },
  {
    id: "download",
    label: "Download",
    bg: "#555555",
    icon: "⬇",
  },
];

type PlatformId = string;

const ShareComposer = ({ course, styleId, toggles, customText, onClose, open }: ShareComposerProps) => {
  const composerRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const hasTriggered = useRef(false);

  const courseName = course.name;
  const fileName = `${courseName.replace(/\s+/g, "-")}-Fairway-and-Co.png`;

  const generateImage = useCallback(async () => {
    if (!composerRef.current) return;
    setGenerating(true);
    try {
      // Small delay so the off-screen DOM renders
      await new Promise((r) => setTimeout(r, 150));
      const canvas = await html2canvas(composerRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        backgroundColor: "#1A5C2A",
      });
      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });
      setImageBlob(blob);
    } catch (err) {
      console.error("Share image generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Trigger generation when opened
  useEffect(() => {
    if (open && !hasTriggered.current) {
      hasTriggered.current = true;
      generateImage();
    }
    if (!open) {
      hasTriggered.current = false;
      setImageBlob(null);
      setImageUrl(null);
      setSheetVisible(false);
    }
  }, [open, generateImage]);

  // Show sheet once image is ready, or auto-download on desktop
  useEffect(() => {
    if (!open || !imageBlob) return;
    if (!navigator.share) {
      // Desktop: no native share, auto-download
      triggerDownload();
      toast({ title: "Downloaded — share from your photos app." });
      onClose();
    } else {
      setSheetVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBlob, open]);

  const triggerDownload = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = fileName;
    a.click();
  }, [imageUrl, fileName]);

  const dismissAfterShare = useCallback(() => {
    toast({ title: "Shared! 🎉" });
    setTimeout(() => {
      onClose();
    }, 1500);
  }, [onClose]);

  const handlePlatformTap = useCallback(
    async (platformId: PlatformId) => {
      if (!imageBlob) return;

      const file = new File([imageBlob], fileName, { type: "image/png" });

      if (platformId === "download") {
        triggerDownload();
        dismissAfterShare();
        return;
      }

      if (platformId === "x") {
        const tweetText = `Just ordered my ${courseName} print from @fairwayandco 🏌️ fairwayandco.com #golf #FairwayAndCo`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
          "_blank"
        );
        dismissAfterShare();
        return;
      }

      // All other platforms use navigator.share with files
      const shareData: ShareData = { files: [file] };

      if (platformId === "instagram") {
        shareData.title = "My Fairway & Co. Print";
      } else if (platformId === "facebook") {
        shareData.text = `My ${courseName} print from Fairway & Co. 🏌️ fairwayandco.com`;
      } else if (platformId === "messages") {
        shareData.text = `Check out my ${courseName} golf print!`;
      } else if (platformId === "whatsapp") {
        shareData.text = `Check out my ${courseName} golf print from Fairway & Co. 🏌️`;
      }

      try {
        if (navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          dismissAfterShare();
        } else {
          // Fallback: try without files
          const { files: _files, ...rest } = shareData;
          await navigator.share(rest);
          dismissAfterShare();
        }
      } catch {
        // User cancelled — do nothing
      }
    },
    [imageBlob, fileName, courseName, triggerDownload, dismissAfterShare]
  );

  return (
    <>
      {/* Hidden off-screen composer for html2canvas */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: 1080,
          height: 1080,
          zIndex: -1,
        }}
      >
        <div
          ref={composerRef}
          style={{
            width: 1080,
            height: 1080,
            backgroundColor: "#1A5C2A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 820,
              height: 980,
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.3))",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <CoursePosterSVG
              course={course}
              styleId={styleId}
              toggles={toggles}
              customText={customText}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 28,
              textAlign: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 28,
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              Fairway & Co.
            </div>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 14,
                color: "#D4A84B",
                marginTop: 4,
              }}
            >
              fairwayandco.com
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {generating && open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center golf-ball-bounce">
              <span className="text-xl">⛳</span>
            </div>
            <p className="text-white/80 text-sm font-medium">Generating your share image…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && sheetVisible && !generating && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/60"
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[201] bg-card rounded-t-[24px] shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <h3 className="text-lg font-bold text-foreground">Share Your Print</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Poster thumbnail */}
              {imageUrl && (
                <div className="flex justify-center px-5 pb-5">
                  <img
                    src={imageUrl}
                    alt="Poster preview"
                    className="h-20 rounded-lg object-cover shadow-card"
                  />
                </div>
              )}

              {/* Platform icons */}
              <div className="flex justify-around px-4 pb-6">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformTap(p.id)}
                    className="flex flex-col items-center gap-1.5 min-w-[56px]"
                  >
                    <div
                      className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white text-2xl"
                      style={{ background: p.bg }}
                    >
                      <span className={p.iconStyle || ""}>{p.icon}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Safe area spacer */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareComposer;
export { ShareComposer };
