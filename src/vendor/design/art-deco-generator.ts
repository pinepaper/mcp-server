/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/art-deco-generator.ts
 * sha256:    da26fb5c028928c9087b1abd69ff85ba71e66bb62f3f25a514ab51cfef647e08
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface ArtDecoElement {
  id: string;
  type: "text" | "shape" | "frame" | "fan_motif";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  strokeHex?: string;
  strokeWidthPx?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign?: "left" | "center" | "right";
  isSymmetricalFrame?: boolean;
}

export interface ArtDecoPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  emeraldVariant?: boolean;
}

export interface ArtDecoDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: ArtDecoElement[];
  metadata: {
    title: string;
    createdAt: string;
    symmetryType: "bilateral_art_deco";
    palette: string[];
  };
}

export const ART_DECO_PALETTE = {
  darkNavy: "#0b0d17",
  emerald: "#0f382c",
  goldPrimary: "#d4af37",
  goldLight: "#f3e5ab",
  pearlWhite: "#f8f9fa",
};

/**
 * Procedurally generates a symmetrical Art Deco geometric poster layout with gold metallic border framing and fan motifs.
 */
export function generateArtDecoPoster(options: ArtDecoPosterOptions): ArtDecoDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = options.emeraldVariant ? ART_DECO_PALETTE.emerald : ART_DECO_PALETTE.darkNavy;

  const elements: ArtDecoElement[] = [];

  // 1. Outer Symmetrical Double Gold Frame
  elements.push({
    id: "art-deco-outer-frame",
    type: "frame",
    fillHex: "transparent",
    strokeHex: ART_DECO_PALETTE.goldPrimary,
    strokeWidthPx: 4,
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    isSymmetricalFrame: true,
  });

  // 2. Inner Inset Stepped Chevron Frame
  elements.push({
    id: "art-deco-inner-frame",
    type: "frame",
    fillHex: "transparent",
    strokeHex: ART_DECO_PALETTE.goldLight,
    strokeWidthPx: 2,
    x: 56,
    y: 56,
    width: width - 112,
    height: height - 112,
    isSymmetricalFrame: true,
  });

  // 3. Top Symmetrical Fan Motif Accent Arc
  elements.push({
    id: "art-deco-top-fan",
    type: "fan_motif",
    fillHex: ART_DECO_PALETTE.goldPrimary,
    strokeHex: ART_DECO_PALETTE.goldLight,
    strokeWidthPx: 2,
    x: Math.round(width / 2 - 120),
    y: 72,
    width: 240,
    height: 80,
    isSymmetricalFrame: true,
  });

  // 4. Opulent High-Contrast Centered Headline Typography
  elements.push({
    id: "art-deco-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 64,
    fontWeight: "800",
    fontFamily: "Metropolis, 'Bifur', 'Peignot', serif",
    fillHex: ART_DECO_PALETTE.pearlWhite,
    strokeHex: ART_DECO_PALETTE.goldPrimary,
    x: 80,
    y: Math.round(height * 0.25),
    width: width - 160,
    height: 100,
    textAlign: "center",
  });

  // 5. Golden Horizontal Line Divider
  elements.push({
    id: "art-deco-gold-divider-top",
    type: "shape",
    fillHex: ART_DECO_PALETTE.goldPrimary,
    x: Math.round(width / 2 - 150),
    y: Math.round(height * 0.38),
    width: 300,
    height: 3,
  });

  // 6. Subtitle Block
  elements.push({
    id: "art-deco-subtitle-text",
    type: "text",
    content: options.subtitle.toUpperCase(),
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Metropolis, sans-serif",
    fillHex: ART_DECO_PALETTE.goldLight,
    x: 100,
    y: Math.round(height * 0.43),
    width: width - 200,
    height: 60,
    textAlign: "center",
  });

  // 7. Golden Horizontal Line Divider Bottom
  elements.push({
    id: "art-deco-gold-divider-bottom",
    type: "shape",
    fillHex: ART_DECO_PALETTE.goldPrimary,
    x: Math.round(width / 2 - 150),
    y: Math.round(height * 0.50),
    width: 300,
    height: 3,
  });

  // 8. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "art-deco-body-text",
      type: "text",
      content: options.body,
      fontSize: 18,
      fontWeight: "400",
      fontFamily: "Metropolis, serif",
      fillHex: ART_DECO_PALETTE.pearlWhite,
      x: 120,
      y: Math.round(height * 0.58),
      width: width - 240,
      height: 160,
      textAlign: "center",
    });
  }

  return {
    id: `art-deco-poster-${Date.now()}`,
    style: "art_deco_geometric",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      symmetryType: "bilateral_art_deco",
      palette: [
        ART_DECO_PALETTE.darkNavy,
        ART_DECO_PALETTE.emerald,
        ART_DECO_PALETTE.goldPrimary,
        ART_DECO_PALETTE.goldLight,
        ART_DECO_PALETTE.pearlWhite,
      ],
    },
  };
}
