import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { renderGeoJSONToSvg, LayerStyles } from "@/rendering/renderGeoJSON";
import type { PaddingBox, AvoidZone } from "@/rendering/projections";

interface GeoJSONMapProps {
  geojson: GeoJSON.FeatureCollection;
  width: number;
  height: number;
  layerStyles: LayerStyles;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  padding?: number | PaddingBox;
  showHoleNumbers?: boolean;
  avoidZone?: AvoidZone;
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
  avoidZone,
}: GeoJSONMapProps) {
  const gRef = useRef<SVGGElement>(null);
  const depsKey = useMemo(() => JSON.stringify({ padding, avoidZone }), [padding, avoidZone]);

  useEffect(() => {
    if (!gRef.current || !geojson.features.length) return;
    const g = d3.select(gRef.current);
    renderGeoJSONToSvg(g, geojson, width, height, layerStyles, textColor, bgColor, fontFamily, padding, showHoleNumbers, avoidZone);
  }, [geojson, width, height, layerStyles, textColor, bgColor, fontFamily, depsKey, showHoleNumbers]);

  return <g ref={gRef} />;
}
