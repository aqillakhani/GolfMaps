import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, FileText, Calendar, Trophy, StickyNote, Check, Hash, ListOrdered } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MOCK_COURSES, Course } from "@/data/mockData";
import { HoleScore } from "@/data/rounds";
import CourseSearch from "@/components/CourseSearch";
import ScorecardGrid from "@/components/scorecard/ScorecardGrid";

type Step = "course" | "method" | "scorecard" | "details";
type ScoreMethod = "total" | "hole-by-hole" | "photo";

const AddRound = () => {
  const navigate = useNavigate();
  const { addRound, isSubscribed } = useApp();
  const [step, setStep] = useState<Step>("course");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scoreMethod, setScoreMethod] = useState<ScoreMethod | null>(null);
  const [datePlayed, setDatePlayed] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [scorecardUploaded, setScorecardUploaded] = useState(false);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [saving, setSaving] = useState(false);

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    if (course.scorecard.length > 0) {
      setStep("method");
    } else {
      setScoreMethod("total");
      setStep("details");
    }
  };

  const handleSelectMethod = (method: ScoreMethod) => {
    setScoreMethod(method);
    if (method === "hole-by-hole" && selectedCourse) {
      setHoleScores([]);
      setStep("scorecard");
    } else if (method === "photo") {
      handlePhotoUpload();
      setStep("details");
    } else {
      setStep("details");
    }
  };

  const handlePhotoUpload = () => {
    setScorecardUploaded(true);
    if (!datePlayed) setDatePlayed(new Date().toISOString().split("T")[0]);
    if (!score) setScore("85");
  };

  const handleScorecardDone = () => {
    const total = holeScores.reduce((sum, h) => sum + h.strokes, 0);
    if (total > 0) setScore(String(total));
    setStep("details");
  };

  const handleUpdateScores = useCallback((scores: HoleScore[]) => {
    setHoleScores(scores);
  }, []);

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    const finalHoleScores = holeScores.length > 0 ? holeScores : null;
    const totalFromHoles = finalHoleScores
      ? finalHoleScores.reduce((sum, h) => sum + h.strokes, 0)
      : null;

    addRound({
      courseId: selectedCourse.id,
      datePlayed: datePlayed || new Date().toISOString().split("T")[0],
      score: totalFromHoles || (score ? parseInt(score) : null),
      notes,
      scorecardImage: scorecardUploaded ? "mock-scorecard.jpg" : null,
      holeScores: finalHoleScores,
    });
    navigate("/journal");
  };

  const handleBack = () => {
    if (step === "details" && scoreMethod === "hole-by-hole") setStep("scorecard");
    else if (step === "details") setStep("method");
    else if (step === "scorecard") setStep("method");
    else if (step === "method") setStep("course");
    else navigate(-1);
  };

  const stepTitle = {
    course: "Select Course",
    method: "Score Entry",
    scorecard: "Enter Scores",
    details: "Round Details",
  };

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
            {stepTitle[step]}
          </h1>
        </motion.div>

        {/* STEP: Course selection */}
        {step === "course" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CourseSearch onSelect={handleSelectCourse} />
          </motion.div>
        )}

        {/* STEP: Score entry method */}
        {step === "method" && selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Course card */}
            <div className="glass-card rounded-2xl p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{selectedCourse.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCourse.location}</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How would you like to enter your score?</p>

            {[
              { method: "total" as ScoreMethod, icon: <Hash className="w-6 h-6" />, label: "Enter Total Score", desc: "Quick — just your final score" },
              { method: "hole-by-hole" as ScoreMethod, icon: <ListOrdered className="w-6 h-6" />, label: "Enter Hole-by-Hole", desc: `${selectedCourse.holes}-hole scorecard with par & yardage` },
              { method: "photo" as ScoreMethod, icon: <Camera className="w-6 h-6" />, label: "Upload Scorecard Photo", desc: "Take a photo or upload from gallery" },
            ].map((opt) => (
              <motion.button
                key={opt.method}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectMethod(opt.method)}
                className="w-full glass-card rounded-2xl p-4 shadow-card text-left flex items-center gap-4 hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  {opt.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* STEP: Hole-by-hole scorecard */}
        {step === "scorecard" && selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <ScorecardGrid
              courseScorecard={selectedCourse.scorecard}
              holeScores={holeScores}
              onUpdateScores={handleUpdateScores}
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleScorecardDone}
              className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf flex items-center justify-center gap-2 shimmer"
            >
              Continue to Details
            </motion.button>
          </motion.div>
        )}

        {/* STEP: Details (date, score, notes) */}
        {step === "details" && selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Course card */}
            <div className="glass-card rounded-2xl p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{selectedCourse.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCourse.location}</p>
              </div>
            </div>

            {/* Scorecard uploaded indicator */}
            {scorecardUploaded && (
              <div className="glass-card rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Scorecard uploaded</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Data extracted</span>
                </div>
              </div>
            )}

            {/* Hole scores indicator */}
            {holeScores.length > 0 && (
              <div className="glass-card rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {holeScores.length} holes entered
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    Total: {holeScores.reduce((s, h) => s + h.strokes, 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="glass-card rounded-2xl p-4 shadow-card">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Calendar className="w-3 h-3" /> Date Played
              </label>
              <input
                type="date"
                value={datePlayed}
                onChange={(e) => setDatePlayed(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Score — only show if not using hole-by-hole */}
            {scoreMethod !== "hole-by-hole" && (
              <div className="glass-card rounded-2xl p-4 shadow-card">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Trophy className="w-3 h-3" /> Score (Optional)
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 82"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {/* Notes */}
            <div className="glass-card rounded-2xl p-4 shadow-card">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <StickyNote className="w-3 h-3" /> Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was the round? Any memorable moments..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-lg shadow-golf disabled:opacity-70 flex items-center justify-center gap-2 shimmer"
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                "Save Round"
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddRound;
