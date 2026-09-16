/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/op-art-generator.ts
 * sha256:    762fdfab688d977ed8289ef4c99a532bee5fe1a3ffc3f858f241e3c2ab542ee6
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * OP ART / PSYCHEDELIC OPTICAL ILLUSION PROCEDURAL GENERATOR
 *
 * Implements Victor Vasarely / Bridget Riley Op Art aesthetics:
 * - High-contrast concentric geometric moiré patterns & optical illusion warping.
 * - Monochrome (#000000, #ffffff) or high-contrast psychedelic neon (#ff0055, #00f0ff, #7000ff).
 * - Kinetic visual depth & pulsating focal points.
 * - Bold geometric display typography (Syne, Archivo Black).
 */

export interface OpArtInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface OpArtItem {
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
  zIndex: number;
}

export interface OpArtResult {
  style: "op_art_psychedelic";
  canvas: { width: number; height: number };
  items: OpArtItem[];
  palette: string[];
}

export function generateOpArtPoster(input: OpArtInput): OpArtResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgBlack = "#050508";
  const whiteHex = "#ffffff";
  const neonPink = "#ff0055";
  const neonCyan = "#00f0ff";
  const purpleHex = "#7000ff";

  const items: OpArtItem[] = [];

  // Black background
  items.push({
    id: "op_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Syne, Archivo Black, sans-serif",
    textAlign: "left",
    fill: bgBlack,
    zIndex: 0,
  });

  // Concentric Op Art Optical Illusion Rings
  const ringCenterX = width / 2;
  const ringCenterY = height * 0.4;
  const ringCount = 7;

  for (let i = ringCount; i >= 1; i--) {
    const r = i * 36;
    const isEven = i % 2 === 0;
    items.push({
      id: `op_ring_${i}`,
      type: "circle",
      x: ringCenterX,
      y: ringCenterY,
      radius: r,
      fontFamily: "Syne, sans-serif",
      textAlign: "center",
      fill: isEven ? whiteHex : bgBlack,
      stroke: isEven ? neonPink : neonCyan,
      strokeWidth: 4,
      zIndex: ringCount - i + 1,
    });
  }

  // Title
  items.push({
    id: "op_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 56,
    fontFamily: "Syne, Archivo Black, sans-serif",
    fontWeight: 800,
    textAlign: "left",
    fill: whiteHex,
    zIndex: 10,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "op_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 28,
      fontFamily: "Syne, sans-serif",
      fontWeight: 700,
      textAlign: "left",
      fill: neonCyan,
      zIndex: 10,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "op_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Archivo, sans-serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#a1a1aa",
      zIndex: 10,
    });
  }

  return {
    style: "op_art_psychedelic",
    canvas: { width, height },
    items,
    palette: [bgBlack, whiteHex, neonPink, neonCyan, purpleHex],
  };
}
