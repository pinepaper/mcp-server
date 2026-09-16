/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/pop-art-generator.ts
 * sha256:    863cc3630423f7d18fc3a6a74823180a5042e6415928a1c95d8ff163438147e3
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface PopArtElement {
  id: string;
  type: "text" | "shape" | "speech_bubble" | "starburst" | "benday_overlay";
  shapeType?: "speech_bubble" | "starburst" | "benday_dots" | "rectangle";
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
  rotationDegrees?: number;
  textAlign?: "left" | "center" | "right";
}

export interface PopArtPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  cyanVariant?: boolean;
}

export interface PopArtDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: PopArtElement[];
  metadata: {
    title: string;
    createdAt: string;
    compositionType: "pop_art_lichtenstein_comic";
    palette: string[];
  };
}

export const POP_ART_PALETTE = {
  yellowCanary: "#ffee00",
  cyanBlue: "#00b4d8",
  magentaElectric: "#ff007f",
  white: "#ffffff",
  blackInk: "#000000",
};

/**
 * Procedurally generates a Pop Art comic expression poster layout with Ben-Day dots, speech bubbles, and starburst badges.
 */
export function generatePopArtPoster(options: PopArtPosterOptions): PopArtDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = options.cyanVariant ? POP_ART_PALETTE.cyanBlue : POP_ART_PALETTE.yellowCanary;

  const elements: PopArtElement[] = [];

  // 1. Ben-Day Dot Pattern Overlay
  elements.push({
    id: "pop-art-benday-dots",
    type: "benday_overlay",
    shapeType: "benday_dots",
    fillHex: POP_ART_PALETTE.magentaElectric,
    x: 0,
    y: 0,
    width,
    height,
  });

  // 2. Comic Speech Bubble Container for Main Title
  elements.push({
    id: "pop-art-speech-bubble",
    type: "speech_bubble",
    shapeType: "speech_bubble",
    fillHex: POP_ART_PALETTE.white,
    strokeHex: POP_ART_PALETTE.blackInk,
    strokeWidthPx: 5,
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.1),
    width: Math.round(width * 0.84),
    height: 180,
    rotationDegrees: -3,
  });

  // 3. Bold Comic Headline Typography
  elements.push({
    id: "pop-art-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 58,
    fontWeight: "900",
    fontFamily: "Bangers, Impact, 'Comic Neue', sans-serif",
    fillHex: POP_ART_PALETTE.blackInk,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.13),
    width: Math.round(width * 0.8),
    height: 110,
    textAlign: "center",
  });

  // 4. Halftone Starburst Badge Accent
  elements.push({
    id: "pop-art-starburst-badge",
    type: "starburst",
    shapeType: "starburst",
    fillHex: options.cyanVariant ? POP_ART_PALETTE.yellowCanary : POP_ART_PALETTE.cyanBlue,
    strokeHex: POP_ART_PALETTE.blackInk,
    strokeWidthPx: 4,
    x: Math.round(width * 0.65),
    y: Math.round(height * 0.38),
    width: 260,
    height: 260,
    rotationDegrees: 12,
  });

  // 5. Text Inside Starburst Badge
  elements.push({
    id: "pop-art-badge-text",
    type: "text",
    content: "BOOM!",
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "Bangers, sans-serif",
    fillHex: POP_ART_PALETTE.magentaElectric,
    strokeHex: POP_ART_PALETTE.blackInk,
    strokeWidthPx: 2,
    x: Math.round(width * 0.67),
    y: Math.round(height * 0.46),
    width: 220,
    height: 60,
    textAlign: "center",
  });

  // 6. Subtitle Card Container
  elements.push({
    id: "pop-art-subtitle-card",
    type: "shape",
    shapeType: "rectangle",
    fillHex: POP_ART_PALETTE.magentaElectric,
    strokeHex: POP_ART_PALETTE.blackInk,
    strokeWidthPx: 4,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.45),
    width: Math.round(width * 0.5),
    height: 90,
  });

  elements.push({
    id: "pop-art-subtitle-text",
    type: "text",
    content: options.subtitle.toUpperCase(),
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Bangers, sans-serif",
    fillHex: POP_ART_PALETTE.white,
    x: Math.round(width * 0.12),
    y: Math.round(height * 0.475),
    width: Math.round(width * 0.46),
    height: 50,
    textAlign: "center",
  });

  // 7. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "pop-art-body-card",
      type: "shape",
      shapeType: "rectangle",
      fillHex: POP_ART_PALETTE.white,
      strokeHex: POP_ART_PALETTE.blackInk,
      strokeWidthPx: 4,
      x: Math.round(width * 0.1),
      y: Math.round(height * 0.68),
      width: Math.round(width * 0.8),
      height: 180,
    });

    elements.push({
      id: "pop-art-body-text",
      type: "text",
      content: options.body,
      fontSize: 18,
      fontWeight: "700",
      fontFamily: "'Comic Neue', sans-serif",
      fillHex: POP_ART_PALETTE.blackInk,
      x: Math.round(width * 0.12),
      y: Math.round(height * 0.705),
      width: Math.round(width * 0.76),
      height: 140,
      textAlign: "left",
    });
  }

  return {
    id: `pop-art-poster-${Date.now()}`,
    style: "pop_art_expression",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      compositionType: "pop_art_lichtenstein_comic",
      palette: [
        POP_ART_PALETTE.yellowCanary,
        POP_ART_PALETTE.cyanBlue,
        POP_ART_PALETTE.magentaElectric,
        POP_ART_PALETTE.white,
        POP_ART_PALETTE.blackInk,
      ],
    },
  };
}
