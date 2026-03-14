import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const FAQ_ITEMS = [
  { q: "How do I save my poster?", a: "After creating your poster, tap 'Save Image' on the confirmation screen. You can choose SD, HD, or 4K resolution. Your poster is also automatically saved to your Library." },
  { q: "Can I order a canvas print?", a: "Yes! During the checkout flow, select 'Canvas' as your delivery type. Choose your preferred size and we'll print and ship a gallery-quality canvas to your door." },
  { q: "What courses are available?", a: "We support over 40,000 golf courses worldwide, including private, resort, historic, and even closed courses. All course data is validated against authoritative golf databases." },
  { q: "How do I restore my purchases?", a: "Go to Settings → Restore Purchases. This will recover any previous subscriptions linked to your Apple ID." },
  { q: "Can I customize my poster?", a: "Absolutely. In the poster preview, use the design toggles to show or hide the scorecard, location, yardage, and course facts. You can also choose from multiple art styles." },
  { q: "How do I delete a round?", a: "Navigate to your Journal, tap on the round you want to remove, and use the delete option on the round detail screen." },
];

const Support = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    // Mock submit — structured for future backend
    console.log("[Support] Contact form submitted:", contactForm);
    setSubmitted(true);
    setContactForm({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 3000);
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
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">Support & Help</h1>
        </motion.div>

        {/* FAQ */}
        <motion.div {...fadeUp(0.05)} className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Frequently Asked Questions</p>
        </motion.div>

        <div className="space-y-2 mb-8">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i} {...fadeUp(0.08 + i * 0.03)} className="glass-card rounded-2xl shadow-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-foreground pr-4">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-4"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div {...fadeUp(0.3)} className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Contact Support</p>
        </motion.div>

        <motion.div {...fadeUp(0.32)} className="glass-card rounded-2xl shadow-card p-5 space-y-4">
          <div className="space-y-3">
            <Input
              placeholder="Your name"
              value={contactForm.name}
              onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl bg-background/50 border-border/50"
              maxLength={100}
            />
            <Input
              type="email"
              placeholder="Email address"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl bg-background/50 border-border/50"
              maxLength={255}
            />
            <Textarea
              placeholder="How can we help?"
              value={contactForm.message}
              onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
              className="rounded-xl bg-background/50 border-border/50 min-h-[100px]"
              maxLength={1000}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-sm shadow-golf flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {submitted ? "Sent! We'll be in touch." : "Send Message"}
          </motion.button>

          <p className="text-xs text-muted-foreground text-center">
            Or email us directly at <span className="font-medium">help@golfmaps.com</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
