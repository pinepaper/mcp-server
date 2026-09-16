/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/frutiger-aero-generator.ts
 * sha256:    7c72c95ae7acd8a284845dea7a4b5d37278f2e62dac1ffb99bd1cbb13daf6eef
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * Y2K FRUTIGER AERO STYLE PROCEDURAL GENERATOR
 *
 * Implements mid-2000s glossy skeuomorphic Aero visual aesthetics:
 * - Glossy glass spheres, lens flares & skeuomorphic reflections.
 * - Sky blue (#00a8ff), aqua (#00d2d3), and vibrant lawn green (#4cd137) palette.
 * - Translucent aurora wisps & water droplet caustics.
 * - Clean futuristic typography (Segoe UI / Tahoma).
 */

export interface FrutigerAeroInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface FrutigerAeroItem {
  id: string;
  type: "text" | "rect" | "circle";
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  textAlign: "left" | "center";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  zIndex: number;
}

export interface FrutigerAeroResult {
  style: "y2k_frutiger_aero";
  canvas: { width: number; height: number };
  items: FrutigerAeroItem[];
  palette: string[];
}

export function generateFrutigerAeroPoster(input: FrutigerAeroInput): FrutigerAeroResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgSky = "#00a8ff";
  const aquaHex = "#00d2d3";
  const greenHex = "#4cd137";
  const whiteHex = "#ffffff";
  const glassBlue = "#e0f7fa";

  const items: FrutigerAeroItem[] = [];

  // Sky background
  items.push({
    id: "fa_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Segoe UI, Tahoma, sans-serif",
    textAlign: "left",
    fill: bgSky,
    zIndex: 0,
  });

  // Grass hill lower arc
  items.push({
    id: "fa_hill",
    type: "circle",
    x: width * 0.5,
    y: height * 1.3,
    radius: width * 0.8,
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
    fill: greenHex,
    zIndex: 1,
  });

  // Glossy glass sphere
  items.push({
    id: "fa_orb_base",
    type: "circle",
    x: width * 0.5,
    y: height * 0.4,
    radius: 180,
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
    fill: aquaHex,
    opacity: 0.85,
    zIndex: 2,
  });

  // Glossy highlight reflection
  items.push({
    id: "fa_orb_highlight",
    type: "circle",
    x: width * 0.46,
    y: height * 0.35,
    radius: 70,
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
    fill: whiteHex,
    opacity: 0.6,
    zIndex: 3,
  });

  // Title
  items.push({
    id: "fa_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 54,
    fontFamily: "Segoe UI, Frutiger, sans-serif",
    fontWeight: 700,
    textAlign: "left",
    fill: whiteHex,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "fa_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 26,
      fontFamily: "Segoe UI, sans-serif",
      fontWeight: 600,
      textAlign: "left",
      fill: glassBlue,
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "fa_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Segoe UI, sans-serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#e0f2fe",
      zIndex: 5,
    });
  }

  return {
    style: "y2k_frutiger_aero",
    canvas: { width, height },
    items,
    palette: [bgSky, aquaHex, greenHex, whiteHex, glassBlue],
  };
}
