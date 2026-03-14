import { motion } from "framer-motion";
import { ArrowLeft, Lightbulb, Bug, MessageCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

type FeedbackType = "feature" | "bug" | "general";

const TYPES: { id: FeedbackType; label: string; icon: typeof Lightbulb; desc: string }[] = [
  { id: "feature", label: "Feature Request", icon: Lightbulb, desc: "Suggest something new" },
  { id: "bug", label: "Report a Problem", icon: Bug, desc: "Something isn't working" },
  { id: "general", label: "General Feedback", icon: MessageCircle, desc: "Share your thoughts" },
];

const Feedback = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    // Mock storage — structured for future backend
    const feedback = { type, message: message.trim(), timestamp: Date.now() };
    const existing = JSON.parse(localStorage.getItem("golfmaps_feedback") || "[]");
    existing.push(feedback);
    localStorage.setItem("golfmaps_feedback", JSON.stringify(existing));
    console.log("[Feedback] Stored:", feedback);
    setSubmitted(true);
    setMessage("");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-cream flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h2 {...fadeUp(0.2)} className="font-display text-2xl font-bold text-foreground italic mb-2">
          Thank You!
        </motion.h2>
        <motion.p {...fadeUp(0.3)} className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
          Your feedback helps us make GolfMaps better for everyone.
        </motion.p>
        <motion.button
          {...fadeUp(0.4)}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(-1)}
          className="py-3 px-8 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-sm shadow-golf"
        >
          Back to Settings
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8"
        >
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">Feedback</h1>
        </motion.div>

        <motion.p {...fadeUp(0.05)} className="text-sm text-muted-foreground mb-6 px-1">
          We'd love to hear from you. What type of feedback do you have?
        </motion.p>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TYPES.map((t, i) => {
            const Icon = t.icon;
            const selected = type === t.id;
            return (
              <motion.button
                key={t.id}
                {...fadeUp(0.08 + i * 0.04)}
                whileTap={{ scale: 0.96 }}
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-300 ${
                  selected ? "border-primary bg-primary/5 shadow-golf" : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium text-center leading-tight ${selected ? "text-primary" : "text-foreground"}`}>
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Message */}
        <motion.div {...fadeUp(0.22)} className="space-y-4">
          <Textarea
            placeholder={
              type === "feature" ? "Describe the feature you'd like to see…"
              : type === "bug" ? "What happened? What did you expect?"
              : "Share your thoughts…"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-xl bg-card border-border/50 min-h-[140px]"
            maxLength={2000}
          />

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-sm shadow-golf disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Feedback
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback;
