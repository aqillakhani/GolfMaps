import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const inputClass =
  "w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-base outline-none focus:border-primary focus:shadow-golf transition-all duration-300 font-sans";

const Shipping = () => {
  const navigate = useNavigate();
  const { selectedCourse } = useApp();
  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });

  if (!selectedCourse) {
    navigate("/search");
    return null;
  }

  const isValid = form.fullName && form.addressLine1 && form.city && form.state && form.zip;

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
            onClick={() => navigate("/checkout")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
              Shipping
            </h1>
            <p className="text-xs text-muted-foreground">Where should we send it?</p>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Delivery Address</p>
          </div>

          <input
            type="text"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Address Line 2 (optional)"
            value={form.addressLine2}
            onChange={(e) => update("addressLine2", e.target.value)}
            className={inputClass}
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <input
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              className={`${inputClass} w-24`}
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="ZIP Code"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              className={`${inputClass} w-32`}
            />
            <input
              type="text"
              placeholder="Country"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={`${inputClass} flex-1`}
            />
          </div>
        </motion.div>

        <motion.button
          {...fadeUp(0.25)}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/review-order")}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-50 disabled:cursor-not-allowed shimmer"
        >
          Review Order
        </motion.button>
      </div>
    </div>
  );
};

export default Shipping;
