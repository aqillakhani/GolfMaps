import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";
import ScorecardOverlay from "./ScorecardOverlay";

interface BlueprintStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const BlueprintStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "blueprint", userScores }: BlueprintStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <rect width="400" height="560" fill="hsl(215, 55%, 18%)" />
      {/* Grid */}
      {Array.from({ length: 28 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="hsl(215, 40%, 25%)" strokeWidth="0.3" />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="560" stroke="hsl(215, 40%, 25%)" strokeWidth="0.3" />
      ))}

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
            bgFill: "hsl(215, 55%, 15%)",
            borderStroke: "hsl(0, 0%, 95%)",
            borderWidth: 0.3,
            borderRadius: 0,
            borderOpacity: 0.9,
            headerColor: "hsl(0, 0%, 95%)",
            labelColor: "hsl(0, 0%, 95%)",
            valueColor: "hsl(200, 70%, 70%)",
            dividerStroke: "hsl(0, 0%, 95%)",
            dividerOpacity: 0.4,
            fontFamily: "'DM Sans', monospace",
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
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.blueprint}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.blueprint}
            bgColor={THEME_BG[styleId] || THEME_BG.blueprint}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.blueprint}
            padding={18}
            showHoleNumbers={toggles.showHoleNumbers}
          />
        </g>
      )}

      {/* Title */}
      <text x="200" y="485" textAnchor="middle" fontFamily="'DM Sans', monospace" fontSize="18" fontWeight="700" letterSpacing="4" fill="hsl(0, 0%, 95%)">
        {course.name.toUpperCase().replace(/ GOLF CLUB| GOLF LINKS| GOLF COURSE| COUNTRY CLUB/g, "")}
      </text>
      {(toggles.showLocation || toggles.showYardagePar) && (
        <text x="200" y="505" textAnchor="middle" fontFamily="'DM Sans', monospace" fontSize="8" fill="hsl(200, 70%, 70%)" letterSpacing="2">
          {toggles.showLocation ? course.location.toUpperCase() : ""}{toggles.showLocation && toggles.showYardagePar ? " · " : ""}{toggles.showYardagePar ? `${course.yardage.toLocaleString()} YDS · PAR ${course.par}` : ""}
        </text>
      )}
      {toggles.showCourseFacts && (
        <text x="200" y="521" textAnchor="middle" fontFamily="'DM Sans', monospace" fontSize="6" fill="hsl(200, 50%, 55%)" letterSpacing="1">
          {course.designer.toUpperCase()} · EST. {course.established}
        </text>
      )}

      {customText && (
        <>
          <line x1="160" y1={toggles.showCourseFacts ? 528 : 514} x2="240" y2={toggles.showCourseFacts ? 528 : 514} stroke="hsl(0, 0%, 95%)" strokeWidth="0.3" opacity="0.4" />
          <text x="200" y={toggles.showCourseFacts ? 540 : 526} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="8" fill="hsl(0, 0%, 95%)">
            {customText}
          </text>
        </>
      )}

      <rect x="12" y="12" width="376" height="536" rx="0" fill="none" stroke="hsl(0, 0%, 95%)" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
};

export default BlueprintStyle;
