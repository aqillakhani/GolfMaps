import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PosterCarousel from "@/components/PosterCarousel";
import PlanSelector from "@/components/PlanSelector";
import { useApp } from "@/context/AppContext";
import { purchasePackage, restorePurchases, PRODUCTS } from "@/services/purchaseService";

const Paywall = () => {
  const { subscribe } = useApp();
  const navigate = useNavigate();
  const [restoring, setRestoring] = useState(false);

  const handleSubscribe = async (planId: string) => {
    const productId = planId === "annual" ? PRODUCTS.ANNUAL : PRODUCTS.WEEKLY;
    const result = await purchasePackage(productId);
    if (result.success && result.entitlementActive) {
      subscribe(planId);
      navigate("/search");
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.entitlementActive) {
      subscribe("restored");
      navigate("/search");
    }
  };

  return (
    <div className="h-dvh bg-gradient-cream overflow-hidden flex flex-col px-6 py-4">
      {/* Hero carousel - top half */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="h-[50dvh] shrink-0"
      >
        <PosterCarousel />
      </motion.div>

      {/* Bottom - branding + plans */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col justify-center space-y-2"
      >
        <div className="text-center">
          <h1 className="font-display text-lg font-bold text-foreground leading-tight tracking-tight">
            Turn Any Course Into{" "}
            <span className="text-gradient-green italic">A Work of Art</span>
          </h1>
          <p className="text-muted-foreground text-[11px] max-w-[260px] mx-auto leading-snug mt-0.5">
            Beautiful, print-ready course map posters for every golf course in the world.
          </p>
        </div>

        <PlanSelector onSubscribe={handleSubscribe} />

        <div className="text-center flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <button onClick={handleRestore} disabled={restoring} className="underline underline-offset-2">
            {restoring ? "Restoring..." : "Restore Purchase"}
          </button>
          <button onClick={() => navigate("/terms")} className="underline underline-offset-2">Terms</button>
          <button onClick={() => navigate("/privacy")} className="underline underline-offset-2">Privacy</button>
        </div>
      </motion.div>
    </div>
  );
};

export default Paywall;
