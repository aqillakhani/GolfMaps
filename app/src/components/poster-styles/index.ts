import { PosterStyleId, PosterToggles, DEFAULT_POSTER_TOGGLES } from "@/data/mockData";
import { Course } from "@/data/mockData";
import { ComponentType } from "react";
import { OSMCourseData } from "@/services/osmService";
import { HoleScore } from "@/data/rounds";
import ClassicStyle from "./ClassicStyle";
import DarkStyle from "./DarkStyle";
import VintageStyle from "./VintageStyle";
import BlueprintStyle from "./BlueprintStyle";
import WatercolorStyle from "./WatercolorStyle";
import MinimalistStyle from "./MinimalistStyle";

export interface StyleComponentProps {
  course: Course;
  toggles?: PosterToggles;
  osmData?: OSMCourseData | null;
  customText?: string;
  geojson?: GeoJSON.FeatureCollection | null;
  styleId?: PosterStyleId;
  userScores?: HoleScore[] | null;
}

export const STYLE_COMPONENTS: Record<PosterStyleId, ComponentType<StyleComponentProps>> = {
  classic: ClassicStyle,
  dark: DarkStyle,
  vintage: VintageStyle,
  blueprint: BlueprintStyle,
  watercolor: WatercolorStyle,
  minimalist: MinimalistStyle,
};
