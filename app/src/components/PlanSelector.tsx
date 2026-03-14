import { useState } from "react";
import { motion } from "framer-motion";
import { PLANS } from "@/data/mockData";
import { Check } from "lucide-react";

interface PlanSelectorProps {
  onSubscribe: (planId: string) => void;
}

const PlanSelector = ({ onSubscribe }: PlanSelectorProps) => {
  const [selected, setSelected] = useState("yearly");

  return (
    <div className="w-full max-w-sm mx-auto space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        {PLANS.map((plan) => (
          <motion.button
            key={plan.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(plan.id)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-300 ${
              selected === plan.id
                ? "border-primary bg-primary/5 shadow-golf"
                : "border-border bg-card hover:border-muted-foreground/20"
            }`}
          >
            {plan.tag && (
              <span className="absolute -top-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-gradient-green text-primary-foreground">
                {plan.tag}
              </span>
            )}
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center mb-1 transition-all duration-300 ${
              selected === plan.id ? "border-primary bg-primary" : "border-muted-foreground/30"
            }`}>
              {selected === plan.id && <Check className="w-2 h-2 text-primary-foreground" />}
            </div>
            <span className="font-bold text-base text-foreground">{plan.price}</span>
            <span className="text-[11px] text-muted-foreground">{plan.period}</span>
            {plan.subtitle && (
              <span className="text-[9px] text-muted-foreground mt-0.5">{plan.subtitle}</span>
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onSubscribe(selected)}
        className="w-full py-2.5 rounded-xl bg-gradient-green text-primary-foreground font-semibold text-sm shadow-golf shimmer"
      >
        Continue
      </motion.button>

      <p className="text-center text-[10px] text-muted-foreground">
        Cancel anytime · No commitment
      </p>
    </div>
  );
};

export default PlanSelector;
