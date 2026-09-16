/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/risograph-generator.ts
 * sha256:    4a93708b0622d7efa9ef1ab5475359c4c75646306bc1f2005f2339e7adde8028
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * RISOGRAPH & VINTAGE PRINT STYLE LAYOUT GENERATOR
 *
 * Implements procedural generation of misaligned spot-color ink plates,
 * halftone dot matrix overlays, organic ink bleed, and warm textured paper grain.
 */

export interface RisographLayoutInput {
  title: string;
  subtitle?: string;
  body?: string;
  imageUri?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  spotInkColorHex?: string;
}

export interface RisographLayoutItem {
  id: string;
  type: "text" | "rect" | "image" | "ink_plate" | "halftone_overlay";
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  fill: string;
  colorOffsetPx?: number;
  halftonePattern?: boolean;
  paperTexture?: boolean;
  opacity?: number;
  src?: string;
  zIndex: number;
}

export interface RisographLayoutResult {
  style: "risograph_print";
  canvas: { width: number; height: number };
  items: RisographLayoutItem[];
  palette: string[];
}

/**
 * Generate a Risograph & Vintage Print Style layout scene graph.
 */
export function generateRisographLayout(input: RisographLayoutInput): RisographLayoutResult {
  const width = input.canvasWidth || 1280;
  const height = input.canvasHeight || 720;
  const paperCream = "#fefae0";
  const spotPink = input.spotInkColorHex || "#ff007f"; // Fluorescent Pink spot ink
  const spotBlue = "#0077b6"; // Bright Blue spot ink
  const charcoalInk = "#1d3557";

  const items: RisographLayoutItem[] = [];

  // Background Warm Paper Texture
  items.push({
    id: "riso_paper_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Courier Prime, Georgia, serif",
    fill: paperCream,
    paperTexture: true,
    zIndex: 0,
  });

  const marginX = 80;
  const marginY = 64;

  // 1. MISALIGNED SPOT-COLOR BACKGROUND ACCENT PLATE (Pink offset x:+3, y:+2)
  items.push({
    id: "riso_spot_bg_plate",
    type: "ink_plate",
    x: marginX + 3,
    y: marginY + 32 + 2,
    width: Math.round(width * 0.55),
    height: 120,
    fontFamily: "Courier Prime, Georgia, serif",
    fill: spotPink,
    opacity: 0.85,
    colorOffsetPx: 3.5,
    halftonePattern: true,
    zIndex: 1,
  });

  // 2. MAIN CHARCOAL INK TITLE (Overlaying spot plate with slight offset)
  items.push({
    id: "riso_title_plate",
    type: "text",
    text: input.title,
    x: marginX,
    y: marginY + 32,
    width: Math.round(width * 0.6),
    fontSize: 52,
    fontFamily: "Courier Prime, Georgia, serif",
    fontWeight: "bold",
    fill: charcoalInk,
    colorOffsetPx: 2.0,
    zIndex: 2,
  });

  let currentY = marginY + 160;

  // Subtitle in Bright Blue Spot Ink
  if (input.subtitle) {
    // Misaligned shadow layer for subtitle
    items.push({
      id: "riso_subtitle_shadow",
      type: "text",
      text: input.subtitle,
      x: marginX - 3,
      y: currentY - 2,
      width: Math.round(width * 0.5),
      fontSize: 24,
      fontFamily: "Courier Prime, Georgia, serif",
      fontWeight: "bold",
      fill: spotPink,
      opacity: 0.6,
      colorOffsetPx: 3.0,
      zIndex: 2,
    });

    items.push({
      id: "riso_subtitle",
      type: "text",
      text: input.subtitle,
      x: marginX,
      y: currentY,
      width: Math.round(width * 0.5),
      fontSize: 24,
      fontFamily: "Courier Prime, Georgia, serif",
      fontWeight: "bold",
      fill: spotBlue,
      colorOffsetPx: 2.0,
      zIndex: 3,
    });

    currentY += 48;
  }

  // Body Copy in Charcoal Ink
  if (input.body) {
    items.push({
      id: "riso_body",
      type: "text",
      text: input.body,
      x: marginX,
      y: currentY,
      width: Math.round(width * 0.5),
      fontSize: 16,
      fontFamily: "Courier Prime, Georgia, serif",
      fontWeight: "normal",
      fill: charcoalInk,
      zIndex: 3,
    });
  }

  // Optional Image with Halftone Dot Overlay
  if (input.imageUri) {
    const imgX = marginX + Math.round(width * 0.5) + 32;
    items.push({
      id: "riso_image_plate",
      type: "image",
      src: input.imageUri,
      x: imgX,
      y: marginY + 32,
      width: Math.round(width * 0.35),
      height: Math.round(height * 0.65),
      fontFamily: "Courier Prime, Georgia, serif",
      fill: charcoalInk,
      colorOffsetPx: 4.0,
      halftonePattern: true,
      zIndex: 2,
    });
  }

  // Halftone Dot Matrix Texture Overlay
  items.push({
    id: "riso_halftone_overlay",
    type: "halftone_overlay",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Courier Prime, Georgia, serif",
    fill: "rgba(29, 53, 87, 0.12)",
    halftonePattern: true,
    paperTexture: true,
    zIndex: 10,
  });

  return {
    style: "risograph_print",
    canvas: { width, height },
    items,
    palette: [paperCream, spotPink, spotBlue, charcoalInk, "#ffb703"],
  };
}

export function generateRisographArt(options: { title: string; subtitle?: string; body?: string }): RisographLayoutResult {
  return generateRisographLayout({
    title: options.title,
    subtitle: options.subtitle,
    body: options.body,
  });
}

