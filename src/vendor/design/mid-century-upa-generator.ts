/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/mid-century-upa-generator.ts
 * sha256:    28a3acaa23a31bc4fdab5857241b27ad20a74a136328cc613f772668c97b8fd2
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * MID-CENTURY UPA / 1950s ANIMATION STYLE PROCEDURAL GENERATOR
 *
 * Implements 1950s United Productions of America (UPA) graphic animation style:
 * - Asymmetrical angular silhouettes & stylized geometric abstraction.
 * - Flat earthy palette (burnt orange #cc5500, mustard yellow #e1ad01, olive #556b2f, charcoal #2b2b2b).
 * - Offset ink line work & floating geometric backdrop panels.
 * - Quirky mid-century typography (Futura Bold, Century Gothic).
 */

export interface MidCenturyUpaInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface MidCenturyUpaItem {
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
  rotation?: number;
  zIndex: number;
}

export interface MidCenturyUpaResult {
  style: "mid_century_upa";
  canvas: { width: number; height: number };
  items: MidCenturyUpaItem[];
  palette: string[];
}

export function generateMidCenturyUpaPoster(input: MidCenturyUpaInput): MidCenturyUpaResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgCream = "#f5f0e6";
  const orangeHex = "#cc5500";
  const mustardHex = "#e1ad01";
  const oliveHex = "#556b2f";
  const tealHex = "#2a7b88";
  const darkCharcoal = "#2b2b2b";

  const items: MidCenturyUpaItem[] = [];

  // Cream paper background
  items.push({
    id: "upa_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Futura, Century Gothic, sans-serif",
    textAlign: "left",
    fill: bgCream,
    zIndex: 0,
  });

  // Floating tilted geometric backdrops
  items.push({
    id: "upa_panel_1",
    type: "rect",
    x: width * 0.15,
    y: height * 0.15,
    width: 320,
    height: 480,
    fontFamily: "Futura, sans-serif",
    textAlign: "left",
    fill: mustardHex,
    rotation: -6,
    zIndex: 1,
  });

  items.push({
    id: "upa_panel_2",
    type: "rect",
    x: width * 0.45,
    y: height * 0.22,
    width: 400,
    height: 380,
    fontFamily: "Futura, sans-serif",
    textAlign: "left",
    fill: orangeHex,
    rotation: 8,
    zIndex: 2,
  });

  // Stylized UPA geometric character silhouette (boomerang / kidney bean oval)
  items.push({
    id: "upa_abstract_shape",
    type: "circle",
    x: width * 0.42,
    y: height * 0.42,
    radius: 130,
    fontFamily: "Futura, sans-serif",
    textAlign: "center",
    fill: oliveHex,
    stroke: darkCharcoal,
    strokeWidth: 4,
    zIndex: 3,
  });

  // Title
  items.push({
    id: "upa_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 56,
    fontFamily: "Futura, Century Gothic, sans-serif",
    fontWeight: 800,
    textAlign: "left",
    fill: darkCharcoal,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "upa_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 28,
      fontFamily: "Futura, sans-serif",
      fontWeight: 700,
      textAlign: "left",
      fill: orangeHex,
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "upa_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Century Gothic, sans-serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#4a4a4a",
      zIndex: 5,
    });
  }

  return {
    style: "mid_century_upa",
    canvas: { width, height },
    items,
    palette: [bgCream, orangeHex, mustardHex, oliveHex, tealHex, darkCharcoal],
  };
}
