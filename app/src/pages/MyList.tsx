import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flag, Printer, Trash2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import BottomNavBar from "@/components/BottomNavBar";
import { MOCK_COURSES, Course } from "@/data/mockData";
import {
  getBucketList,
  BucketListData,
  removeFromWantToPlay,
  removeFromPlayed,
} from "@/lib/bucketListStorage";
import { toast } from "sonner";

type Filter = "wantToPlay" | "played";

const MyList = () => {
  const navigate = useNavigate();
  const { isSubscribed, setCourse } = useApp();
  const [filter, setFilter] = useState<Filter>("wantToPlay");
  const [data, setData] = useState<BucketListData>({ wantToPlay: [], played: [] });

  useEffect(() => {
    setData(getBucketList());
  }, []);

  if (!isSubscribed) {
    navigate("/");
    return null;
  }

  const playedCount = data.played.length;
  const wantCount = data.wantToPlay.length;
  const items = filter === "wantToPlay" ? data.wantToPlay : data.played;

  const handleRemove = (courseId: string) => {
    if (filter === "wantToPlay") {
      removeFromWantToPlay(courseId);
    } else {
      removeFromPlayed(courseId);
    }
    setData(getBucketList());
    toast("Removed from your list");
  };

  const handleCreatePrint = (courseId: string) => {
    const course = MOCK_COURSES.find((c: Course) => c.id === courseId);
    if (course) {
      setCourse(course);
      navigate("/preview");
    }
  };

  const typePillColor: Record<string, string> = {
    Links: "bg-primary/10 text-primary",
    Parkland: "bg-emerald-100 text-emerald-700",
    Coastal: "bg-sky-100 text-sky-700",
    Sandbelt: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="min-h-screen bg-gradient-cream pb-24">
      <div className="px-6 pt-12 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
            My List
          </h1>
        </motion.div>

        {/* Stats line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-bold mb-4"
          style={{ color: "#1A5C2A" }}
        >
          {playedCount} course{playedCount !== 1 ? "s" : ""} played · {wantCount} on your bucket list
        </motion.p>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "wantToPlay" as Filter, label: "Want to Play" },
            { id: "played" as Filter, label: "Played" },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: filter === f.id ? "#1A5C2A" : "#E8F2E8",
                color: filter === f.id ? "#F8F5EE" : "#1A5C2A",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Course list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 space-y-3"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Flag className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {filter === "wantToPlay" ? "No courses on your bucket list yet" : "No courses marked as played yet"}
                </p>
                <button
                  onClick={() => navigate("/search")}
                  className="mt-2 px-5 py-2.5 rounded-full text-sm font-semibold text-primary-foreground"
                  style={{ backgroundColor: "#1A5C2A" }}
                >
                  Search Courses
                </button>
              </motion.div>
            ) : (
              items.map((item) => {
                const pillClass = typePillColor[item.type] || typePillColor.Parkland;
                return (
                  <motion.div
                    key={item.courseId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    className="glass-card rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{item.courseName}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.city}, {item.country}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pillClass}`}>
                            {item.type}
                          </span>
                          {"playedDate" in item && (
                            <span className="text-[10px] text-muted-foreground">
                              Played {new Date((item as any).playedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleCreatePrint(item.courseId)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary-foreground"
                        style={{ backgroundColor: "#1A5C2A" }}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Create Print
                      </button>
                      <button
                        onClick={() => handleRemove(item.courseId)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-destructive bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default MyList;
