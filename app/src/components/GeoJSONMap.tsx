import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { renderGeoJSONToSvg, LayerStyles } from "@/rendering/renderGeoJSON";

interface GeoJSONMapProps {
  geojson: GeoJSON.FeatureCollection;
  width: number;
  height: number;
  layerStyles: LayerStyles;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  padding?: number;
  showHoleNumbers?: boolean;
}

export default function GeoJSONMap({
  geojson,
  width,
  height,
  layerStyles,
  textColor,
  bgColor,
  fontFamily,
  padding = 15,
  showHoleNumbers = true,
}: GeoJSONMapProps) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!gRef.current || !geojson.features.length) return;
    const g = d3.select(gRef.current);
    renderGeoJSONToSvg(g, geojson, width, height, layerStyles, textColor, bgColor, fontFamily, padding, showHoleNumbers);
  }, [geojson, width, height, layerStyles, textColor, bgColor, fontFamily, padding, showHoleNumbers]);

  return <g ref={gRef} />;
}
