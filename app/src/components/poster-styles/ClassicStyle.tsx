import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";
import ScorecardOverlay from "./ScorecardOverlay";

interface ClassicStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const ClassicStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "classic", userScores }: ClassicStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <defs>
        <filter id="classic-soft">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>

      {/* White background */}
      <rect width="400" height="560" fill="hsl(40, 30%, 98%)" />

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
          theme={{
            bgFill: "hsl(40, 25%, 96%)",
            borderStroke: "hsl(100, 15%, 85%)",
            borderWidth: 0.5,
            borderRadius: 3,
            headerColor: "hsl(145, 45%, 22%)",
            labelColor: "hsl(150, 35%, 12%)",
            valueColor: "hsl(150, 15%, 45%)",
            dividerStroke: "hsl(100, 15%, 85%)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      )}

      {/* Map area — D3 GeoJSON rendering */}
      {hasGeoJSON && (
        <g transform="translate(15, 40)">
          <GeoJSONMap
            geojson={geojson!}
            width={370}
            height={405}
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.classic}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.classic}
            bgColor={THEME_BG[styleId] || THEME_BG.classic}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.classic}
            padding={18}
            showHoleNumbers={toggles.showHoleNumbers}
          />
        </g>
      )}

      {/* Title block */}
      <text x="200" y="480" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="22" fontWeight="700" letterSpacing="3" fill="hsl(145, 45%, 22%)">
        {course.name.toUpperCase().replace(/ GOLF CLUB| GOLF LINKS| GOLF COURSE| COUNTRY CLUB/g, "")}
      </text>
      {toggles.showLocation && toggles.showYardagePar && (
        <text x="200" y="500" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="10" fontStyle="italic" fill="hsl(150, 15%, 45%)">
          {course.location} · {course.yardage.toLocaleString()} yards · Par {course.par}
        </text>
      )}
      {toggles.showLocation && !toggles.showYardagePar && (
        <text x="200" y="500" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="10" fontStyle="italic" fill="hsl(150, 15%, 45%)">
          {course.location}
        </text>
      )}
      {!toggles.showLocation && toggles.showYardagePar && (
        <text x="200" y="500" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="10" fontStyle="italic" fill="hsl(150, 15%, 45%)">
          {course.yardage.toLocaleString()} yards · Par {course.par}
        </text>
      )}
      {toggles.showCourseFacts && (
        <text x="200" y="516" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fill="hsl(150, 15%, 60%)" letterSpacing="1">
          Designed by {course.designer} · Est. {course.established}
        </text>
      )}

      {/* Custom text */}
      {customText && (
        <>
          <line x1="160" y1={toggles.showCourseFacts ? 524 : 510} x2="240" y2={toggles.showCourseFacts ? 524 : 510} stroke="hsl(150, 15%, 60%)" strokeWidth="0.3" />
          <text x="200" y={toggles.showCourseFacts ? 536 : 522} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="8" fill="hsl(145, 45%, 22%)">
            {customText}
          </text>
        </>
      )}

      {/* Border */}
      <rect x="8" y="8" width="384" height="544" rx="4" fill="none" stroke="hsl(100, 15%, 85%)" strokeWidth="0.5" />
    </svg>
  );
};

export default ClassicStyle;
