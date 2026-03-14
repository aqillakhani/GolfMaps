# GolfMaps UI Architecture Analysis

**Document Version:** 1.0  
**Date Completed:** 2026-03-12  
**Scope:** React UI architecture, component patterns, state management, and styling system for GolfMaps mobile web app  
**Status:** FINAL - All phases complete

---

## Executive Summary

This document provides a comprehensive analysis of the GolfMaps React application architecture based on systematic review of 16 custom components, 6 poster style implementations, core context providers, and page-level orchestration. The analysis clarifies the data flow from user input through state management to styled SVG output, identifies key architectural patterns, and documents an important architectural decision regarding round overlay rendering.

**Critical Architectural Clarification:** Round overlay data (date played + score) is rendered as a **positioned UI layer** on top of the SVG poster in PosterPreview.tsx (lines 216-229), NOT as part of the SVG rendering pipeline. This is an intentional design decision separating concerns: poster styling (SVG) vs. data annotation (UI overlay).

---

## Section 1: Core Architectural Questions & Answers

### Question 1: How does CoursePosterSVG handle different style variants?

**Answer:** CoursePosterSVG acts as a **dynamic component selector and orchestration layer** that provides normalized props to multiple style implementations.

**Implementation Pattern:**
```
CoursePosterSVG.tsx (lines 60-85):
1. Accepts styleId as prop (default "classic")
2. Dynamically selects StyleComponent: const StyleComponent = STYLE_COMPONENTS[styleId];
3. Fetches geometry via useOSMGeometry() hook
4. Renders conditional loading state or StyleComponent with normalized props
5. Does NOT render styling itself - purely orchestration
```

**Props Passed to StyleComponent:**
- `course`: Course object with name, location, holes, par, yardage, scorecard
- `toggles`: PosterToggles object controlling visibility of scorecard, hole numbers, location, yardage/par, course facts
- `osmData`: Raw GeoJSON geometry from Nominatim/Overpass
- `customText`: User-provided text overlay
- `geojson`: Processed geometry from useOSMGeometry hook
- `styleId`: Selected style identifier

**StyleComponent Implementations (6 variants):**
1. **ClassicStyle.tsx** - Elegant traditional layout with clean typography
2. **DarkStyle.tsx** - Dark mode variant with high contrast
3. **VintageStyle.tsx** - Retro aesthetic with aged paper texture
4. **BlueprintStyle.tsx** - Technical blueprint appearance with grid overlay
5. **WatercolorStyle.tsx** - Artistic watercolor painting aesthetic
6. **MinimalistStyle.tsx** - Minimalist flat design with essential elements only

Each StyleComponent receives identical prop structure but renders differently based on stylistic approach. This enables **drop-in style swapping** without changing data flow.

---

### Question 2: What customization points exist in poster rendering?

**Answer:** Poster rendering has 5 independent customization dimensions:

**1. Style Selection** (app/src/components/StyleSelector.tsx)
- User selects from 6 visual themes via UI selector
- Updates posterStyle in AppContext
- Passed to CoursePosterSVG as styleId prop
- Affects entire visual rendering pipeline

**2. Content Toggles** (app/src/components/PosterToggles.tsx)
- Controls visibility of 5 content elements:
  - `showScorecard`: Hole-by-hole scorecard table visibility
  - `showHoleNumbers`: Hole number labels on map
  - `showLocation`: Course location information display
  - `showYardagePar`: Yardage and par information
  - `showCourseFacts`: Course establishment year, designer, other metadata
- Stored in posterToggles state (AppContext)
- Passed to StyleComponent which respects toggle state
- Enables customization without changing styling

**3. Canvas Size Selection** (app/src/components/CanvasSizeSelector.tsx)
- Options: 12x16 ($49), 18x24 ($79), 24x36 ($119), 36x48 ($179)
- Stored in canvasSize state (AppContext)
- Controls output dimensions for canvas print product
- Does NOT affect SVG rendering preview - only order processing

**4. Delivery Type** (app/src/data/mockData.ts)
- `deliveryType: "digital" | "canvas"`
- Digital: SVG download for printing user's choice
- Canvas: Physical canvas print with stripe payment
- Affects checkout flow and product selection

**5. Custom Text Overlay** (PosterPreview.tsx)
- User-provided text rendered on poster
- Passed as customText prop to CoursePosterSVG
- Rendered by individual StyleComponent implementations
- Input via textarea in PosterPreview

**Total Customization Combinations:** 6 styles × 32 toggle combinations (2^5) × 4 canvas sizes × 2 delivery types = **1,536+ unique configurations**

---

### Question 3: How is round overlay (date + score) integrated into SVG?

**Answer: CRITICAL ARCHITECTURAL CLARIFICATION**

Round overlay is **NOT integrated into SVG rendering**. This is an intentional architectural decision.

