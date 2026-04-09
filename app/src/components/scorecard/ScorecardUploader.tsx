import { ChangeEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  parseScorecardImage,
  ParsedPlayer,
  ParsedScorecard,
} from "@/services/scorecardParseService";
import { HoleScore } from "@/data/rounds";

interface ScorecardUploaderProps {
  onScoresExtracted: (scores: HoleScore[]) => void;
  totalHoles: number;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — must match the server cap
const MAX_DIM = 1800; // px — needed to read messy handwritten scores reliably

/**
 * Decode + downscale the picked file into a JPEG so we never upload 8MP phone
 * photos. Also normalises most common formats to JPEG, which Claude's vision
 * API accepts everywhere.
 */
async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Couldn't decode that image — try a JPEG or PNG."));
    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));

  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available in this browser.");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image."))),
      "image/jpeg",
      0.85,
    );
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "scorecard";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

function playerScoresToHoleScores(
  player: ParsedPlayer,
  totalHoles: number,
): HoleScore[] {
  return player.scores
    .filter((s) => s.hole >= 1 && s.hole <= totalHoles)
    .map((s) => ({ hole: s.hole, strokes: s.strokes }));
}

const ScorecardUploader = ({ onScoresExtracted, totalHoles }: ScorecardUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedScorecard | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSelectedPlayer(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setError(null);

    if (picked.size > MAX_UPLOAD_BYTES) {
      setError("That image is larger than 10 MB. Try a smaller photo.");
      return;
    }

    try {
      const prepared = await prepareImage(picked);
      if (preview) URL.revokeObjectURL(preview);
      setFile(prepared);
      setPreview(URL.createObjectURL(prepared));
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const parsed = await parseScorecardImage(file);
      if (!parsed.players || parsed.players.length === 0) {
        setError("No scores detected. Try a clearer, well-lit photo.");
        setResult(null);
        return;
      }
      setResult(parsed);
      setSelectedPlayer(0);
      onScoresExtracted(playerScoresToHoleScores(parsed.players[0], totalHoles));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setParsing(false);
    }
  };

  const pickPlayer = (idx: number) => {
    if (!result) return;
    setSelectedPlayer(idx);
    onScoresExtracted(playerScoresToHoleScores(result.players[idx], totalHoles));
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        className="hidden"
      />

      {!preview && (
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload scorecard photo
          </button>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            We'll read it with AI — no photo is stored.
          </p>
        </div>
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-xl p-3 space-y-3"
          >
            <div className="relative">
              <img
                src={preview}
                alt="Scorecard preview"
                className="w-full rounded-lg max-h-48 object-contain bg-muted/40"
              />
              <button
                onClick={reset}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center shadow-sm"
                aria-label="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {!result && (
              <button
                onClick={handleExtract}
                disabled={parsing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reading scorecard…
                  </>
                ) : (
                  "Extract scores"
                )}
              </button>
            )}

            {result && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.players[selectedPlayer]?.scores.length ?? 0} scores extracted
                </div>

                {result.players.length > 1 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Multiple players on the card — pick yours:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.players.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => pickPlayer(i)}
                          className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                            selectedPlayer === i
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {(p.name || `Player ${i + 1}`)} · {p.scores.length}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Tap any hole below to correct a value.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-1.5 text-[11px] text-destructive">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && !preview && (
        <div className="flex items-start gap-1.5 mt-2 text-[11px] text-destructive">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ScorecardUploader;
