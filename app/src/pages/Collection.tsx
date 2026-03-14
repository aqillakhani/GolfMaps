import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Share2, ShoppingCart, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MOCK_COURSES, Course, PosterStyleId } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import BottomNavBar from "@/components/BottomNavBar";
import ShareComposer from "@/components/ShareComposer";
import { getCollection, CollectionItem } from "@/lib/collectionStorage";

const Collection = () => {
  const navigate = useNavigate();
  const { isSubscribed, setCourse, setPosterStyle } = useApp();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<(CollectionItem & { course: Course }) | null>(null);
  const [shareItem, setShareItem] = useState<(CollectionItem & { course: Course }) | null>(null);

  useEffect(() => {
    setItems(getCollection());
  }, []);

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const resolvedItems = items
    .map((item) => {
      const course = MOCK_COURSES.find((c) => c.id === item.courseId);
      return course ? { ...item, course } : null;
    })
    .filter(Boolean) as (CollectionItem & { course: Course })[];

  const handleOrderAnother = (item: CollectionItem & { course: Course }) => {
    setCourse(item.course);
    setPosterStyle(item.styleId);
    navigate("/preview");
  };

  const handleShare = (item: CollectionItem & { course: Course }) => {
    setShareItem(item);
  };

  return (
    <div className="min-h-screen bg-gradient-cream pb-20">
      <div className="px-6 pt-12 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-foreground italic tracking-tight mb-6"
        >
          My Collection
        </motion.h1>

        {resolvedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center pt-24 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Flag className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Your collection starts here</p>
            <p className="text-sm text-muted-foreground text-center max-w-[240px]">
              Search for a course and order your first poster to see it here.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/search")}
              className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: "#1A5C2A" }}
            >
              <Search className="w-4 h-4" />
              Search Your First Course
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {resolvedItems.map((item, i) => (
              <motion.div
                key={`${item.courseId}-${item.orderedAt}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-start text-left relative"
              >
                <button
                  onClick={() => setSelectedItem(item)}
                  className="w-full"
                >
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-card">
                    <CoursePosterSVG course={item.course} styleId={item.styleId} />
                  </div>
                </button>
                {/* Share icon on card */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <Share2 className="w-3.5 h-3.5 text-white" />
                </motion.button>
                <p className="mt-2 text-xs font-bold text-foreground leading-tight line-clamp-2">
                  {item.courseName}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen poster preview */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          >
            {/* Close */}
            <div className="flex justify-end p-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Poster */}
            <div className="flex-1 flex items-center justify-center px-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-[320px]"
              >
                <CoursePosterSVG course={selectedItem.course} styleId={selectedItem.styleId} />
              </motion.div>
            </div>

            {/* Buttons */}
            <div className="p-6 space-y-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOrderAnother(selectedItem)}
                className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Order Another Print
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleShare(selectedItem)}
                className="w-full py-4 rounded-2xl border border-white/30 text-white font-semibold text-base flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ShareComposer for collection items */}
      {shareItem && (
        <ShareComposer
          course={shareItem.course}
          styleId={shareItem.styleId}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
        />
      )}

      <BottomNavBar />
    </div>
  );
};

export default Collection;