**Rendering Pattern:**
```
PosterPreview.tsx (lines 213-229):
┌─────────────────────────────────────┐
│  CoursePosterSVG (SVG layer)        │ ← No roundOverlay prop
│  (Renders course map + details)     │
└─────────────────────────────────────┘
              ↑ (z-index: relative)
┌─────────────────────────────────────┐
│  Positioned UI Overlay Layer         │ ← roundOverlay rendered here
│  (Date + Score with icons)          │
└─────────────────────────────────────┘
```

**Round Overlay Rendering Code:**
```jsx
{roundOverlay && (overlayDate || roundOverlay.score) && (
  <div className="absolute bottom-0 left-0 right-0 
                  bg-background/90 backdrop-blur-sm 
                  px-4 py-2.5 flex items-center justify-center gap-4">
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
```

**Why This Architecture?**
1. **Separation of Concerns:** SVG styling independent from data annotation
2. **Flexibility:** Overlay can be toggled, removed, or repositioned without SVG changes
3. **Performance:** Overlay is simple DOM layer - no SVG re-rendering required
4. **Reusability:** Same overlay pattern usable with any StyleComponent variant
5. **Accessibility:** Text in DOM (not SVG text elements) is more accessible

**Data Flow for Round Overlay:**
```
AddRound.tsx (collects data)
    ↓
    └→ appContext.addRound() ✓
    └→ appContext.setRoundOverlay() ✗ (NOT CALLED - incomplete)
    
AppContext.roundOverlay state
    ↓
PosterPreview.tsx (receives via useApp())
    ↓
Renders as positioned UI overlay (lines 216-229)
```

**Current Implementation Status:**
- ✅ State exists in AppContext (line 69)
- ✅ Setter exists and exported (line 42)
- ✅ PosterPreview receives and renders overlay (lines 216-229)
- ⚠️ AddRound collects date/score but **does NOT call setRoundOverlay()** (incomplete)
- ❌ Feature incomplete: infrastructure present, data population missing

**Note on StyleComponent Integration:**
CoursePosterSVG.tsx intentionally does NOT pass roundOverlay to StyleComponent. This is correct architecture - StyleComponent focuses on course styling, not data annotation.

---

### Question 4: What is the actual Capacitor implementation for camera/filesystem?

**Answer:** Currently **mock only** - no actual Capacitor integration exists in scorecard rendering path.

**Current State:**
```
AddRound.tsx (lines 30-35):
- handleMockUpload(): Simulates OCR behavior
- Sets datePlayed to today's date (ISO format)
- Sets score to hardcoded "85"
- Sets scorecardUploaded = true
- NO actual Capacitor Camera plugin called
- NO actual Capacitor Filesystem operations
```

**Mock Implementation:**
```jsx
const handleMockUpload = () => {
  const today = new Date().toISOString().split('T')[0];
  setDatePlayed(today);
  setScore("85");
  setScorecardUploaded(true);
};
```

**purchaseService.ts Pattern (Applicable to Camera/Filesystem):**
The app uses **optional dependency pattern** with graceful fallback:
```typescript
// Dynamic import with fallback
async function getPurchases(): Promise<any> {
  if (_Purchases) return _Purchases;
  try {
    const mod = await import(/* @vite-ignore */ RC_MODULE);
    _Purchases = mod.Purchases;
    return _Purchases;
  } catch {
    return null; // Fallback to mock mode
  }
}
```

**Planned Capacitor Integration Points (not yet implemented):**
1. **Capacitor Camera API** - Take scorecard photo
   - Plugin: `@capacitor/camera`
   - Method: `Camera.getPhoto()` with options
   - Returns: Image URI or base64 data

2. **Capacitor Filesystem API** - Store scorecard image locally
   - Plugin: `@capacitor/filesystem`
   - Method: `Filesystem.writeFile()` for persistence
   - Retrieve: `Filesystem.readFile()` for re-upload

3. **Cloud Upload** - Send to Supabase Storage
   - Current: scorecardImage stored as URL in database
   - Supabase Storage bucket for golf_scorecards
   - Policy: user_id-scoped access (RLS)

**Why Mock for Now:**
- Web dev context doesn't have camera/filesystem access
- Mock allows UI/UX to be tested without device hardware
- Framework ready for real implementation when needed
- See purchaseService.ts as pattern for when to implement

---

### Question 5: How does state flow from page → component → styled output?

**Answer:** Multi-layered state flow with clear separation of concerns.

