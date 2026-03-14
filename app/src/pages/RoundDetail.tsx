import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Trophy, StickyNote, Image, Share2, Gift, Trash2, Edit3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MOCK_COURSES } from "@/data/mockData";
import { HoleScore } from "@/data/rounds";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import ScorecardGrid from "@/components/scorecard/ScorecardGrid";

const RoundDetail = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const { rounds, deleteRound, updateRound, setCourse, setPosterStyle, setRoundOverlay } = useApp();
  const [editingScorecard, setEditingScorecard] = useState(false);

  const round = rounds.find((r) => r.id === roundId);
  const course = round ? MOCK_COURSES.find((c) => c.id === round.courseId) : null;

  if (!round || !course) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
        <p className="text-muted-foreground">Round not found</p>
      </div>
    );
  }

  const date = new Date(round.datePlayed);

  const handleGeneratePoster = () => {
    setCourse(course);
    setPosterStyle("classic");
    setRoundOverlay({ datePlayed: round.datePlayed, score: round.score });
    navigate("/preview");
  };

  const handleDelete = () => {
    deleteRound(round.id);
    navigate("/journal");
  };

  const handleUpdateScores = useCallback((scores: HoleScore[]) => {
    const total = scores.reduce((sum, h) => sum + h.strokes, 0);
    updateRound(round.id, { holeScores: scores, score: total > 0 ? total : round.score });
  }, [round.id, round.score, updateRound]);

  const vsPar = round.score ? round.score - course.par : null;
  const vsParLabel = vsPar === null ? null : vsPar === 0 ? "E" : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/journal")}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display text-2xl font-bold text-foreground italic tracking-tight">
              Round Details
            </h1>
          </div>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </motion.div>

        {/* Memory Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl overflow-hidden shadow-elevated mb-6"
        >
          {/* Mini poster */}
          <div className="p-4 pb-0">
            <div className="max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-card">
              <CoursePosterSVG course={course} styleId="classic" />
            </div>
          </div>

          {/* Round info */}
          <div className="p-5 text-center">
            <h2 className="font-display text-xl font-bold text-foreground italic">
              {course.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{course.location}</p>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase">Date</p>
              </div>
              {round.score && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{round.score}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Score</p>
                </div>
              )}
              {vsParLabel !== null && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <p className={`text-sm font-semibold ${
                    vsPar! < 0 ? "text-green-600" : vsPar! > 0 ? "text-red-500" : "text-foreground"
                  }`}>
                    {vsParLabel}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase">vs Par</p>
                </div>
              )}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  <Image className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {round.holeScores ? `${round.holeScores.length}h` : round.scorecardImage ? "Yes" : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase">Scorecard</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scorecard Grid */}
        {round.holeScores && course.scorecard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scorecard</p>
              <button
                onClick={() => setEditingScorecard(!editingScorecard)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                <Edit3 className="w-3 h-3" />
                {editingScorecard ? "Done" : "Edit"}
              </button>
            </div>
            <ScorecardGrid
              courseScorecard={course.scorecard}
              holeScores={round.holeScores}
              onUpdateScores={handleUpdateScores}
              readOnly={!editingScorecard}
            />
          </motion.div>
        )}

        {/* Scorecard Image */}
        {round.scorecardImage && !round.holeScores && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-4 shadow-card mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Image className="w-3 h-3" /> Scorecard Photo
            </p>
            <div className="rounded-xl bg-primary/5 p-8 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Scorecard image uploaded</p>
            </div>
          </motion.div>
        )}

        {/* Notes */}
        {round.notes && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-4 shadow-card mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <StickyNote className="w-3 h-3" /> Notes
            </p>
            <p className="text-sm text-foreground italic leading-relaxed">"{round.notes}"</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleGeneratePoster}
            className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-base shadow-golf flex items-center justify-center gap-2 shimmer"
          >
            <Image className="w-4 h-4" />
            Generate Memory Poster
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/gift")}
              className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Gift className="w-4 h-4" /> Gift
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoundDetail;
