/**
 * Renders GeoJSON features into an SVG group using D3.
 * This is the accurate rendering approach from golfmaps2.
 */
import * as d3 from "d3";
import { createProjection, rewindFeatureCollection } from "./projections";
import type { PaddingBox, AvoidZone } from "./projections";

export interface LayerStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export type LayerStyles = Record<string, LayerStyle>;

const LAYER_ORDER = [
  "water", "fairway", "bunker", "green",
];

export function renderGeoJSONToSvg(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  geojson: GeoJSON.FeatureCollection,
  width: number,
  height: number,
  layerStyles: LayerStyles,
  textColor: string,
  bgColor: string,
  fontFamily: string,
  padding: number | PaddingBox = 15,
  showHoleNumbers: boolean = true,
  avoidZone?: AvoidZone,
) {
  g.selectAll("*").remove();

  const rewound = rewindFeatureCollection(geojson);
  const projection = createProjection(rewound, width, height, padding, avoidZone);
  const path = d3.geoPath().projection(projection);

  // Render layers in order
  for (const layerType of LAYER_ORDER) {
    const features = rewound.features.filter(
      (f: any) => f.properties?.type === layerType
    );
    if (features.length === 0) continue;

    const style = layerStyles[layerType];
    if (!style) continue;

    const group = g.append("g").attr("class", `layer-${layerType}`);
    group
      .selectAll("path")
      .data(features)
      .join("path")
      .attr("d", (d: any) => path(d) || "")
      .attr("fill", style.fill)
      .attr("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth)
      .attr("opacity", style.opacity);
  }

  // Render hole labels — prefer green centroids, fall back to hole centerlines
  if (!showHoleNumbers) return;
  let labelFeatures = rewound.features.filter(
    (f: any) => f.properties?.type === "green" && f.properties?.ref
  );
  if (labelFeatures.length === 0) {
    labelFeatures = rewound.features.filter(
      (f: any) => f.properties?.type === "hole" && f.properties?.ref
    );
  }
  if (labelFeatures.length > 0) {
    const labelGroup = g.append("g").attr("class", "hole-labels");
    labelFeatures.forEach((feature: any) => {
      const centroid = path.centroid(feature);
      if (!centroid || isNaN(centroid[0])) return;

      labelGroup
        .append("circle")
        .attr("cx", centroid[0])
        .attr("cy", centroid[1])
        .attr("r", 5.5)
        .attr("fill", bgColor)
        .attr("opacity", 0.9);

      labelGroup
        .append("text")
        .attr("x", centroid[0])
        .attr("y", centroid[1])
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", textColor)
        .attr("font-size", "6px")
        .attr("font-family", fontFamily)
        .attr("font-weight", "600")
        .text(feature.properties.ref);
    });
  }
}
