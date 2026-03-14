import { motion } from "framer-motion";
import { HoleScore } from "@/data/rounds";

interface ScorecardSummaryProps {
  holeScores: HoleScore[];
  coursePar: number;
  courseHoles: number;
}

const ScorecardSummary = ({ holeScores, coursePar, courseHoles }: ScorecardSummaryProps) => {
  const filledScores = holeScores.filter((h) => h.strokes > 0);
  const total = filledScores.reduce((sum, h) => sum + h.strokes, 0);
  const midpoint = Math.ceil(courseHoles / 2);
  const front = filledScores.filter((h) => h.hole <= midpoint).reduce((s, h) => s + h.strokes, 0);
  const back = filledScores.filter((h) => h.hole > midpoint).reduce((s, h) => s + h.strokes, 0);
  const vsPar = total - coursePar;
  const vsParLabel = vsPar === 0 ? "E" : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Front</p>
          <motion.p
            key={front}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-display text-xl font-bold text-foreground"
          >
            {front || "—"}
          </motion.p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Back</p>
          <motion.p
            key={back}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-display text-xl font-bold text-foreground"
          >
            {back || "—"}
          </motion.p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <motion.p
            key={total}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-display text-2xl font-bold text-primary"
          >
            {total || "—"}
          </motion.p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">vs Par</p>
          <motion.p
            key={vsParLabel}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`font-display text-xl font-bold ${
              vsPar < 0 ? "text-green-600" : vsPar > 0 ? "text-red-500" : "text-foreground"
            }`}
          >
            {filledScores.length === courseHoles ? vsParLabel : "—"}
          </motion.p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        {filledScores.length} of {courseHoles} holes entered
      </p>
    </motion.div>
  );
};

export default ScorecardSummary;