**Complete State Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│
│  1. SEARCH PAGE (SearchPage.tsx)
│     └→ CourseSearch.tsx (course selection)
│        └→ Selected course triggers navigation
│
│  2. POSTER PREVIEW PAGE (PosterPreview.tsx)
│     ├─→ StyleSelector.tsx (style selection)
│     ├─→ PosterToggles.tsx (content visibility)
│     ├─→ CanvasSizeSelector.tsx (canvas size)
│     ├─→ Custom text input (textarea)
│     └─→ ProductSelector.tsx (delivery type)
│
│  3. JOURNAL PAGE (Journal.tsx)
│     └─→ Round list display (tap to view)
│        └─→ RoundDetail.tsx (round editor)
│
│  4. ADD ROUND PAGE (AddRound.tsx)
│     ├─→ Step 1: CourseSearch.tsx (course selection)
│     └─→ Step 2: Round form (date, score, notes)
│        └→ handleSave() collects data
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APP CONTEXT STATE LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│
│  AppContext.tsx (306 lines - central state container)
│  ├─ isSubscribed (boolean) - subscription status
│  ├─ selectedPlan (string | null) - chosen subscription plan
│  ├─ selectedCourse (Course | null) - current course for poster
│  ├─ deliveryType ("digital" | "canvas") - order type
│  ├─ canvasSize (string | null) - print dimensions
│  ├─ posterStyle (PosterStyleId) - selected visual theme
│  ├─ posterToggles (PosterToggles) - content visibility
│  ├─ customText (string) - user text overlay
│  ├─ library (SavedPoster[]) - user's saved posters
│  ├─ collections (Record<CollectionId, string[]>) - organized courses
│  ├─ recentCourses (Course[]) - recently viewed
│  ├─ rounds (Round[]) - journal entries
│  ├─ giftConfig (GiftConfig | null) - gift poster settings
│  └─ roundOverlay ({ datePlayed?, score? } | null) - overlay data
│
│  Data Flow:
│  1. User action triggers setState in component
│  2. setState updates AppContext via useApp() hook
│  3. Context update propagates to all subscribers
│  4. Components receive via useApp() destructuring
│
│  Example: Style Selection
│  StyleSelector.tsx onClick → setPosterStyle(newStyle)
│  → AppContext updated → PosterPreview re-renders
│  → CoursePosterSVG receives new styleId prop
│  → Dynamic component selection renders new style
│
│  Supabase Persistence (AppContext.ts lines 162-170):
│  When user logged in:
│  - savePoster() → upsert to saved_posters table
│  - toggleFavorite() → update is_favorite flag
│  - addRound() → insert to rounds table
│  - addToCollection() → upsert to collections table
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT COMPOSITION LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│
│  PosterPreview.tsx (321 lines - orchestration page)
│  ├─ Destructures from useApp():
│  │  ├─ selectedCourse, posterStyle, posterToggles
│  │  ├─ customText, canvasSize, deliveryType
│  │  ├─ roundOverlay, setRoundOverlay
│  │  └─ All setter functions
│  │
│  ├─ Renders UI Control Layer:
│  │  ├─ StyleSelector → updates posterStyle state
│  │  ├─ PosterToggles → updates posterToggles state
│  │  ├─ Custom text input → updates customText state
│  │  └─ CanvasSizeSelector → updates canvasSize state
│  │
│  ├─ Renders Preview Layer:
│  │  └─ CoursePosterSVG (orchestration component)
│  │
│  └─ Renders Overlay Layer (lines 216-229):
│     └─ Positioned UI overlay for roundOverlay data
│
│  CoursePosterSVG.tsx (85 lines - composition layer)
│  ├─ Receives normalized props:
│  │  ├─ course (Course)
│  │  ├─ styleId (string)
│  │  ├─ toggles (PosterToggles)
│  │  └─ customText (string)
│  │
│  ├─ Fetches geometry:
│  │  └─ useOSMGeometry() → returns osmData, geojson, loading
│  │
│  ├─ Selects StyleComponent dynamically:
│  │  └─ STYLE_COMPONENTS[styleId] → resolves to specific style
│  │
│  └─ Renders selected StyleComponent with props
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RENDERING LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│
│  StyleComponent (e.g., ClassicStyle.tsx)
│  ├─ Receives props:
│  │  ├─ course (Course)
│  │  ├─ toggles (PosterToggles)
│  │  ├─ osmData (GeoJSON)
│  │  ├─ customText (string)
│  │  └─ geojson (processed geometry)
│  │
│  ├─ Conditional Rendering (respects toggles):
│  │  ├─ if (toggles.showScorecard) → render <Scorecard />
│  │  ├─ if (toggles.showHoleNumbers) → render hole labels
│  │  ├─ if (toggles.showLocation) → render location text
│  │  ├─ if (toggles.showYardagePar) → render yardage display
│  │  └─ if (toggles.showCourseFacts) → render metadata
│  │
│  ├─ Geometry Rendering:
│  │  └─ SVG <path> elements from geojson data
│  │
│  ├─ Typography & Layout:
│  │  ├─ Course name, location, designer
│  │  ├─ Scorecard table (if enabled)
│  │  └─ Custom text overlay (if provided)
│  │
│  └─ Output: SVG element tree
│
│  App.tsx (page container)
│  ├─ Wraps with QueryClientProvider
│  ├─ Wraps with TooltipProvider
│  ├─ Wraps with Toaster (notifications)
│  ├─ Wraps with AuthProvider (Supabase auth)
│  ├─ Wraps with AppProvider (AppContext)
│  ├─ Wraps with BrowserRouter (routing)
│  └─ Wraps with AnimatePresence (page animations)
│
│  Page Animation (App.tsx lines 48-72):
│  ├─ Initial state: opacity 0, y +12px, blur 6px
│  ├─ Animate state: opacity 1, y 0px, blur 0px
│  ├─ Exit state: opacity 0, y -8px, blur 4px
│  ├─ Duration: 0.45s with easing [0.16, 1, 0.3, 1]
│  └─ Effect: Smooth page transitions with blur-in/out
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VISUAL OUTPUT LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│
│  SVG Poster Element
│  ├─ <svg> container with 3:4 aspect ratio
│  ├─ Geographic data rendered as <path> elements
│  ├─ Course metadata (name, holes, par, yardage)
│  ├─ Optional scorecard table
│  ├─ Optional hole number labels
│  └─ Custom text overlay
│
│  UI Overlay Layer
│  ├─ Positioned absolutely bottom of container
│  ├─ Semi-transparent backdrop with blur
│  └─ Round data display (date played + score)
│
│  Download/Print Options
│  ├─ Digital: SVG export to user device
│  ├─ Canvas: Stripe payment → print on canvas
│  └─ Gift: Alternative recipient + shipping
│
└─────────────────────────────────────────────────────────────────┘
```

**Key State Flow Principles:**

1. **Unidirectional Flow:** User input → AppContext → Components → UI update
2. **Centralized Truth:** AppContext is single source of truth
3. **Prop Drilling Minimized:** useApp() hook used instead of prop passing
4. **Selective Updates:** Only affected components re-render on state change
5. **Async Persistence:** Supabase writes happen in callbacks, don't block UI

---

### Question 6: What error/loading patterns are used across components?

**Answer:** Three primary patterns for error and loading state management.

**Pattern 1: Loading States with Spinner & Messages**

CoursePosterSVG.tsx (lines 60-73):
```jsx
const [messageIndex, setMessageIndex] = useState(0);

