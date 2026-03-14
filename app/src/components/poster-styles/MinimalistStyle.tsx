import { Course, PosterToggles, DEFAULT_POSTER_TOGGLES, PosterStyleId } from "@/data/mockData";
import { generateCourseLayout } from "./layoutUtils";
import { OSMCourseData } from "@/services/osmService";
import GeoJSONMap from "@/components/GeoJSONMap";
import { THEME_LAYERS, THEME_TEXT, THEME_BG, THEME_FONT } from "@/rendering/themeStyles";
import { HoleScore } from "@/data/rounds";

interface MinimalistStyleProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

const MinimalistStyle = ({ course, toggles = DEFAULT_POSTER_TOGGLES, osmData, customText = "", geojson, styleId = "minimalist" }: MinimalistStyleProps) => {
  const { front9, back9 } = generateCourseLayout(course, osmData);
  const hasGeoJSON = geojson && geojson.features.length > 0;

  return (
    <svg viewBox="0 0 400 560" className="w-full h-full">
      <rect width="400" height="560" fill="hsl(0, 0%, 100%)" />

      {/* Map area — D3 GeoJSON rendering */}
      {hasGeoJSON && (
        <g transform="translate(15, 40)">
          <GeoJSONMap
            geojson={geojson!}
            width={370}
            height={405}
            layerStyles={THEME_LAYERS[styleId] || THEME_LAYERS.minimalist}
            textColor={THEME_TEXT[styleId] || THEME_TEXT.minimalist}
            bgColor={THEME_BG[styleId] || THEME_BG.minimalist}
            fontFamily={THEME_FONT[styleId] || THEME_FONT.minimalist}
            padding={18}
            showHoleNumbers={toggles.showHoleNumbers}
          />
        </g>
      )}

      <line x1="160" y1="475" x2="240" y2="475" stroke="hsl(0, 0%, 15%)" strokeWidth="0.5" />
      <text x="200" y="497" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="16" fontWeight="700" letterSpacing="6" fill="hsl(0, 0%, 15%)">
        {course.name.toUpperCase().replace(/ GOLF CLUB| GOLF LINKS| GOLF COURSE| COUNTRY CLUB/g, "")}
      </text>
      {toggles.showLocation && (
        <text x="200" y="517" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="7" fill="hsl(0, 0%, 50%)" letterSpacing="3">
          {course.location.toUpperCase()}
        </text>
      )}
      {toggles.showYardagePar && (
        <text x="200" y="533" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fill="hsl(0, 0%, 65%)" letterSpacing="2">
          PAR {course.par} · {course.yardage.toLocaleString()} YDS
        </text>
      )}

      {customText && (
        <>
          <line x1="160" y1={toggles.showYardagePar ? 540 : 524} x2="240" y2={toggles.showYardagePar ? 540 : 524} stroke="hsl(0, 0%, 15%)" strokeWidth="0.3" opacity="0.2" />
          <text x="200" y={toggles.showYardagePar ? 552 : 536} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="8" fill="hsl(0, 0%, 15%)">
            {customText}
          </text>
        </>
      )}
    </svg>
  );
};

export default MinimalistStyle;
