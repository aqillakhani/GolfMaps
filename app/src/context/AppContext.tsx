import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Course, PosterStyleId, SavedPoster, CollectionId, MOCK_COURSES, PosterToggles, DEFAULT_POSTER_TOGGLES } from "@/data/mockData";
import { Round, HoleScore, GiftConfig, RoundStats, MOCK_ROUNDS } from "@/data/rounds";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { checkSubscriptionStatus } from "@/services/purchaseService";
import { ENV } from "@/config/env";

// Demo mode: treat as subscribed when no auth backend is configured
const DEMO_MODE = !ENV.SUPABASE_URL;

interface AppState {
  isSubscribed: boolean;
  selectedPlan: string | null;
  selectedCourse: Course | null;
  deliveryType: "digital" | "canvas";
  canvasSize: string | null;
  posterStyle: PosterStyleId;
  posterToggles: PosterToggles;
  customText: string;
  library: SavedPoster[];
  collections: Record<CollectionId, string[]>;
  recentCourses: Course[];
  rounds: Round[];
  giftConfig: GiftConfig | null;
  roundOverlay: { datePlayed?: string; score?: number | null } | null;
  subscribe: (planId: string) => void;
  setCourse: (course: Course | null) => void;
  setDeliveryType: (type: "digital" | "canvas") => void;
  setCanvasSize: (size: string | null) => void;
  setPosterStyle: (style: PosterStyleId) => void;
  setPosterToggles: (toggles: PosterToggles) => void;
  setCustomText: (text: string) => void;
  savePoster: (courseId: string, styleId: PosterStyleId) => void;
  toggleFavorite: (posterId: string) => void;
  addToCollection: (collectionId: CollectionId, courseId: string) => void;
  removeFromCollection: (collectionId: CollectionId, courseId: string) => void;
  addRecentCourse: (course: Course) => void;
  addRound: (round: Omit<Round, "id" | "createdAt">) => void;
  updateRound: (roundId: string, updates: Partial<Pick<Round, "score" | "holeScores" | "notes" | "scorecardImage">>) => void;
  deleteRound: (roundId: string) => void;
  setGiftConfig: (config: GiftConfig | null) => void;
  setRoundOverlay: (overlay: { datePlayed?: string; score?: number | null } | null) => void;
  getStats: () => RoundStats;
  reset: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [isSubscribed, setIsSubscribed] = useState(DEMO_MODE);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deliveryType, setDeliveryType] = useState<"digital" | "canvas">("digital");
  const [canvasSize, setCanvasSize] = useState<string | null>(null);
  const [posterStyle, setPosterStyle] = useState<PosterStyleId>("classic");
  const [posterToggles, setPosterToggles] = useState<PosterToggles>(DEFAULT_POSTER_TOGGLES);
  const [customText, setCustomText] = useState("");
  const [library, setLibrary] = useState<SavedPoster[]>([]);
  const [collections, setCollections] = useState<Record<CollectionId, string[]>>({
    played: [],
    dream: [],
    historic: [],
  });
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [giftConfig, setGiftConfig] = useState<GiftConfig | null>(null);
  const [roundOverlay, setRoundOverlay] = useState<{ datePlayed?: string; score?: number | null } | null>(null);

  // Load user data from Supabase when user signs in
  useEffect(() => {
    if (!user) {
      // No user — load mock data for demo / anonymous usage
      setRounds(MOCK_ROUNDS);
      setLibrary([]);
      setCollections({ played: [], dream: [], historic: [] });
      return;
    }

    const loadUserData = async () => {
      // Check subscription via RevenueCat
      const subscribed = await checkSubscriptionStatus();
      setIsSubscribed(subscribed);

      // Load saved posters
      const { data: posters } = await supabase
        .from("saved_posters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (posters) {
        setLibrary(
          posters.map((p) => ({
            id: p.id,
            courseId: p.course_id,
            styleId: p.style_id as PosterStyleId,
            savedAt: new Date(p.created_at).getTime(),
            isFavorite: p.is_favorite,
          }))
        );
      }

      // Load collections
      const { data: cols } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id);

      if (cols) {
        const grouped: Record<CollectionId, string[]> = { played: [], dream: [], historic: [] };
        cols.forEach((c) => {
          if (c.collection_type in grouped) {
            grouped[c.collection_type as CollectionId].push(c.course_id);
          }
        });
        setCollections(grouped);
      }

      // Load rounds
      const { data: userRounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (userRounds) {
        setRounds(
          userRounds.map((r) => ({
            id: r.id,
            courseId: r.course_id,
            datePlayed: r.date_played,
            score: r.score,
            notes: r.notes || "",
            scorecardImage: r.scorecard_photo_url,
            holeScores: r.hole_scores as HoleScore[] | null,
            createdAt: new Date(r.created_at).getTime(),
          }))
        );
      }
    };

    loadUserData();
  }, [user]);

  const subscribe = (planId: string) => {
    setSelectedPlan(planId);
    setIsSubscribed(true);
  };

  const setCourse = (course: Course | null) => setSelectedCourse(course);

  const savePoster = useCallback(async (courseId: string, styleId: PosterStyleId) => {
    const id = `${courseId}-${styleId}-${Date.now()}`;
    const newPoster: SavedPoster = { id, courseId, styleId, savedAt: Date.now(), isFavorite: false };

    setLibrary((prev) => {
      if (prev.find((p) => p.courseId === courseId && p.styleId === styleId)) return prev;
      return [...prev, newPoster];
    });

    if (user) {
      await supabase.from("saved_posters").upsert({
        id,
        user_id: user.id,
        course_id: courseId,
        style_id: styleId,
        is_favorite: false,
      });
    }
  }, [user]);

  const toggleFavorite = useCallback(async (posterId: string) => {
    setLibrary((prev) =>
      prev.map((p) => (p.id === posterId ? { ...p, isFavorite: !p.isFavorite } : p))
    );

    if (user) {
      const poster = library.find((p) => p.id === posterId);
      if (poster) {
        await supabase
          .from("saved_posters")
          .update({ is_favorite: !poster.isFavorite })
          .eq("id", posterId);
      }
    }
  }, [user, library]);

  const addToCollection = useCallback(async (collectionId: CollectionId, courseId: string) => {
    setCollections((prev) => ({
      ...prev,
      [collectionId]: prev[collectionId].includes(courseId)
        ? prev[collectionId]
        : [...prev[collectionId], courseId],
    }));

    if (user) {
      await supabase.from("collections").upsert({
        id: `${user.id}-${collectionId}-${courseId}`,
        user_id: user.id,
        collection_type: collectionId,
        course_id: courseId,
      });
    }
  }, [user]);

  const removeFromCollection = useCallback(async (collectionId: CollectionId, courseId: string) => {
    setCollections((prev) => ({
      ...prev,
      [collectionId]: prev[collectionId].filter((id) => id !== courseId),
    }));

    if (user) {
      await supabase
        .from("collections")
        .delete()
        .eq("user_id", user.id)
        .eq("collection_type", collectionId)
        .eq("course_id", courseId);
    }
  }, [user]);

  const addRecentCourse = useCallback((course: Course) => {
    setRecentCourses((prev) => {
      const filtered = prev.filter((c) => c.id !== course.id);
      return [course, ...filtered].slice(0, 10);
    });
  }, []);

  const addRound = useCallback(async (round: Omit<Round, "id" | "createdAt">) => {
    const id = `round-${Date.now()}`;
    const newRound: Round = { ...round, id, createdAt: Date.now() };
    setRounds((prev) => [newRound, ...prev]);

    if (user) {
      await supabase.from("rounds").insert({
        id,
        user_id: user.id,
        course_id: round.courseId,
        date_played: round.datePlayed,
        score: round.score,
        notes: round.notes || null,
        scorecard_photo_url: round.scorecardImage || null,
        hole_scores: round.holeScores || null,
      });
    }
  }, [user]);

  const updateRound = useCallback(async (roundId: string, updates: Partial<Pick<Round, "score" | "holeScores" | "notes" | "scorecardImage">>) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, ...updates } : r))
    );

    if (user) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.score !== undefined) dbUpdates.score = updates.score;
      if (updates.holeScores !== undefined) dbUpdates.hole_scores = updates.holeScores;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.scorecardImage !== undefined) dbUpdates.scorecard_photo_url = updates.scorecardImage;
      await supabase.from("rounds").update(dbUpdates).eq("id", roundId);
    }
  }, [user]);

  const deleteRound = useCallback(async (roundId: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));

    if (user) {
      await supabase.from("rounds").delete().eq("id", roundId);
    }
  }, [user]);

  const getStats = useCallback((): RoundStats => {
    const courseIds = new Set(rounds.map((r) => r.courseId));
    const countries = new Set<string>();
    const states = new Set<string>();
    courseIds.forEach((id) => {
      const c = MOCK_COURSES.find((mc: Course) => mc.id === id);
      if (c) {
        countries.add(c.country);
        states.add(c.region);
      }
    });
    return {
      totalRounds: rounds.length,
      coursesMapped: new Set([...library.map((p) => p.courseId), ...courseIds]).size,
      countriesPlayed: Array.from(countries),
      statesPlayed: Array.from(states),
    };
  }, [rounds, library]);

  const reset = () => {
    setSelectedCourse(null);
    setDeliveryType("digital");
    setCanvasSize(null);
    setPosterStyle("classic");
    setPosterToggles(DEFAULT_POSTER_TOGGLES);
    setCustomText("");
    setGiftConfig(null);
    setRoundOverlay(null);
  };

  return (
    <AppContext.Provider
      value={{
        isSubscribed, selectedPlan, selectedCourse, deliveryType, canvasSize, posterStyle, posterToggles, customText,
        library, collections, recentCourses, rounds, giftConfig, roundOverlay,
        subscribe, setCourse, setDeliveryType, setCanvasSize, setPosterStyle, setPosterToggles, setCustomText,
        savePoster, toggleFavorite, addToCollection, removeFromCollection, addRecentCourse,
        addRound, updateRound, deleteRound, setGiftConfig, setRoundOverlay, getStats, reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
