import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, BookOpen, Map, Clock, Star, ChevronRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MOCK_COURSES, COLLECTIONS, POSTER_STYLES } from "@/data/mockData";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import { useState } from "react";

type Tab = "posters" | "collections" | "recent";

const Library = () => {
  const navigate = useNavigate();
  const { isSubscribed, library, collections, recentCourses, toggleFavorite, setCourse, setPosterStyle } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("posters");

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const favorites = library.filter((p) => p.isFavorite);
  const totalMapped = new Set(library.map((p) => p.courseId)).size;

  const handleOpenPoster = (courseId: string, styleId: string) => {
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    if (course) {
      setCourse(course);
      setPosterStyle(styleId as any);
      navigate("/preview");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "posters", label: "My Posters", icon: <BookOpen className="w-4 h-4" /> },
    { id: "collections", label: "Collections", icon: <Star className="w-4 h-4" /> },
    { id: "recent", label: "Recent", icon: <Clock className="w-4 h-4" /> },
  ];

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
              onClick={() => navigate("/search")}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
              My Library
            </h1>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex gap-3 mb-6"
        >
          {[
            { label: "Courses Mapped", value: totalMapped, icon: <Map className="w-4 h-4 text-primary" /> },
            { label: "Posters Saved", value: library.length, icon: <BookOpen className="w-4 h-4 text-accent" /> },
            { label: "Favorites", value: favorites.length, icon: <Heart className="w-4 h-4 text-destructive" /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex-1 glass-card rounded-xl p-3 text-center shadow-card"
            >
              <div className="flex items-center justify-center mb-1">{stat.icon}</div>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 p-1 glass-card rounded-xl mb-6"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-green text-primary-foreground shadow-golf"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "posters" && (
            <motion.div
              key="posters"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {library.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-float">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-display text-lg font-semibold text-foreground italic">No posters yet</p>
                  <p className="text-sm text-muted-foreground">Search for a course to create your first poster</p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate("/search")}
                    className="mt-4 px-6 py-3 rounded-xl bg-gradient-green text-primary-foreground font-medium text-sm shadow-golf"
                  >
                    Find a Course
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {library.map((poster, i) => {
                    const course = MOCK_COURSES.find((c) => c.id === poster.courseId);
                    const style = POSTER_STYLES.find((s) => s.id === poster.styleId);
                    if (!course) return null;
                    return (
                      <motion.div
                        key={poster.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleOpenPoster(poster.courseId, poster.styleId)}
                          className="w-full"
                        >
                          <div className="rounded-xl overflow-hidden shadow-card">
                            <CoursePosterSVG course={course} styleId={poster.styleId} />
                          </div>
                          <p className="text-xs font-medium text-foreground mt-2 truncate">
                            {course.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{style?.label}</p>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(poster.id); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                        >
                          <Heart className={`w-3.5 h-3.5 ${poster.isFavorite ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "collections" && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {COLLECTIONS.map((col, i) => {
                const courseIds = collections[col.id] || [];
                return (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{col.icon}</span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{col.label}</p>
                          <p className="text-[10px] text-muted-foreground">{courseIds.length} courses</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {courseIds.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {courseIds.slice(0, 4).map((cId) => {
                          const c = MOCK_COURSES.find((mc) => mc.id === cId);
                          if (!c) return null;
                          return (
                            <button
                              key={cId}
                              onClick={() => { setCourse(c); navigate("/preview"); }}
                              className="flex-shrink-0 w-16"
                            >
                              <div className="rounded-lg overflow-hidden shadow-card">
                                <CoursePosterSVG course={c} styleId="classic" />
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1 truncate">{c.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {courseIds.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">{col.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "recent" && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {recentCourses.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No recently viewed courses</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCourses.map((course, i) => (
                    <motion.button
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setCourse(course); navigate("/preview"); }}
                      className="w-full flex items-center gap-3 px-4 py-3 glass-card rounded-xl shadow-card text-left"
                    >
                      <div className="w-12 flex-shrink-0 rounded-lg overflow-hidden">
                        <CoursePosterSVG course={course} styleId="classic" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{course.name}</p>
                        <p className="text-xs text-muted-foreground">{course.location}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Library;
