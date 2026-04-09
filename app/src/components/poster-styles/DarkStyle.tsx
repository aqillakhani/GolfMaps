import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";
import ScorecardOverlay from "./ScorecardOverlay";

interface DarkStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const DarkStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "dark", userScores }: DarkStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  const gold = "hsl(42, 78%, 60%)";
  const goldDim = "hsl(42, 50%, 40%)";
  const darkGreen = "hsl(147, 40%, 12%)";
  const darkGreenLight = "hsl(147, 35%, 16%)";

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <defs>
        <linearGradient id="dark-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkGreenLight} />
          <stop offset="100%" stopColor={darkGreen} />
        </linearGradient>
      </defs>

      <rect width="400" height="560" fill="url(#dark-bg)" />
      <rect x="12" y="12" width="376" height="536" rx="2" fill="none" stroke={goldDim} strokeWidth="0.5" opacity="0.4" />

      {/* Map area — D3 GeoJSON rendering */}
      {hasGeoJSON && (
        <g transform="translate(15, 40)">
          <GeoJSONMap
            geojson={geojson!}
            width={370}
            height={405}
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.dark}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.dark}
            bgColor={THEME_BG[styleId] || THEME_BG.dark}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.dark}
            padding={18}
            showHoleNumbers={toggles.showHoleNumbers}
            avoidZone={toggles.showScorecard ? { x: 240, y: 0, width: 130, height: 70 } : undefined}
          />
        </g>
      )}

      {/* Scorecard */}
      {toggles.showScorecard && course.scorecard.length > 0 && (
        <ScorecardOverlay
          front9={front9}
          back9={back9}
          par={course.par}
          yardage={course.yardage}
          established={course.established}
          designer={course.designer}
          userScores={userScores}
          showScore={toggles.showScore}
          theme={{
            bgFill: darkGreen,
            borderStroke: goldDim,
            borderWidth: 0.4,
            borderRadius: 1,
            headerColor: gold,
            labelColor: gold,
            valueColor: "hsl(42, 40%, 75%)",
            dividerStroke: goldDim,
            dividerOpacity: 0.5,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      )}

      <text x="200" y="492" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="20" fontWeight="700" letterSpacing="4" fill={gold}>
        {course.name.toUpperCase().replace(/ GOLF CLUB| GOLF LINKS| GOLF COURSE| COUNTRY CLUB/g, "")}
      </text>

      {toggles.showLocation && toggles.showYardagePar && (
        <text x="200" y="510" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="7" fill="hsl(42, 40%, 65%)" letterSpacing="1">
          {course.city}, {course.region} | {course.yardage.toLocaleString()} yards
        </text>
      )}
      {toggles.showLocation && !toggles.showYardagePar && (
        <text x="200" y="510" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="7" fill="hsl(42, 40%, 65%)" letterSpacing="1">
          {course.city}, {course.region}
        </text>
      )}
      {!toggles.showLocation && toggles.showYardagePar && (
        <text x="200" y="510" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="7" fill="hsl(42, 40%, 65%)" letterSpacing="1">
          {course.yardage.toLocaleString()} yards · Par {course.par}
        </text>
      )}

      {toggles.showCourseFacts && (
        <text x="200" y="526" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="5.5" fill="hsl(42, 30%, 50%)" letterSpacing="0.5">
          Designed by {course.designer} · Est. {course.established}
        </text>
      )}

      {customText && (
        <>
          <line x1="160" y1={toggles.showCourseFacts ? 534 : 520} x2="240" y2={toggles.showCourseFacts ? 534 : 520} stroke="hsl(42, 40%, 40%)" strokeWidth="0.3" />
          <text x="200" y={toggles.showCourseFacts ? 546 : 532} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="8" fill={gold}>
            {customText}
          </text>
        </>
      )}
    </svg>
  );
};

export default DarkStyle;
