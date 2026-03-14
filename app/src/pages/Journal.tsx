import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, BookOpen, Map, Clock, Star, ChevronRight, Globe, Calendar, Trophy, Flag, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MOCK_COURSES, COLLECTIONS, POSTER_STYLES, Course } from "@/data/mockData";
import { useMemo } from "react";
import CoursePosterSVG from "@/components/CoursePosterSVG";
import { useState } from "react";

type Tab = "saved" | "rounds" | "collections" | "stats";

const Journal = () => {
  const navigate = useNavigate();
  const {
    isSubscribed, library, collections, recentCourses, rounds,
    toggleFavorite, setCourse, setPosterStyle, getStats,
  } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("saved");

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const favorites = library.filter((p) => p.isFavorite);
  const stats = getStats();

  const handleOpenPoster = (courseId: string, styleId: string) => {
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    if (course) {
      setCourse(course);
      setPosterStyle(styleId as any);
      navigate("/preview");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "saved", label: "Saved", icon: <BookOpen className="w-4 h-4" /> },
    { id: "rounds", label: "Rounds", icon: <Calendar className="w-4 h-4" /> },
    { id: "collections", label: "Collections", icon: <Star className="w-4 h-4" /> },
    { id: "stats", label: "Passport", icon: <Globe className="w-4 h-4" /> },
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
              My Journal
            </h1>
          </div>
        </motion.div>

        {/* Quick stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex gap-3 mb-6"
        >
          {[
            { label: "Mapped", value: stats.coursesMapped, icon: <Map className="w-4 h-4 text-primary" /> },
            { label: "Rounds", value: stats.totalRounds, icon: <Trophy className="w-4 h-4 text-gold" /> },
            { label: "Countries", value: stats.countriesPlayed.length, icon: <Flag className="w-4 h-4 text-accent" /> },
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
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[11px] font-medium transition-all duration-300 ${
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
          {/* SAVED TAB */}
          {activeTab === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Favorites section */}
              {favorites.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-destructive" /> Favorites
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {favorites.map((poster) => {
                      const course = MOCK_COURSES.find((c) => c.id === poster.courseId);
                      if (!course) return null;
                      return (
                        <button
                          key={poster.id}
                          onClick={() => handleOpenPoster(poster.courseId, poster.styleId)}
                          className="flex-shrink-0 w-24"
                        >
                          <div className="rounded-xl overflow-hidden shadow-card">
                            <CoursePosterSVG course={course} styleId={poster.styleId} />
                          </div>
                          <p className="text-[10px] font-medium text-foreground mt-1.5 truncate">
                            {course.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All posters */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                All Posters ({library.length})
              </p>
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
                        <button onClick={() => handleOpenPoster(poster.courseId, poster.styleId)} className="w-full">
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

              {/* Recently viewed */}
              {recentCourses.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recently Viewed
                  </p>
                  <div className="space-y-2">
                    {recentCourses.slice(0, 5).map((course, i) => (
                      <motion.button
                        key={course.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => { setCourse(course); navigate("/preview"); }}
                        className="w-full flex items-center gap-3 px-4 py-3 glass-card rounded-xl shadow-card text-left"
                      >
                        <div className="w-10 flex-shrink-0 rounded-lg overflow-hidden">
                          <CoursePosterSVG course={course} styleId="classic" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{course.name}</p>
                          <p className="text-[10px] text-muted-foreground">{course.location}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ROUNDS TAB */}
          {activeTab === "rounds" && (
            <motion.div
              key="rounds"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  My Rounds ({rounds.length})
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/add-round")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-golf"
                >
                  <Plus className="w-3 h-3" /> Add Round
                </motion.button>
              </div>

              {rounds.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="font-display text-lg font-semibold text-foreground italic">No rounds yet</p>
                  <p className="text-sm text-muted-foreground">Record your first round to start your golf journal</p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate("/add-round")}
                    className="mt-4 px-6 py-3 rounded-xl bg-gradient-green text-primary-foreground font-medium text-sm shadow-golf"
                  >
                    Add Your First Round
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map((round, i) => {
                    const course = MOCK_COURSES.find((c) => c.id === round.courseId);
                    if (!course) return null;
                    const date = new Date(round.datePlayed);
                    return (
                      <motion.button
                        key={round.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => navigate(`/round/${round.id}`)}
                        className="w-full glass-card rounded-2xl p-4 shadow-card text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 flex-shrink-0 rounded-lg overflow-hidden shadow-card">
                            <CoursePosterSVG course={course} styleId="classic" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{course.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{course.location}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              {round.score && (
                                <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {round.score}
                                </span>
                              )}
                            </div>
                            {round.notes && (
                              <p className="text-[10px] text-muted-foreground mt-1.5 italic line-clamp-1">"{round.notes}"</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* COLLECTIONS TAB */}
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

          {/* STATS / PASSPORT TAB */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Golf Passport header */}
              <div className="glass-card rounded-2xl p-5 shadow-elevated text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground italic">Golf Passport</h2>
                <p className="text-xs text-muted-foreground mt-1">Your journey around the world's finest courses</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Courses Mapped", value: stats.coursesMapped, icon: <Map className="w-5 h-5 text-primary" />, sub: "courses" },
                  { label: "Rounds Played", value: stats.totalRounds, icon: <Trophy className="w-5 h-5 text-gold" />, sub: "rounds" },
                  { label: "Countries", value: stats.countriesPlayed.length, icon: <Flag className="w-5 h-5 text-accent" />, sub: stats.countriesPlayed.slice(0, 3).join(", ") || "—" },
                  { label: "Regions", value: stats.statesPlayed.length, icon: <Globe className="w-5 h-5 text-muted-foreground" />, sub: stats.statesPlayed.slice(0, 3).join(", ") || "—" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="glass-card rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
                    <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Countries list */}
              {stats.countriesPlayed.length > 0 && (
                <div className="glass-card rounded-2xl p-4 shadow-card">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Countries Played</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.countriesPlayed.map((country) => (
                      <span key={country} className="px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scoring Distribution */}
              {(() => {
                const allHoleScores = rounds.flatMap((r) => {
                  if (!r.holeScores) return [];
                  const course = MOCK_COURSES.find((c: Course) => c.id === r.courseId);
                  if (!course) return [];
                  return r.holeScores.map((hs) => {
                    const holeData = course.scorecard.find((s) => s.hole === hs.hole);
                    return holeData ? { strokes: hs.strokes, par: holeData.par } : null;
                  }).filter(Boolean) as { strokes: number; par: number }[];
                });

                if (allHoleScores.length === 0) return null;

                const eagles = allHoleScores.filter((h) => h.strokes - h.par <= -2).length;
                const birdies = allHoleScores.filter((h) => h.strokes - h.par === -1).length;
                const pars = allHoleScores.filter((h) => h.strokes === h.par).length;
                const bogeys = allHoleScores.filter((h) => h.strokes - h.par === 1).length;
                const doubles = allHoleScores.filter((h) => h.strokes - h.par >= 2).length;
                const total = allHoleScores.length;

                const bars = [
                  { label: "Eagle+", count: eagles, color: "bg-amber-400" },
                  { label: "Birdie", count: birdies, color: "bg-green-500" },
                  { label: "Par", count: pars, color: "bg-gray-300" },
                  { label: "Bogey", count: bogeys, color: "bg-red-200" },
                  { label: "Double+", count: doubles, color: "bg-red-400" },
                ];

                return (
                  <div className="glass-card rounded-2xl p-4 shadow-card">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Scoring Distribution ({total} holes)
                    </p>
                    <div className="space-y-2">
                      {bars.map((bar) => (
                        <div key={bar.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 text-right">{bar.label}</span>
                          <div className="flex-1 h-5 bg-background/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: total > 0 ? `${(bar.count / total) * 100}%` : "0%" }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-full ${bar.color} rounded-full`}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-foreground w-8">{bar.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Favorites count */}
              <div className="glass-card rounded-2xl p-4 shadow-card flex items-center gap-3">
                <Heart className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{favorites.length} Favorites</p>
                  <p className="text-[10px] text-muted-foreground">Your most cherished course maps</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Journal;
