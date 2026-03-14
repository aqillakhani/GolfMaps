import { motion } from "framer-motion";
import { ArrowLeft, Globe, BookOpen, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import CourseSearch from "@/components/CourseSearch";
import BottomNavBar from "@/components/BottomNavBar";
import { Course } from "@/data/mockData";

const SearchPage = () => {
  const navigate = useNavigate();
  const { isSubscribed, setCourse, library } = useApp();

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const handleSelect = (course: Course) => {
    setCourse(course);
    navigate("/preview");
  };

  return (
    <div className="min-h-screen bg-gradient-cream pb-20">
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
              Search My Course
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/journal")}
              className="relative w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <BookOpen className="w-5 h-5 text-foreground" />
              {library.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {library.length}
                </span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <CourseSearch onSelect={handleSelect} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-float">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Search over 40,000 courses worldwide
          </p>
          <p className="text-xs text-muted-foreground">
            Including private, resort, historic & closed courses
          </p>
        </motion.div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default SearchPage;
