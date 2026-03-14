import type { LayerStyles } from "./renderGeoJSON";

/**
 * Layer styles per poster theme — colors match each poster's aesthetic.
 */
export const THEME_LAYERS: Record<string, LayerStyles> = {
  classic: {
    boundary: { fill: "#E8E5D8", stroke: "none", strokeWidth: 0, opacity: 1 },
    trees: { fill: "#7BA36E", stroke: "none", strokeWidth: 0, opacity: 0.6 },
    water: { fill: "#6B9BC3", stroke: "#5A8AB2", strokeWidth: 0.5, opacity: 0.9 },
    fairway: { fill: "#4A7C59", stroke: "none", strokeWidth: 0, opacity: 0.9 },
    rough: { fill: "#5C8A4D", stroke: "none", strokeWidth: 0, opacity: 0.5 },
    bunker: { fill: "#D4C5A0", stroke: "#C4B590", strokeWidth: 0.5, opacity: 0.95 },
    green: { fill: "#2D5A3D", stroke: "#1F4D30", strokeWidth: 0.5, opacity: 1 },
    tee: { fill: "#3A6B4A", stroke: "#2D5A3D", strokeWidth: 0.5, opacity: 0.9 },
    hole: { fill: "none", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.5 },
  },
  dark: {
    boundary: { fill: "#252540", stroke: "none", strokeWidth: 0, opacity: 1 },
    trees: { fill: "#1E4D2E", stroke: "none", strokeWidth: 0, opacity: 0.5 },
    water: { fill: "#3A6B8C", stroke: "#2D5A7A", strokeWidth: 0.5, opacity: 0.9 },
    fairway: { fill: "#2D6B4A", stroke: "none", strokeWidth: 0, opacity: 0.9 },
    rough: { fill: "#1E4D35", stroke: "none", strokeWidth: 0, opacity: 0.4 },
    bunker: { fill: "#8B7D5E", stroke: "#7A6D4E", strokeWidth: 0.5, opacity: 0.9 },
    green: { fill: "#1F4D35", stroke: "#174028", strokeWidth: 0.5, opacity: 1 },
    tee: { fill: "#256B42", stroke: "#1F5A38", strokeWidth: 0.5, opacity: 0.9 },
    hole: { fill: "none", stroke: "#AAAACC", strokeWidth: 1, opacity: 0.4 },
  },
  vintage: {
    boundary: { fill: "#EAD9BF", stroke: "none", strokeWidth: 0, opacity: 1 },
    trees: { fill: "#6B8E5A", stroke: "none", strokeWidth: 0, opacity: 0.5 },
    water: { fill: "#7BA3B5", stroke: "#6A92A4", strokeWidth: 0.5, opacity: 0.85 },
    fairway: { fill: "#6B8E5A", stroke: "none", strokeWidth: 0, opacity: 0.85 },
    rough: { fill: "#5A7D4A", stroke: "none", strokeWidth: 0, opacity: 0.4 },
    bunker: { fill: "#C4AA6A", stroke: "#B49A5A", strokeWidth: 0.5, opacity: 0.9 },
    green: { fill: "#4A7048", stroke: "#3D6040", strokeWidth: 0.5, opacity: 1 },
    tee: { fill: "#5A8050", stroke: "#4A7048", strokeWidth: 0.5, opacity: 0.9 },
    hole: { fill: "none", stroke: "#4A3728", strokeWidth: 1, opacity: 0.4 },
  },
  blueprint: {
    boundary: { fill: "none", stroke: "#FFFFFF", strokeWidth: 0.5, opacity: 0.3 },
    trees: { fill: "none", stroke: "#FFFFFF", strokeWidth: 0.3, opacity: 0.2 },
    water: { fill: "none", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.6 },
    fairway: { fill: "none", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.7 },
    rough: { fill: "none", stroke: "#FFFFFF", strokeWidth: 0.3, opacity: 0.2 },
    bunker: { fill: "none", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.6 },
    green: { fill: "#FFFFFF", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.15 },
    tee: { fill: "none", stroke: "#FFFFFF", strokeWidth: 1, opacity: 0.6 },
    hole: { fill: "none", stroke: "#FFFFFF", strokeWidth: 0.5, opacity: 0.5 },
  },
  watercolor: {
    boundary: { fill: "#F0F5EC", stroke: "none", strokeWidth: 0, opacity: 1 },
    trees: { fill: "#8FBC8F", stroke: "none", strokeWidth: 0, opacity: 0.4 },
    water: { fill: "#87CEEB", stroke: "none", strokeWidth: 0, opacity: 0.6 },
    fairway: { fill: "#90C67C", stroke: "none", strokeWidth: 0, opacity: 0.7 },
    rough: { fill: "#7BB369", stroke: "none", strokeWidth: 0, opacity: 0.3 },
    bunker: { fill: "#F0DC82", stroke: "none", strokeWidth: 0, opacity: 0.7 },
    green: { fill: "#5A9A5A", stroke: "none", strokeWidth: 0, opacity: 0.8 },
    tee: { fill: "#6BAF6B", stroke: "none", strokeWidth: 0, opacity: 0.7 },
    hole: { fill: "none", stroke: "#3A5A40", strokeWidth: 0.8, opacity: 0.3 },
  },
  minimalist: {
    boundary: { fill: "#F5F5F5", stroke: "none", strokeWidth: 0, opacity: 1 },
    trees: { fill: "#CCCCCC", stroke: "none", strokeWidth: 0, opacity: 0.3 },
    water: { fill: "#666666", stroke: "none", strokeWidth: 0, opacity: 0.6 },
    fairway: { fill: "#333333", stroke: "none", strokeWidth: 0, opacity: 0.7 },
    rough: { fill: "#AAAAAA", stroke: "none", strokeWidth: 0, opacity: 0.3 },
    bunker: { fill: "#999999", stroke: "none", strokeWidth: 0, opacity: 0.6 },
    green: { fill: "#1A1A1A", stroke: "none", strokeWidth: 0, opacity: 0.85 },
    tee: { fill: "#444444", stroke: "none", strokeWidth: 0, opacity: 0.7 },
    hole: { fill: "none", stroke: "#AAAAAA", strokeWidth: 0.8, opacity: 0.4 },
  },
};

export const THEME_TEXT: Record<string, string> = {
  classic: "#2C2C2C",
  dark: "#E0E0E0",
  vintage: "#4A3728",
  blueprint: "#FFFFFF",
  watercolor: "#3A5A40",
  minimalist: "#1A1A1A",
};

export const THEME_BG: Record<string, string> = {
  classic: "#FAFAF5",
  dark: "#1A1A2E",
  vintage: "#F5E6D0",
  blueprint: "#1B3A5C",
  watercolor: "#FFFFFF",
  minimalist: "#FFFFFF",
};

export const THEME_FONT: Record<string, string> = {
  classic: "'Georgia', serif",
  dark: "'Helvetica Neue', sans-serif",
  vintage: "'Palatino Linotype', 'Book Antiqua', serif",
  blueprint: "'Courier New', monospace",
  watercolor: "'Georgia', serif",
  minimalist: "'Helvetica Neue', 'Arial', sans-serif",
};
