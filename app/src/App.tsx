import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { isNative, isIOS } from "@/utils/platform";
import { configurePurchases } from "@/services/purchaseService";

// Lazy-loaded pages
const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Paywall = React.lazy(() => import("./pages/Paywall"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const PosterPreview = React.lazy(() => import("./pages/PosterPreview"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const Shipping = React.lazy(() => import("./pages/Shipping"));
const ReviewOrder = React.lazy(() => import("./pages/ReviewOrder"));
const Confirmation = React.lazy(() => import("./pages/Confirmation"));
const Library = React.lazy(() => import("./pages/Library"));
const Journal = React.lazy(() => import("./pages/Journal"));
const AddRound = React.lazy(() => import("./pages/AddRound"));
const RoundDetail = React.lazy(() => import("./pages/RoundDetail"));
const GiftPoster = React.lazy(() => import("./pages/GiftPoster"));
const GiftShipping = React.lazy(() => import("./pages/GiftShipping"));
const GiftConfirmation = React.lazy(() => import("./pages/GiftConfirmation"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Support = React.lazy(() => import("./pages/Support"));
const Feedback = React.lazy(() => import("./pages/Feedback"));
const About = React.lazy(() => import("./pages/About"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Collection = React.lazy(() => import("./pages/Collection"));
const MyList = React.lazy(() => import("./pages/MyList"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

const pageTransition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.45,
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen"
        >
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/paywall" element={<Paywall />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/preview" element={<PosterPreview />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/review-order" element={<ReviewOrder />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/library" element={<Library />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/add-round" element={<AddRound />} />
            <Route path="/round/:roundId" element={<RoundDetail />} />
            <Route path="/gift" element={<GiftPoster />} />
            <Route path="/gift-shipping" element={<GiftShipping />} />
            <Route path="/gift-confirmation" element={<GiftConfirmation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
};

const App = () => {
  useEffect(() => {
    // Apply safe-area classes for native platforms
    if (isNative()) {
      document.documentElement.classList.add("native-app");
      if (isIOS()) {
        document.documentElement.classList.add("ios");
      }
    }

    // Initialize RevenueCat
    configurePurchases();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
