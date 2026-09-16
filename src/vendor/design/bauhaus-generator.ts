/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/bauhaus-generator.ts
 * sha256:    48e58cdcfd6b797a9b94da280d414f4d66ac01faa9f3d873ea3af074c46ec0c8
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface BauhausElement {
  id: string;
  type: "text" | "shape";
  shapeType?: "circle" | "square" | "triangle" | "line";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees?: number;
  textAlign?: "left" | "center" | "right";
  hasDropShadow?: boolean;
  hasBlur?: boolean;
}

export interface BauhausPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  darkVariant?: boolean;
}

export interface BauhausDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: BauhausElement[];
  metadata: {
    title: string;
    createdAt: string;
    gridSystem: "bauhaus_asymmetric_3col";
    palette: string[];
  };
}

export const BAUHAUS_PALETTE = {
  cream: "#f4f1de",
  red: "#d62828",
  blue: "#003049",
  yellow: "#fdf0d5",
  dark: "#111111",
};

/**
 * Procedurally generates an asymmetric Bauhaus Modernist geometric slide/poster layout.
 */
export function generateBauhausPoster(options: BauhausPosterOptions): BauhausDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const isDark = options.darkVariant ?? false;
  const backgroundHex = isDark ? BAUHAUS_PALETTE.dark : BAUHAUS_PALETTE.cream;
  const primaryTextColor = isDark ? BAUHAUS_PALETTE.cream : BAUHAUS_PALETTE.dark;

  const elements: BauhausElement[] = [];

  // 1. Primary Red Circle (large architectural structural shape)
  const circleSize = Math.round(width * 0.45);
  elements.push({
    id: "bauhaus-red-circle",
    type: "shape",
    shapeType: "circle",
    fillHex: BAUHAUS_PALETTE.red,
    x: Math.round(width * 0.42),
    y: Math.round(height * 0.18),
    width: circleSize,
    height: circleSize,
    hasDropShadow: false,
    hasBlur: false,
  });

  // 2. Deep Blue Rectangle
  elements.push({
    id: "bauhaus-blue-square",
    type: "shape",
    shapeType: "square",
    fillHex: BAUHAUS_PALETTE.blue,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.35),
    width: Math.round(width * 0.28),
    height: Math.round(height * 0.42),
    hasDropShadow: false,
    hasBlur: false,
  });

  // 3. Black Structural Line Divider
  elements.push({
    id: "bauhaus-black-line",
    type: "shape",
    shapeType: "line",
    fillHex: isDark ? BAUHAUS_PALETTE.yellow : BAUHAUS_PALETTE.dark,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.15),
    width: Math.round(width * 0.8),
    height: 6,
    hasDropShadow: false,
    hasBlur: false,
  });

  // 4. Asymmetric Heavy Headline Typography
  elements.push({
    id: "bauhaus-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 72,
    fontWeight: "900",
    fontFamily: "Futura, 'Bayer Universal', sans-serif",
    fillHex: primaryTextColor,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.06),
    width: Math.round(width * 0.8),
    height: 90,
    textAlign: "left",
  });

  // 5. Subtitle Text Block
  elements.push({
    id: "bauhaus-subtitle-text",
    type: "text",
    content: options.subtitle,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura, sans-serif",
    fillHex: isDark ? BAUHAUS_PALETTE.cream : BAUHAUS_PALETTE.blue,
    x: Math.round(width * 0.42),
    y: Math.round(height * 0.68),
    width: Math.round(width * 0.5),
    height: 60,
    textAlign: "left",
  });

  // 6. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "bauhaus-body-text",
      type: "text",
      content: options.body,
      fontSize: 16,
      fontWeight: "400",
      fontFamily: "Futura, sans-serif",
      fillHex: primaryTextColor,
      x: Math.round(width * 0.42),
      y: Math.round(height * 0.76),
      width: Math.round(width * 0.5),
      height: 120,
      textAlign: "left",
    });
  }

  return {
    id: `bauhaus-poster-${Date.now()}`,
    style: "bauhaus_geometric",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      gridSystem: "bauhaus_asymmetric_3col",
      palette: [
        BAUHAUS_PALETTE.cream,
        BAUHAUS_PALETTE.red,
        BAUHAUS_PALETTE.blue,
        BAUHAUS_PALETTE.yellow,
        BAUHAUS_PALETTE.dark,
      ],
    },
  };
}
