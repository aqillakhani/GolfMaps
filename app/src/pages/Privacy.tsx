import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly: your name, email address (when you create an account), golf round scores, course preferences, and feedback submissions. We also collect usage data including app interactions, device type, operating system version, and crash reports to improve the service.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to: provide and personalize the GolfMaps service; sync your poster library, rounds, and collections across devices; process canvas print orders; send important service updates; respond to support requests. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Third-Party Services",
    body: "We use the following third-party services that may process your data:\n\n- Supabase (database & authentication) — stores your account data and app content securely\n- RevenueCat (subscription management) — processes in-app purchase receipts\n- Stripe (payment processing) — handles canvas print payments; we never store your full card number\n- Sentry (error tracking) — receives anonymized crash reports\n- PostHog (analytics) — tracks anonymized usage patterns\n- OpenStreetMap / Nominatim (course data) — course search queries are sent to public APIs\n\nEach service operates under its own privacy policy.",
  },
  {
    title: "4. Data Storage & Security",
    body: "Your data is stored in Supabase (PostgreSQL) with row-level security policies ensuring only you can access your data. All data is encrypted in transit (TLS) and at rest. Authentication uses industry-standard OAuth 2.0 via Apple Sign-In and Google Sign-In.",
  },
  {
    title: "5. Your Rights (GDPR / CCPA)",
    body: "You have the right to:\n\n- Access: Request a copy of all personal data we hold about you\n- Rectification: Correct inaccurate personal data\n- Deletion: Request deletion of your account and all associated data\n- Portability: Receive your data in a machine-readable format\n- Opt-out: Disable analytics tracking in Settings\n\nCalifornia residents: We do not sell personal information. You may exercise your CCPA rights by contacting privacy@golfmaps.com.\n\nEU residents: Our legal basis for processing is consent (account creation) and legitimate interest (service improvement).",
  },
  {
    title: "6. Data Retention",
    body: "Your data is retained for as long as your account is active. When you delete your account, all personal data is permanently deleted within 30 days. Anonymized analytics data may be retained indefinitely. Canvas print order records are retained for 7 years for tax/legal compliance.",
  },
  {
    title: "7. Children's Privacy",
    body: "GolfMaps is not intended for children under 13 (or 16 in the EU). We do not knowingly collect personal information from children. If we learn we have collected such information, we will delete it promptly.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this privacy policy from time to time. We will notify you of material changes through the app or via email. Your continued use after changes constitutes acceptance.",
  },
  {
    title: "9. Contact",
    body: "For privacy-related questions or to exercise your data rights, contact us at privacy@golfmaps.com.",
  },
];

const Privacy = () => {
  const navigate = useNavigate();

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
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">Privacy Policy</h1>
        </motion.div>

        <motion.p {...fadeUp(0.05)} className="text-xs text-muted-foreground mb-6 px-1">
          Last updated: March 2026
        </motion.p>

        <div className="space-y-5">
          {SECTIONS.map((section, i) => (
            <motion.div key={i} {...fadeUp(0.08 + i * 0.03)} className="glass-card rounded-2xl shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">{section.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Privacy;
