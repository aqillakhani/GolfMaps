import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";
import ScorecardOverlay from "./ScorecardOverlay";

interface WatercolorStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const WatercolorStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "watercolor", userScores }: WatercolorStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <defs>
        <filter id="watercolor-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="400" height="560" fill="hsl(45, 40%, 96%)" />

      {/* Soft background washes */}
      <ellipse cx="200" cy="230" rx="180" ry="160" fill="hsl(130, 30%, 85%)" opacity="0.25" filter="url(#watercolor-blur)" />
      <ellipse cx="140" cy="190" rx="80" ry="60" fill="hsl(200, 40%, 85%)" opacity="0.15" filter="url(#watercolor-blur)" />

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
            bgFill: "hsl(45, 40%, 94%)",
            borderStroke: "hsl(150, 20%, 70%)",
            borderWidth: 0.3,
            borderRadius: 3,
            borderOpacity: 0.9,
            headerColor: "hsl(150, 30%, 30%)",
            labelColor: "hsl(150, 30%, 30%)",
            valueColor: "hsl(150, 20%, 50%)",
            dividerStroke: "hsl(150, 20%, 70%)",
            fontFamily: "'Cormorant Garamond', serif",
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
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.watercolor}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.watercolor}
            bgColor={THEME_BG[styleId] || THEME_BG.watercolor}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.watercolor}
            padding={18}
            showHoleNumbers={toggles.showHoleNumbers}
          />
        </g>
      )}

      {/* Title */}
      <text x="200" y="485" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="20" fontWeight="600" letterSpacing="2" fill="hsl(150, 30%, 30%)" fontStyle="italic">
        {course.name.replace(/ Golf Club| Golf Links| Golf Course| Country Club/g, "")}
      </text>
      {toggles.showLocation && (
        <text x="200" y="505" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="9" fill="hsl(150, 15%, 50%)" fontStyle="italic">
          {course.location}{toggles.showYardagePar ? ` · Par ${course.par}` : ""}
        </text>
      )}
      {!toggles.showLocation && toggles.showYardagePar && (
        <text x="200" y="505" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="9" fill="hsl(150, 15%, 50%)" fontStyle="italic">
          Par {course.par} · {course.yardage.toLocaleString()} yards
        </text>
      )}
      {toggles.showCourseFacts && (
        <text x="200" y="521" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fill="hsl(150, 15%, 60%)" letterSpacing="1">
          {course.designer} · Est. {course.established}
        </text>
      )}

      {customText && (
        <>
          <line x1="160" y1={toggles.showCourseFacts ? 528 : 514} x2="240" y2={toggles.showCourseFacts ? 528 : 514} stroke="hsl(150, 15%, 60%)" strokeWidth="0.3" />
          <text x="200" y={toggles.showCourseFacts ? 540 : 526} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="8" fill="hsl(150, 30%, 30%)">
            {customText}
          </text>
        </>
      )}
    </svg>
  );
};

export default WatercolorStyle;
