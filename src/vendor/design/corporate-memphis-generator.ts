/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/corporate-memphis-generator.ts
 * sha256:    3d27e4dc94c426b0a041ec11e63e4bdb97fcce29193884a3bc2959be237a5b57
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * CORPORATE MEMPHIS (ALEGRIA) STYLE PROCEDURAL GENERATOR
 *
 * Implements flat vector character illustration scenes with:
 * - Exaggerated rubber-hose limb proportions & oversized hands/feet.
 * - Flat pastel/primary color blocking (#4a90e2, #ff6b6b, #ffe66d, #4ecdc4).
 * - Soft rounded geometric background shapes (blobs, arches, rounded pills).
 * - Clean sans-serif display typography (Plus Jakarta Sans / Outfit).
 */

export interface CorporateMemphisInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  primaryColor?: string;
}

export interface CorporateMemphisItem {
  id: string;
  type: "text" | "rect" | "circle" | "path";
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
  d?: string;
  zIndex: number;
}

export interface CorporateMemphisResult {
  style: "corporate_memphis";
  canvas: { width: number; height: number };
  items: CorporateMemphisItem[];
  palette: string[];
}

export function generateCorporateMemphisPoster(input: CorporateMemphisInput): CorporateMemphisResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgHex = "#f4f6fb";
  const primaryHex = input.primaryColor || "#3b82f6"; // Memphis Blue
  const coralHex = "#ff6b6b";
  const yellowHex = "#ffd166";
  const tealHex = "#06d6a0";
  const darkHex = "#1e293b";

  const items: CorporateMemphisItem[] = [];

  // Background
  items.push({
    id: "cm_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Outfit, sans-serif",
    textAlign: "left",
    fill: bgHex,
    zIndex: 0,
  });

  // Soft background organic blob / arch
  items.push({
    id: "cm_blob_1",
    type: "circle",
    x: width * 0.75,
    y: height * 0.35,
    radius: 220,
    fontFamily: "Outfit, sans-serif",
    textAlign: "center",
    fill: yellowHex,
    zIndex: 1,
  });

  items.push({
    id: "cm_arch_1",
    type: "rect",
    x: width * 0.1,
    y: height * 0.2,
    width: 240,
    height: 380,
    fontFamily: "Outfit, sans-serif",
    textAlign: "left",
    fill: tealHex,
    zIndex: 1,
  });

  // Exaggerated Memphis figure geometric torso & arm path
  items.push({
    id: "cm_character_head",
    type: "circle",
    x: width * 0.5,
    y: height * 0.38,
    radius: 45,
    fontFamily: "Outfit, sans-serif",
    textAlign: "center",
    fill: coralHex,
    zIndex: 3,
  });

  items.push({
    id: "cm_character_body",
    type: "rect",
    x: width * 0.42,
    y: height * 0.44,
    width: 170,
    height: 220,
    fontFamily: "Outfit, sans-serif",
    textAlign: "left",
    fill: primaryHex,
    zIndex: 2,
  });

  // Title
  items.push({
    id: "cm_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 56,
    fontFamily: "Outfit, Plus Jakarta Sans, sans-serif",
    fontWeight: 800,
    textAlign: "left",
    fill: darkHex,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "cm_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 28,
      fontFamily: "Outfit, sans-serif",
      fontWeight: 600,
      textAlign: "left",
      fill: primaryHex,
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "cm_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#475569",
      zIndex: 5,
    });
  }

  return {
    style: "corporate_memphis",
    canvas: { width, height },
    items,
    palette: [bgHex, primaryHex, coralHex, yellowHex, tealHex, darkHex],
  };
}
