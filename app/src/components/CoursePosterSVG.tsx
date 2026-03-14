import { useState, useEffect } from "react";
import { Course, PosterStyleId, PosterToggles, DEFAULT_POSTER_TOGGLES } from "@/data/mockData";
import { STYLE_COMPONENTS } from "./poster-styles";
import { useOSMGeometry } from "@/hooks/useOSMGeometry";
import { motion, AnimatePresence } from "framer-motion";
import { HoleScore } from "@/data/rounds";

interface CoursePosterSVGProps {
  course: Course;
  styleId?: PosterStyleId;
  toggles?: PosterToggles;
  customText?: string;
  userScores?: HoleScore[] | null;
}

const LOADING_MESSAGES = [
  "Tracing the fairways…",
  "Mapping the greens…",
  "Locating the bunkers…",
  "Charting the water hazards…",
  "Plotting your route…",
];

const CoursePosterSVG = ({ course, styleId = "classic", toggles = DEFAULT_POSTER_TOGGLES, customText = "", userScores }: CoursePosterSVGProps) => {
  const StyleComponent = STYLE_COMPONENTS[styleId];
  const { osmData, geojson, loading } = useOSMGeometry(course);
  const [msgIndex, setMsgIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="w-full aspect-[3/4] bg-background rounded-xl shadow-poster overflow-hidden relative">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white"
          >
            {/* Golf ball bounce */}
            <div className="mb-6">
              <div className="golf-ball-bounce text-4xl select-none">⛳</div>
            </div>
            {/* Rotating messages */}
            <div className="h-5 relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: "#1e5c2a" }}
                >
                  {LOADING_MESSAGES[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="poster"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <StyleComponent course={course} toggles={toggles} osmData={osmData} customText={customText} geojson={geojson} styleId={styleId} userScores={userScores} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePosterSVG;
