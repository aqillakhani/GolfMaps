import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bookmark, Plus, Share2, Calendar, Trophy, Type, ClipboardList, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import ProductSelector from "@/components/ProductSelector";
import StyleSelector from "@/components/StyleSelector";
import PosterToggles from "@/components/PosterToggles";
import { Input } from "@/components/ui/input";
import SourceDebugPanel from "@/components/SourceDebugPanel";
import InlineCourseCard from "@/components/InlineCourseCard";
import BucketListButtons from "@/components/BucketListButtons";
import { COLLECTIONS, CollectionId } from "@/data/mockData";
import { useState, useMemo, useEffect } from "react";
import { getActiveAudit, createAuditRecord } from "@/services/courseAudit";
import { purgeLayoutCache } from "@/components/poster-styles/layoutUtils";
import { validateCourse } from "@/services/courseValidation";
import { getReferenceGeometry } from "@/components/poster-styles/referenceGeometry";
import { HoleScore } from "@/data/rounds";
import ScorecardGrid from "@/components/scorecard/ScorecardGrid";
import ScorecardUploader from "@/components/scorecard/ScorecardUploader";

const PosterPreview = () => {
  const navigate = useNavigate();
  const {
    selectedCourse, deliveryType, canvasSize, posterStyle, posterToggles, roundOverlay, customText,
    setDeliveryType, setCanvasSize, setPosterStyle, setPosterToggles, setCustomText,
    savePoster, addToCollection, collections, setRoundOverlay, setCourse, addRecentCourse,
  } = useApp();
  const [showCollections, setShowCollections] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [posterScores, setPosterScores] = useState<HoleScore[]>([]);
  const [showScoreEntry, setShowScoreEntry] = useState(false);

  // Auto-expand the score entry panel when the user turns on "Add your score".
  useEffect(() => {
    if (posterToggles.showScore) setShowScoreEntry(true);
  }, [posterToggles.showScore]);

  // Inline validation (replaces the old VerifyCourse page)
  const validated = useMemo(() => {
    if (!selectedCourse) return null;
    const result = validateCourse(selectedCourse.id);
    if (result) {
      const ref = getReferenceGeometry(result.id);
      createAuditRecord({
        courseId: result.id,
        courseName: result.name,
        courseLocation: result.location,
        validationSource: result.validationSource,
        geometrySource: ref?.source ?? "Approximate",
        geometrySourceUrl: ref?.sourceUrl ?? null,
        geometryMode: ref ? "Reference" : "Approximate",
        cacheStatus: "miss",
        fallbackReason: ref ? null : "No reference geometry — will use procedural layout",
      });
      // Update course with validated data
      setCourse({ ...selectedCourse, validated: result.validated, validationSource: result.validationSource });
      addRecentCourse(selectedCourse);
    }
    return result;
  }, [selectedCourse?.id]);

  if (!selectedCourse) {
    navigate("/search");
    return null;
  }

  const handleContinue = () => {
    if (deliveryType === "digital") {
      savePoster(selectedCourse.id, posterStyle);
      navigate("/confirmation");
    } else {
      navigate("/checkout");
    }
  };

  const handleSave = () => {
    savePoster(selectedCourse.id, posterStyle);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleAddToCollection = (collectionId: CollectionId) => {
    addToCollection(collectionId, selectedCourse.id);
    setShowCollections(false);
  };

  const overlayDate = roundOverlay?.datePlayed
    ? new Date(roundOverlay.datePlayed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => { purgeLayoutCache(selectedCourse.id); setRoundOverlay(null); navigate("/search"); }}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground italic tracking-tight">
                  Your Poster
                </h1>
                <BucketListButtons course={selectedCourse} />
              </div>
              <p className="text-xs text-muted-foreground">{selectedCourse.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <Bookmark className={`w-5 h-5 ${saved ? "text-primary fill-primary" : "text-muted-foreground"}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCollections(!showCollections)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        {/* Inline course verification card */}
        {validated && <InlineCourseCard validated={validated} />}

        {/* Collection picker */}
        <AnimatePresence>
          {showCollections && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Add to collection</p>
                {COLLECTIONS.map((col) => {
                  const isIn = collections[col.id]?.includes(selectedCourse.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => handleAddToCollection(col.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isIn ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-lg">{col.icon}</span>
                      <span className="text-sm font-medium text-foreground">{col.label}</span>
                      {isIn && <span className="ml-auto text-xs text-primary font-medium">Added</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toasts */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center"
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Bookmark className="w-3.5 h-3.5 fill-primary" /> Saved to Library
              </span>
            </motion.div>
          )}
          {shareToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center"
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
                <Share2 className="w-3.5 h-3.5" /> Link copied · Made with GolfMaps
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Poster Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[280px] mx-auto mb-4"
        >
          <div className="shadow-poster rounded-xl overflow-hidden relative">

              <CoursePosterSVG course={selectedCourse} styleId={posterStyle} toggles={posterToggles} customText={customText} userScores={posterScores.length > 0 ? posterScores : null} />

              {/* Round overlay */}
              {roundOverlay && (overlayDate || roundOverlay.score) && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center gap-4">
                  {overlayDate && (
                    <span className="text-[10px] text-foreground flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-primary" /> Played {overlayDate}
                    </span>
                  )}
                  {roundOverlay.score && (
                    <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                      <Trophy className="w-3 h-3" /> {roundOverlay.score}
                    </span>
                  )}
                </div>
              )}

          </div>
        </motion.div>

        {/* Style selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <StyleSelector selected={posterStyle} onChange={setPosterStyle} />
        </motion.div>

        {/* Design toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mb-6"
        >
          <PosterToggles toggles={posterToggles} onChange={setPosterToggles} />
        </motion.div>

        {/* Add Your Scores — shown when the "Add your score" toggle is on */}
        {selectedCourse.scorecard.length > 0 && posterToggles.showScorecard && posterToggles.showScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.5 }}
            className="mb-6"
          >
            <div className="glass-card rounded-2xl p-4">
              <button
                onClick={() => setShowScoreEntry(!showScoreEntry)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Add Your Scores</h3>
                  {posterScores.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                      {posterScores.filter((s) => s.strokes > 0).length} holes
                    </span>
                  )}
                </div>
                {showScoreEntry ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {showScoreEntry && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mt-3 mb-2">
                      Tap each hole to enter your score, or upload a photo of your scorecard.
                    </p>
                    <ScorecardUploader
                      onScoresExtracted={setPosterScores}
                      totalHoles={selectedCourse.scorecard.length}
                    />
                    <div className="mt-3">
                      <ScorecardGrid
                        courseScorecard={selectedCourse.scorecard}
                        holeScores={posterScores}
                        onUpdateScores={setPosterScores}
                      />
                    </div>
                    {posterScores.length > 0 && (
                      <button
                        onClick={() => setPosterScores([])}
                        className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear all scores
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Personalize Your Print */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27, duration: 0.5 }}
          className="mb-6"
        >
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Personalize Your Print</h3>
            </div>
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value.slice(0, 60))}
              placeholder='e.g. Played Aug 2024 · Scored 82 · Best round of my life'
              maxLength={60}
              className="text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Date Played · [Score]",
                  "In Memory Of [Name]",
                  "Hole in One — Hole [X]",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setCustomText(chip)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
                    style={{ backgroundColor: "#E8F2E8", color: "#1A5C2A" }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{customText.length}/60</span>
            </div>
          </div>
        </motion.div>

        {/* Source Debug Panel (dev-only) */}
        <SourceDebugPanel audit={getActiveAudit(selectedCourse.id)} context="preview" />

        {/* Product selector */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductSelector
            deliveryType={deliveryType}
            selectedSize={canvasSize}
            onTypeChange={setDeliveryType}
            onSizeChange={setCanvasSize}
            onContinue={handleContinue}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PosterPreview;
