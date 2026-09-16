/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/claymorphism-generator.ts
 * sha256:    de327289edc5282eb1fea34b6a45efe7d5233c19aa835c4b41572b2b43ae7ed4
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * CLAYMORPHISM SOFT 3D PROCEDURAL GENERATOR
 *
 * Implements inflated tactile claymorphism 3D UI aesthetics:
 * - Inflated rounded pill forms with inner lighting and soft drop shadows.
 * - Soft pastel color palette (clay white #f1f5f9, soft mint #a7f3d0, bubblegum #fbcfe8, peach #fed7aa).
 * - Tactile rounded corner radiuses (32px+).
 * - Friendly rounded display typography (Fredoka, Nunito).
 */

export interface ClaymorphismInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface ClaymorphismItem {
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
  boxShadow?: string;
  zIndex: number;
}

export interface ClaymorphismResult {
  style: "claymorphism";
  canvas: { width: number; height: number };
  items: ClaymorphismItem[];
  palette: string[];
}

export function generateClaymorphismPoster(input: ClaymorphismInput): ClaymorphismResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgClay = "#e2e8f0";
  const mintHex = "#a7f3d0";
  const bubblegumHex = "#fbcfe8";
  const peachHex = "#fed7aa";
  const darkClay = "#334155";

  const items: ClaymorphismItem[] = [];

  // Clay background
  items.push({
    id: "clay_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Fredoka, Nunito, sans-serif",
    textAlign: "left",
    fill: bgClay,
    zIndex: 0,
  });

  // Inflated Clay Pill card (outer shadow + inner highlight)
  items.push({
    id: "clay_card_base",
    type: "rect",
    x: width * 0.1,
    y: height * 0.15,
    width: width * 0.8,
    height: height * 0.48,
    fontFamily: "Fredoka, sans-serif",
    textAlign: "left",
    fill: "#ffffff",
    boxShadow: "inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.9), 16px 16px 32px rgba(0,0,0,0.08)",
    zIndex: 1,
  });

  // Clay sphere accent 1
  items.push({
    id: "clay_sphere_1",
    type: "circle",
    x: width * 0.35,
    y: height * 0.38,
    radius: 90,
    fontFamily: "Fredoka, sans-serif",
    textAlign: "center",
    fill: bubblegumHex,
    boxShadow: "inset -6px -6px 12px rgba(0,0,0,0.12), inset 6px 6px 12px rgba(255,255,255,0.8)",
    zIndex: 2,
  });

  // Clay sphere accent 2
  items.push({
    id: "clay_sphere_2",
    type: "circle",
    x: width * 0.65,
    y: height * 0.32,
    radius: 110,
    fontFamily: "Fredoka, sans-serif",
    textAlign: "center",
    fill: mintHex,
    boxShadow: "inset -6px -6px 12px rgba(0,0,0,0.12), inset 6px 6px 12px rgba(255,255,255,0.8)",
    zIndex: 3,
  });

  // Title
  items.push({
    id: "clay_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 54,
    fontFamily: "Fredoka, Nunito, sans-serif",
    fontWeight: 700,
    textAlign: "left",
    fill: darkClay,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "clay_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 28,
      fontFamily: "Fredoka, sans-serif",
      fontWeight: 600,
      textAlign: "left",
      fill: "#0284c7",
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "clay_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Nunito, sans-serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#64748b",
      zIndex: 5,
    });
  }

  return {
    style: "claymorphism",
    canvas: { width, height },
    items,
    palette: [bgClay, mintHex, bubblegumHex, peachHex, darkClay],
  };
}
