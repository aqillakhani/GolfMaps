import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";
import ScorecardOverlay from "./ScorecardOverlay";

interface VintageStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const VintageStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "vintage", userScores }: VintageStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <rect width="400" height="560" fill="hsl(35, 35%, 88%)" />
      <rect width="400" height="560" fill="hsl(30, 25%, 80%)" opacity="0.15" />

      {/* Map area — D3 GeoJSON rendering */}
      {hasGeoJSON && (
        <g transform="translate(15, 40)">
          <GeoJSONMap
            geojson={geojson!}
            width={370}
            height={405}
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.vintage}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.vintage}
            bgColor={THEME_BG[styleId] || THEME_BG.vintage}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.vintage}
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
          theme={{
            bgFill: "hsl(35, 30%, 84%)",
            borderStroke: "hsl(30, 20%, 65%)",
            borderWidth: 0.4,
            borderRadius: 2,
            headerColor: "hsl(30, 25%, 30%)",
            labelColor: "hsl(30, 25%, 30%)",
            valueColor: "hsl(30, 15%, 45%)",
            dividerStroke: "hsl(30, 20%, 65%)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        />
      )}

      {/* Decorative corners */}
      <line x1="20" y1="20" x2="50" y2="20" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="20" y1="20" x2="20" y2="50" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="380" y1="20" x2="350" y2="20" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="380" y1="20" x2="380" y2="50" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="20" y1="540" x2="50" y2="540" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="20" y1="540" x2="20" y2="510" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="380" y1="540" x2="350" y2="540" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />
      <line x1="380" y1="540" x2="380" y2="510" stroke="hsl(30, 20%, 45%)" strokeWidth="0.5" />

      {toggles.showCourseFacts && (
        <text x="200" y="468" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="10" letterSpacing="6" fill="hsl(30, 20%, 50%)" fontWeight="500">
          EST. {course.established}
        </text>
      )}
      <text x="200" y="493" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="20" fontWeight="700" letterSpacing="4" fill="hsl(30, 25%, 25%)">
        {course.name.toUpperCase().replace(/ GOLF CLUB| GOLF LINKS| GOLF COURSE| COUNTRY CLUB/g, "")}
      </text>
      {toggles.showLocation && (
        <text x="200" y="513" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="9" fontStyle="italic" fill="hsl(30, 15%, 50%)">
          {course.location}
        </text>
      )}
      {toggles.showYardagePar && toggles.showCourseFacts && (
        <text x="200" y="527" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fill="hsl(30, 15%, 55%)" letterSpacing="1">
          {course.designer} · Par {course.par} · {course.yardage.toLocaleString()} yards
        </text>
      )}
      {toggles.showYardagePar && !toggles.showCourseFacts && (
        <text x="200" y="527" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fill="hsl(30, 15%, 55%)" letterSpacing="1">
          Par {course.par} · {course.yardage.toLocaleString()} yards
        </text>
      )}

      {customText && (
        <>
          <line x1="160" y1="535" x2="240" y2="535" stroke="hsl(30, 15%, 55%)" strokeWidth="0.3" />
          <text x="200" y="547" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="8" fill="hsl(30, 25%, 25%)">
            {customText}
          </text>
        </>
      )}
    </svg>
  );
};

export default VintageStyle;
