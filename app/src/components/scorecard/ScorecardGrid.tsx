import { useState } from "react";
import { motion } from "framer-motion";
import { HoleScore } from "@/data/rounds";
import HoleInput from "./HoleInput";
import ScorecardSummary from "./ScorecardSummary";

interface ScorecardGridProps {
  courseScorecard: { hole: number; yards: number; par: number }[];
  holeScores: HoleScore[];
  onUpdateScores: (scores: HoleScore[]) => void;
  readOnly?: boolean;
}

const ScorecardGrid = ({ courseScorecard, holeScores, onUpdateScores, readOnly = false }: ScorecardGridProps) => {
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const totalHoles = courseScorecard.length;
  const midpoint = Math.ceil(totalHoles / 2);

  const front = courseScorecard.slice(0, midpoint);
  const back = courseScorecard.slice(midpoint);

  const getScore = (hole: number) => holeScores.find((h) => h.hole === hole)?.strokes ?? 0;

  const coursePar = courseScorecard.reduce((s, h) => s + h.par, 0);

  const handleScoreChange = (hole: number, strokes: number) => {
    const existing = holeScores.find((h) => h.hole === hole);
    const updated = existing
      ? holeScores.map((h) => (h.hole === hole ? { ...h, strokes } : h))
      : [...holeScores, { hole, strokes }];
    onUpdateScores(updated);
  };

  const getScoreBg = (score: number, par: number) => {
    if (score === 0) return "";
    const diff = score - par;
    if (diff <= -2) return "bg-amber-400/80 text-amber-900";
    if (diff === -1) return "bg-green-500/80 text-white";
    if (diff === 0) return "bg-white/60";
    if (diff === 1) return "bg-red-200/80 text-red-800";
    return "bg-red-400/80 text-white";
  };

  const renderNine = (holes: typeof courseScorecard, label: string) => {
    const nineScores = holes.map((h) => getScore(h.hole)).filter((s) => s > 0);
    const nineTotal = nineScores.reduce((s, v) => s + v, 0);
    const ninePar = holes.reduce((s, h) => s + h.par, 0);

    return (
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs min-w-[400px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 px-1 text-left w-12">Hole</th>
                {holes.map((h) => (
                  <th key={h.hole} className="py-1 px-1 w-9">{h.hole}</th>
                ))}
                <th className="py-1 px-1 w-10 font-bold">Tot</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-muted-foreground/70">
                <td className="py-0.5 px-1 text-left text-[10px]">Yds</td>
                {holes.map((h) => (
                  <td key={h.hole} className="py-0.5 px-1 text-[10px]">{h.yards}</td>
                ))}
                <td className="py-0.5 px-1 text-[10px] font-medium">{holes.reduce((s, h) => s + h.yards, 0)}</td>
              </tr>
              <tr className="font-medium text-foreground/70">
                <td className="py-1 px-1 text-left">Par</td>
                {holes.map((h) => (
                  <td key={h.hole} className="py-1 px-1">{h.par}</td>
                ))}
                <td className="py-1 px-1 font-bold">{ninePar}</td>
              </tr>
              <tr className="font-bold text-foreground">
                <td className="py-1 px-1 text-left">Score</td>
                {holes.map((h) => {
                  const score = getScore(h.hole);
                  return (
                    <td key={h.hole} className="py-1 px-0.5">
                      {readOnly ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${getScoreBg(score, h.par)}`}>
                          {score || "—"}
                        </span>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => setActiveHole(h.hole)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            score > 0
                              ? getScoreBg(score, h.par)
                              : "border border-dashed border-border hover:border-primary/50"
                          }`}
                        >
                          {score || "·"}
                        </motion.button>
                      )}
                    </td>
                  );
                })}
                <td className="py-1 px-1 text-primary font-bold">{nineTotal || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const activeHoleData = activeHole ? courseScorecard.find((h) => h.hole === activeHole) : null;

  return (
    <div>
      <ScorecardSummary holeScores={holeScores} coursePar={coursePar} courseHoles={totalHoles} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 shadow-card mt-4"
      >
        {renderNine(front, front.length === 9 ? "Front 9" : `Holes 1–${midpoint}`)}
        {back.length > 0 && renderNine(back, back.length === 9 ? "Back 9" : `Holes ${midpoint + 1}–${totalHoles}`)}
      </motion.div>

      {activeHole && activeHoleData && !readOnly && (
        <HoleInput
          hole={activeHole}
          par={activeHoleData.par}
          yards={activeHoleData.yards}
          value={getScore(activeHole)}
          totalHoles={totalHoles}
          onChangeScore={(score) => handleScoreChange(activeHole, score)}
          onNavigate={(dir) => {
            const next = dir === "next" ? activeHole + 1 : activeHole - 1;
            if (next >= 1 && next <= totalHoles) setActiveHole(next);
          }}
          onClose={() => setActiveHole(null)}
        />
      )}
    </div>
  );
};

export default ScorecardGrid;