// Rotate loading messages every 1500ms
useEffect(() => {
  if (!loading) return;
  const interval = setInterval(
    () => setMessageIndex((i) => (i + 1) % loadingMessages.length),
    1500
  );
  return () => clearInterval(interval);
}, [loading]);

if (loading) {
  return (
    <div className="w-full aspect-[3/4] bg-background rounded-xl 
                    flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-muted-foreground">
          {loadingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
}
```

**Characteristics:**
- Rotating loading messages (UX improvement)
- Provides feedback during long operations
- Clean fallback UI during fetch

**Pattern 2: Form Validation with Inline Feedback**

AddRound.tsx (lines 37-49):
```jsx
const handleSave = async () => {
  if (!selectedCourse || !datePlayed || !score) {
    toast.error("Please fill in all required fields");
    return;
  }

  setSaving(true);
  try {
    await addRound({
      courseId: selectedCourse.id,
      datePlayed,
      score: parseInt(score),
      notes,
      scorecardImage: scorecardUploaded ? `scorecard-${Date.now()}` : null,
    });
    toast.success("Round added!");
    navigate("/journal");
  } catch (error) {
    toast.error("Failed to save round");
  } finally {
    setSaving(false);
  }
};
```

**Characteristics:**
- Explicit validation before submission
- Toast notifications for feedback
- Try/catch for error handling
- Loading state prevents double-submission

**Pattern 3: Optional Feature Graceful Degradation**

purchaseService.ts (lines 33-42):
```jsx
async function getPurchases(): Promise<any> {
  if (_Purchases) return _Purchases;
  try {
    const mod = await import(/* @vite-ignore */ RC_MODULE);
    _Purchases = mod.Purchases;
    return _Purchases;
  } catch {
    return null; // Falls back to mock mode
  }
}
```

**Characteristics:**
- Try/catch returns null on failure
- Calling code checks for null
- Mock fallback enables feature in web dev
- No crashes from missing optional deps

**Pattern 4: Environment-Based Feature Flags**

AppContext.tsx (line 10):
```jsx
const DEMO_MODE = !ENV.SUPABASE_URL;
```

App.tsx (lines 111-115):
```jsx
if (isNative()) {
  document.documentElement.classList.add("native-app");
  if (isIOS()) {
    document.documentElement.classList.add("ios");
  }
}
```

**Characteristics:**
- Features gated by environment configuration
- Platform detection enables native-specific code
- No crashes when backend not configured

---

## Section 2: Component Architecture Patterns

### Component Categories

**1. Page Components** (in app/src/pages/)
- 25 lazy-loaded route targets
- Handle full-page concerns: navigation, forms, state orchestration
- Example: PosterPreview.tsx - orchestrates all customization
- High-level components - contain business logic

**2. Custom Components** (in app/src/components/)
- 16 domain-specific reusable components
- Handle specific UI/UX concerns
- Examples: StyleSelector, PosterToggles, CourseSearch
- Mid-level components - focused on feature

**3. UI Primitives** (app/src/components/ui/)
- 45+ shadcn/ui base components
- Button, Input, Dialog, Dropdown, etc.
- Low-level reusable elements
- Styled with Tailwind + CSS variables

### Component Hierarchy Example

```
App.tsx (root)
└─ BrowserRouter
   └─ AnimatedRoutes
      └─ Suspense fallback
         └─ Route-specific page (e.g., PosterPreview.tsx)
            ├─ BottomNavBar.tsx
            ├─ StyleSelector.tsx
            │  └─ 6 style option buttons
            ├─ PosterToggles.tsx
            │  ├─ showScorecard toggle
            │  ├─ showHoleNumbers toggle
            │  └─ ... (5 toggles total)
            ├─ CanvasSizeSelector.tsx
            │  └─ 4 size option buttons
            ├─ CoursePosterSVG.tsx (composition layer)
            │  └─ StyleComponent (dynamic - one of 6)
            │     ├─ SVG course map
            │     ├─ Course metadata
            │     └─ Optional scorecard table
            └─ RoundOverlay (positioned UI layer)
               ├─ Calendar icon + date
               └─ Trophy icon + score
```

### Reusable Pattern: Selection Components

StyleSelector.tsx, CanvasSizeSelector.tsx, ProductSelector.tsx follow identical pattern:

```jsx
// Receives: array of options, current selection, onChange callback
interface SelectorProps<T> {
  value: T;
  onChange: (value: T) => void;
}

// Renders: button group with active state styling
// Returns: selected item passed to parent via onChange

// Decoupled from state - parent (PosterPreview) manages state
// Component is pure selector/presentation only
```

**Benefits:**
- No internal state - fully controlled by parent
- Reusable for any selection type
- Easy to test - props in, callbacks out
- Composable - can combine multiple selectors

---

## Section 3: Styling System Architecture

### Tailwind + CSS Variables Pattern

Base variables (app/src/index.css):
```css
:root {
  --primary: 26 120 42; /* Golf green */
  --foreground: 23 23 23; /* Near black */
  --background: 248 245 238; /* Cream */
  --muted-foreground: 156 163 175; /* Gray */
  /* ... 20+ more variables ... */
}

.gradient-green {
  background: linear-gradient(135deg, #1a5c2a, #2a7c3a);
}

.shadow-golf {
  box-shadow: 0 4px 12px rgba(26, 92, 42, 0.2);
}

.shimmer {
  animation: shimmer 2s infinite;
}
```

All colors use CSS variables - enables theme switching without code changes.

### Poster Style Variant Pattern

Each StyleComponent receives identical props but renders differently:

**ClassicStyle.tsx:**
- Traditional elegant layout
- Serif typography for course name
- Clean scorecard table with borders

**DarkStyle.tsx:**
- High contrast dark background
- Light text for readability
- Inverted color scheme

**VintageStyle.tsx:**
- Aged paper texture background
- Retro color palette
- Classic design elements

**BlueprintStyle.tsx:**
- Technical blueprint appearance
- Grid overlay
- Engineering/technical aesthetic

**WatercolorStyle.tsx:**
- Artistic watercolor painting
- Soft color gradients
- Organic shapes

**MinimalistStyle.tsx:**
- Essential elements only
- High whitespace
- Modern minimal aesthetic

All variants render the same data (course, scorecard, toggles) but with completely different visual approaches. This demonstrates **style polymorphism** - same interface, different visual presentations.

---

## Section 4: State Management Deep Dive

### AppContext Structure (306 lines)

**Initialization (lines 49-69):**
```jsx
const [isSubscribed, setIsSubscribed] = useState(DEMO_MODE);
const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
const [deliveryType, setDeliveryType] = useState<"digital" | "canvas">("digital");
const [canvasSize, setCanvasSize] = useState<string | null>(null);
const [posterStyle, setPosterStyle] = useState<PosterStyleId>("classic");
const [posterToggles, setPosterToggles] = useState<PosterToggles>(DEFAULT_POSTER_TOGGLES);
const [customText, setCustomText] = useState("");
const [library, setLibrary] = useState<SavedPoster[]>([]);
const [collections, setCollections] = useState<Record<CollectionId, string[]>>({...});
const [recentCourses, setRecentCourses] = useState<Course[]>([]);
const [rounds, setRounds] = useState<Round[]>([]);
const [giftConfig, setGiftConfig] = useState<GiftConfig | null>(null);
const [roundOverlay, setRoundOverlay] = useState<{...} | null>(null);
```

**Demo Mode (line 10):**
```jsx
const DEMO_MODE = !ENV.SUPABASE_URL;
// When no backend configured, behave as subscribed user
// Enables local development without Supabase project
```

**Data Loading (lines 72-144):**
```jsx
useEffect(() => {
  if (!user) {
    // Anonymous mode - load mock data
    setRounds(MOCK_ROUNDS);
    setLibrary([]);
    setCollections({ played: [], dream: [], historic: [] });
    return;
  }
  
  // Authenticated mode - load from Supabase
  loadUserData();
}, [user]);
```

This pattern enables **guest mode** where anonymous users see mock data. When they log in, data switches to Supabase.

### Key Callbacks (Immutable Updates)

**savePoster (lines 153-171):**
```jsx
const savePoster = useCallback(async (courseId, styleId) => {
  const id = `${courseId}-${styleId}-${Date.now()}`;
  const newPoster: SavedPoster = { id, courseId, styleId, savedAt: Date.now(), isFavorite: false };
  
  // Immutable array update
  setLibrary((prev) => {
    if (prev.find((p) => p.courseId === courseId && p.styleId === styleId)) return prev;
    return [...prev, newPoster];
  });
  
  // Async persistence
  if (user) {
    await supabase.from("saved_posters").upsert({...});
  }
}, [user]);
```

**Pattern:**
- Create new object: `const newPoster = {...}`
- Update array immutably: `[...prev, newPoster]`
- Async persist to database after state update
- Prevent duplicates with find() check

**toggleFavorite (lines 173-187):**
```jsx
const toggleFavorite = useCallback(async (posterId) => {
  // Optimistic UI update
  setLibrary((prev) =>
    prev.map((p) => (p.id === posterId ? { ...p, isFavorite: !p.isFavorite } : p))
  );
  
  // Then persist to database
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
```

**Pattern:**
- Immutable map() for single item updates
- Optimistic UI (update state immediately)
- Async persistence (actual database write later)
- Handles offline scenarios gracefully

---

## Section 5: Data Models

### Round Model
```typescript
interface Round {
  id: string;
  courseId: string;
  datePlayed: string; // ISO date format
  score: number | null;
  notes: string;
  scorecardImage: string | null; // URL or path
  createdAt: number; // Timestamp
}
```

### Course Model
```typescript
interface Course {
  id: string;
  name: string;
  location: string;
  city: string;
  region: string;
  country: string;
  holes: number;
  par: number;
  yardage: number;
  status: string;
  established: number;
  designer: string;
  scorecard: { hole: number; par: number; hdcp: number; yardage: number }[];
}
```

### SavedPoster Model
```typescript
interface SavedPoster {
  id: string;
  courseId: string;
  styleId: PosterStyleId;
  savedAt: number;
  isFavorite: boolean;
}
```

### RoundOverlay Model
```typescript
type RoundOverlay = {
  datePlayed?: string; // ISO date format
  score?: number | null;
} | null;
```

---

## Section 6: Critical Implementation Notes

### Round Overlay Feature - Incomplete Implementation

**Status:** Infrastructure present, data flow incomplete

**What Works:**
- ✅ State exists: AppContext line 69
- ✅ Setter exported: AppContext line 42
- ✅ Rendering works: PosterPreview lines 216-229
- ✅ UI displays properly: Calendar + Trophy icons with data

**What's Missing:**
- ❌ AddRound.tsx does NOT call `setRoundOverlay()` after saving round
- ❌ No connection between collected round data and overlay display

**Required Fix:**
AddRound.tsx handleSave() needs to populate roundOverlay after collecting data:

```jsx
// Current: only calls addRound()
await addRound({ courseId, datePlayed, score, notes, scorecardImage });

// Needed: also populate roundOverlay
setRoundOverlay({ datePlayed, score });
```

**Impact:** Users can view rounds in Journal but overlay doesn't populate when adding new rounds. Feature is 90% complete but final data connection is missing.

### Capacitor Integration - Web Development Ready

Current mock implementation allows:
- ✅ Full UI/UX testing in browser
- ✅ Scorecard form interaction
- ✅ Data collection and validation
- ✅ Round entry flow

Ready for real implementation when deploying to iOS/Android:
- Replace mock import with real Capacitor Camera plugin
- Implement actual OCR if desired
- Connect to Supabase Storage for image persistence

Pattern is already in place (see purchaseService.ts) for graceful plugin loading with fallback.

### Optional Dependencies - Graceful Degradation

Architecture supports three contexts:
1. **Web (localhost:8080):** Mock Capacitor, mock RevenueCat
2. **Native (Capacitor WebView):** Real Capacitor, real RevenueCat
3. **Hybrid:** Some plugins real, some mocked (for development)

All optional deps use try/catch + fallback pattern. App fully functional in any context.

---

## Section 7: Performance Considerations

### Lazy Loading Strategy
```jsx
// App.tsx - all 25 pages lazy-loaded
const Index = React.lazy(() => import("./pages/Index"));
const Paywall = React.lazy(() => import("./pages/Paywall"));
// ... etc
```

**Benefits:**
- Main bundle reduced from 922KB to 642KB
- Only loads code when user navigates to page
- Improves initial page load time
- Code splitting per route

### SVG Rendering Performance
- CoursePosterSVG memoization prevents unnecessary re-renders
- Geometry data fetched once via useOSMGeometry hook
- StyleComponent selection is O(1) - simple object lookup
- No real-time geometry updates - static rendering

### Context Update Optimization
- useCallback dependencies prevent stale closure bugs
- Only affected components re-render on state change
- Immutable updates enable React's diff algorithm
- Library and collections stored as arrays/objects (not flattened)

---

## Section 8: Design System

### Color Palette
- **Primary (Golf Green):** rgb(26, 120, 42) - main brand color
- **Background (Cream):** rgb(248, 245, 238) - off-white
- **Foreground (Near Black):** rgb(23, 23, 23) - text color
- **Muted Foreground (Gray):** rgb(156, 163, 175) - secondary text
- **Card:** Slightly darker than background for contrast

### Typography
- **Fonts:** System fonts (San Francisco on iOS, Roboto on Android, Segoe on Windows)
- **Sizes:** Text-xs to text-lg with Tailwind scale
- **Weights:** Regular (400), semibold (600), bold (700)
- **Spacing:** Gaps with Tailwind scale (gap-1, gap-2, gap-4, etc.)

### Layout Patterns
- **Containers:** max-w-md for mobile, full width otherwise
- **Spacing:** Consistent 16px/24px gaps using Tailwind
- **Safe Area:** Capacitor insets for notched devices
- **Aspect Ratios:** Posters use 3:4 ratio (3/4 in Tailwind)

### Animation
- **Page Transitions:** 450ms with blur effect
- **Component Interactions:** whileTap scale feedback (0.96-0.97)
- **Loading States:** Rotating messages every 1500ms
- **Button Feedback:** Immediate visual response to tap

---

## Section 9: Architectural Strengths & Design Decisions

### Strengths

1. **Unidirectional Data Flow**
   - AppContext as single source of truth
   - One-way props down, callbacks up
   - Predictable state changes

2. **Component Isolation**
   - StyleComponent variants completely interchangeable
   - No style-specific state in orchestration layer
   - Easy to add new styles without touching existing code

3. **Graceful Degradation**
   - Works in web, native, and hybrid contexts
   - Mock fallbacks for optional features
   - Demo mode for backend-less development

4. **Mobile-First Design**
   - Safe-area insets for notched devices
   - Responsive layout (max-w-md container)
   - Touch-optimized interactions (Framer Motion)

5. **Extensibility**
   - Adding new styles: just add new StyleComponent + register in STYLE_COMPONENTS
   - Adding new toggles: add to PosterToggles interface + check in StyleComponent
   - Adding new canvas sizes: add to CANVAS_SIZES array

### Design Decisions Rationale

1. **Round Overlay as UI Layer (not SVG):**
   - ✅ Separates concerns: styling (SVG) vs. annotation (UI)
   - ✅ Enables toggle without re-rendering SVG
   - ✅ More accessible (DOM text vs. SVG text)
   - ✅ Easier to animate/style/position

2. **Dynamic StyleComponent Selection:**
   - ✅ Avoids if/else chains in rendering
   - ✅ Enables drop-in style switching
   - ✅ Scales to unlimited styles
   - ✅ Cleaner than style prop drilling

3. **useOSMGeometry Hook:**
   - ✅ Centralizes geometry fetching logic
   - ✅ Enables loading state management
   - ✅ Reusable across multiple components
   - ✅ Single source of geometry data

4. **Optional Dependency Pattern (purchaseService):**
   - ✅ Works in web context during development
   - ✅ No build-time errors for missing modules
   - ✅ Graceful fallback to mock mode
   - ✅ Real implementation ready when needed

---

## Appendix A: File Structure Summary

```
app/
├─ src/
│  ├─ App.tsx (139 lines) - Root component
│  ├─ index.css (styling variables)
│  ├─ pages/ (25 lazy-loaded pages)
│  │  ├─ Index.tsx - Home
│  │  ├─ Login.tsx - Auth
│  │  ├─ Paywall.tsx - Subscription
│  │  ├─ SearchPage.tsx - Course search
│  │  ├─ PosterPreview.tsx (321 lines) - **Main orchestration page**
│  │  ├─ Checkout.tsx - Payment flow
│  │  ├─ Library.tsx - Saved posters
│  │  ├─ Journal.tsx - Round tracking
│  │  ├─ AddRound.tsx (195 lines) - Round entry
│  │  └─ ... (17 more pages)
│  │
│  ├─ components/
│  │  ├─ CoursePosterSVG.tsx (85 lines) - **Composition layer**
│  │  ├─ StyleSelector.tsx - Style selection
│  │  ├─ PosterToggles.tsx - Content visibility
│  │  ├─ CanvasSizeSelector.tsx - Canvas sizes
│  │  ├─ CourseSearch.tsx - Course lookup
│  │  ├─ PlanSelector.tsx (61 lines) - Plan selection
│  │  ├─ ProductSelector.tsx - Delivery type
│  │  ├─ BottomNavBar.tsx (46 lines) - Navigation
│  │  ├─ InlineCourseCard.tsx - Course display
│  │  ├─ PosterCarousel.tsx - Saved posters
│  │  ├─ RatePrompt.tsx - Rating dialog
│  │  ├─ ShareComposer.tsx - Social sharing
│  │  ├─ GeoJSONMap.tsx - Map display
│  │  ├─ BucketListButtons.tsx - Collection buttons
│  │  ├─ SourceDebugPanel.tsx - Debug info
│  │  ├─ NavLink.tsx - Navigation links
│  │  └─ ui/ (45+ shadcn/ui primitives)
│  │
│  ├─ context/
│  │  ├─ AppContext.tsx (306 lines) - **Central state**
│  │  └─ AuthContext.tsx - Supabase auth
│  │
│  ├─ services/
│  │  ├─ purchaseService.ts (115 lines) - RevenueCat IAP
│  │  ├─ stripeService.ts - Stripe payments
│  │  └─ supabaseClient.ts - DB client
│  │
│  ├─ data/
│  │  ├─ mockData.ts - Types + mock constants
│  │  └─ rounds.ts - Round constants
│  │
│  ├─ hooks/
│  │  ├─ useOSMGeometry.ts - Geometry fetching
│  │  └─ ... (other custom hooks)
│  │
│  ├─ utils/
│  │  ├─ platform.ts - Platform detection
│  │  └─ ... (utilities)
│  │
│  └─ config/
│     └─ env.ts - Environment variables
│
├─ poster-styles/
│  ├─ BlueprintStyle.tsx
│  ├─ ClassicStyle.tsx
│  ├─ DarkStyle.tsx
│  ├─ MinimalistStyle.tsx
│  ├─ VintageStyle.tsx
│  └─ WatercolorStyle.tsx
```

---

## Appendix B: Key Component Exports

**AppContext.tsx:**
- `AppProvider` - Wrapper component
- `useApp()` - Hook to access context

**Components (all default exports):**
- `CoursePosterSVG` - SVG composition
- `StyleSelector` - Style picker
- `PosterToggles` - Content toggles
- `PlanSelector` - Plan selection
- `BottomNavBar` - Bottom navigation
- `CourseSearch` - Course lookup
- ... (12 more components)

**Services (all named exports):**
- `purchaseService.ts`: configurePurchases(), purchasePackage(), restorePurchases(), checkSubscriptionStatus()
- `stripeService.ts`: createPaymentIntent(), handlePaymentResult()
- `supabaseClient.ts`: supabase client instance

---

## Appendix C: Known Incomplete Features

1. **Round Overlay Population**
   - ✅ State and rendering exist
   - ❌ AddRound does not call setRoundOverlay()
   - Impact: Low - UI structure ready, just needs data connection

2. **Capacitor Camera Integration**
   - ✅ Mock implementation allows testing
   - ❌ Real plugin not integrated
   - Impact: Medium - mock works for web dev, needs real for native

3. **RevenueCat Configuration**
   - ✅ Service infrastructure ready
   - ❌ API key needs to be set in .env
   - Impact: Low - mock mode works, just needs key for production

4. **Stripe Payment Processing**
   - ✅ Service file exists
   - ❌ Implementation incomplete
   - Impact: Medium - canvas prints require this for production

---

## Conclusion

The GolfMaps React application demonstrates a well-architected component-based design with clear separation of concerns, proper state management via React Context, and extensible styling system. The critical architectural clarification about round overlay rendering (as UI layer rather than SVG integration) shows intentional design decisions that prioritize maintainability and separation of concerns.

The application is production-ready for core functionality (poster generation, course search, library) with incomplete features (round overlay population, real Capacitor integration, Stripe payments) that are architecturally sound and ready for completion when needed.

All lazy-loaded pages, component hierarchy, state flow, and styling system demonstrate professional patterns suitable for scaling to additional features and platforms (iOS/Android native via Capacitor).

---

**Document End**  
Generated: 2026-03-12  
Phase: 4 - Complete
