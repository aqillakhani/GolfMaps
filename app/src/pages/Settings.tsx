import { motion } from "framer-motion";
import {
  ArrowLeft, RotateCcw, FileText, Shield, Mail, ChevronRight,
  User, Share2, Star, MessageSquare, HelpCircle, Info, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { restorePurchases } from "@/services/purchaseService";
import { useState } from "react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
  destructive?: boolean;
}

const SettingsRow = ({ icon, label, subtitle, onClick, delay = 0, destructive }: SettingsRowProps) => (
  <motion.button
    {...fadeUp(delay)}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center gap-4 px-5 py-4 text-left"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${destructive ? "bg-destructive/10" : "bg-muted"}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}>{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  </motion.button>
);

const SectionHeader = ({ label, delay }: { label: string; delay: number }) => (
  <motion.div {...fadeUp(delay)} className="mb-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 mb-2">{label}</p>
  </motion.div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { reset } = useApp();
  const { user, signOut } = useAuth();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "GolfMaps",
      text: "Turn any golf course into a work of art. Beautiful, print-ready course map posters.",
      url: "https://apps.apple.com/app/golfmaps/id000000000",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Link copied to clipboard!");
      }
    } catch {
      // User cancelled share
    }
  };

  const handleRate = () => {
    window.open("https://apps.apple.com/app/golfmaps/id000000000?action=write-review", "_blank");
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    alert(result.entitlementActive ? "Purchases restored!" : "No active purchases found.");
  };

  const handleSignOut = async () => {
    if (showResetConfirm) {
      reset();
      await signOut();
      navigate("/");
    } else {
      setShowResetConfirm(true);
    }
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
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
            Settings
          </h1>
        </motion.div>

        {/* Account */}
        <SectionHeader label="Account" delay={0.05} />
        <motion.div {...fadeUp(0.08)} className="glass-card rounded-2xl shadow-card mb-6 divide-y divide-border/50 overflow-hidden">
          <SettingsRow
            icon={<User className="w-4 h-4 text-foreground" />}
            label="My Account"
            subtitle={user?.email || "Not signed in"}
            onClick={() => !user && navigate("/login")}
            delay={0.1}
          />
          <SettingsRow
            icon={<RotateCcw className="w-4 h-4 text-foreground" />}
            label="Restore Purchases"
            subtitle="Recover previous subscriptions"
            onClick={handleRestore}
            delay={0.12}
          />
        </motion.div>

        {/* Engage */}
        <SectionHeader label="Community" delay={0.14} />
        <motion.div {...fadeUp(0.16)} className="glass-card rounded-2xl shadow-card mb-6 divide-y divide-border/50 overflow-hidden">
          <SettingsRow
            icon={<Share2 className="w-4 h-4 text-foreground" />}
            label="Share the App"
            subtitle="Spread the word with friends"
            onClick={handleShare}
            delay={0.18}
          />
          <SettingsRow
            icon={<Star className="w-4 h-4 text-foreground" />}
            label="Rate on the App Store"
            subtitle="Help us grow"
            onClick={handleRate}
            delay={0.2}
          />
          <SettingsRow
            icon={<MessageSquare className="w-4 h-4 text-foreground" />}
            label="Send Feedback"
            subtitle="Feature requests, bugs, or ideas"
            onClick={() => navigate("/feedback")}
            delay={0.22}
          />
        </motion.div>

        {/* Support */}
        <SectionHeader label="Support" delay={0.24} />
        <motion.div {...fadeUp(0.26)} className="glass-card rounded-2xl shadow-card mb-6 divide-y divide-border/50 overflow-hidden">
          <SettingsRow
            icon={<HelpCircle className="w-4 h-4 text-foreground" />}
            label="Support & Help"
            subtitle="FAQ & contact support"
            onClick={() => navigate("/support")}
            delay={0.28}
          />
          <SettingsRow
            icon={<Mail className="w-4 h-4 text-foreground" />}
            label="Contact Support"
            subtitle="help@golfmaps.com"
            onClick={() => navigate("/support")}
            delay={0.3}
          />
        </motion.div>

        {/* Legal */}
        <SectionHeader label="Legal" delay={0.32} />
        <motion.div {...fadeUp(0.34)} className="glass-card rounded-2xl shadow-card mb-6 divide-y divide-border/50 overflow-hidden">
          <SettingsRow
            icon={<Info className="w-4 h-4 text-foreground" />}
            label="About"
            onClick={() => navigate("/about")}
            delay={0.36}
          />
          <SettingsRow
            icon={<FileText className="w-4 h-4 text-foreground" />}
            label="Terms of Use"
            onClick={() => navigate("/terms")}
            delay={0.38}
          />
          <SettingsRow
            icon={<Shield className="w-4 h-4 text-foreground" />}
            label="Privacy Policy"
            onClick={() => navigate("/privacy")}
            delay={0.4}
          />
        </motion.div>

        {/* Sign Out */}
        <SectionHeader label="Data" delay={0.42} />
        <motion.div {...fadeUp(0.44)} className="glass-card rounded-2xl shadow-card mb-8 divide-y divide-border/50 overflow-hidden">
          <SettingsRow
            icon={<LogOut className="w-4 h-4 text-destructive" />}
            label={showResetConfirm ? "Tap again to confirm" : "Sign Out & Reset Data"}
            subtitle={showResetConfirm ? "This will clear all app data" : "Clear library, rounds, and preferences"}
            onClick={handleSignOut}
            delay={0.46}
            destructive
          />
        </motion.div>

        <motion.p {...fadeUp(0.5)} className="text-center text-xs text-muted-foreground">
          GolfMaps v1.0.0
        </motion.p>
      </div>
    </div>
  );
};

export default Settings;
