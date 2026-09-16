/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/vaporwave-generator.ts
 * sha256:    9e08595891e88589d5ba41c7a4994e4b7862c3f0ab3d9b49e384ff209103beab
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface VaporwaveElement {
  id: string;
  type: "text" | "shape" | "sun_disk" | "wireframe_grid" | "kanji_subtitle";
  shapeType?: "sun_disk" | "perspective_grid" | "chrome_bar" | "rectangle";
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
}

export interface VaporwavePosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
}

export interface VaporwaveDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: VaporwaveElement[];
  metadata: {
    title: string;
    createdAt: string;
    compositionType: "vaporwave_synthwave_retro";
    palette: string[];
  };
}

export const VAPORWAVE_PALETTE = {
  deepPurpleVoid: "#1a0b2e",
  neonPink: "#ff007f",
  cyanGlow: "#00f0ff",
  sunsetMagenta: "#ff5599",
  yellowCanary: "#ffe600",
};

/**
 * Procedurally generates a Vaporwave & Synthwave retro poster layout with a digital sunset disk and 3D wireframe grid.
 */
export function generateVaporwavePoster(options: VaporwavePosterOptions): VaporwaveDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = VAPORWAVE_PALETTE.deepPurpleVoid;

  const elements: VaporwaveElement[] = [];

  // 1. Digital Sunset Sun Disk
  const sunSize = Math.round(width * 0.45);
  elements.push({
    id: "vaporwave-sun-disk",
    type: "sun_disk",
    shapeType: "sun_disk",
    fillHex: VAPORWAVE_PALETTE.sunsetMagenta,
    strokeHex: VAPORWAVE_PALETTE.yellowCanary,
    strokeWidthPx: 3,
    x: Math.round(width / 2 - sunSize / 2),
    y: Math.round(height * 0.22),
    width: sunSize,
    height: sunSize,
  });

  // 2. 3D Perspective Ground Wireframe Grid
  elements.push({
    id: "vaporwave-perspective-grid",
    type: "wireframe_grid",
    shapeType: "perspective_grid",
    fillHex: "transparent",
    strokeHex: VAPORWAVE_PALETTE.cyanGlow,
    strokeWidthPx: 2,
    x: 0,
    y: Math.round(height * 0.55),
    width,
    height: Math.round(height * 0.45),
  });

  // 3. Neon Chrome Headline Typography
  elements.push({
    id: "vaporwave-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 64,
    fontWeight: "900",
    fontFamily: "'Orbitron', 'VT323', sans-serif",
    fillHex: VAPORWAVE_PALETTE.neonPink,
    strokeHex: VAPORWAVE_PALETTE.cyanGlow,
    strokeWidthPx: 2,
    x: 60,
    y: Math.round(height * 0.12),
    width: width - 120,
    height: 110,
    textAlign: "center",
  });

  // 4. Japanese Kanji Subtitle Overlay
  elements.push({
    id: "vaporwave-kanji-text",
    type: "kanji_subtitle",
    content: "ヴェイパーウェーブ // SYNTHWAVE",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "'Orbitron', sans-serif",
    fillHex: VAPORWAVE_PALETTE.cyanGlow,
    x: 80,
    y: Math.round(height * 0.48),
    width: width - 160,
    height: 60,
    textAlign: "center",
  });

  // 5. Horizontal Chrome Bar Accent
  elements.push({
    id: "vaporwave-chrome-bar",
    type: "shape",
    shapeType: "chrome_bar",
    fillHex: VAPORWAVE_PALETTE.yellowCanary,
    x: Math.round(width / 2 - 180),
    y: Math.round(height * 0.54),
    width: 360,
    height: 6,
  });

  // 6. Subtitle Card Block
  elements.push({
    id: "vaporwave-subtitle-text",
    type: "text",
    content: options.subtitle.toUpperCase(),
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "'Orbitron', sans-serif",
    fillHex: VAPORWAVE_PALETTE.yellowCanary,
    x: 100,
    y: Math.round(height * 0.58),
    width: width - 200,
    height: 60,
    textAlign: "center",
  });

  // 7. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "vaporwave-body-text",
      type: "text",
      content: options.body,
      fontSize: 16,
      fontWeight: "400",
      fontFamily: "sans-serif",
      fillHex: "#e2e8f0",
      x: 120,
      y: Math.round(height * 0.68),
      width: width - 240,
      height: 140,
      textAlign: "center",
    });
  }

  return {
    id: `vaporwave-poster-${Date.now()}`,
    style: "vaporwave_retro",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      compositionType: "vaporwave_synthwave_retro",
      palette: [
        VAPORWAVE_PALETTE.deepPurpleVoid,
        VAPORWAVE_PALETTE.neonPink,
        VAPORWAVE_PALETTE.cyanGlow,
        VAPORWAVE_PALETTE.sunsetMagenta,
        VAPORWAVE_PALETTE.yellowCanary,
      ],
    },
  };
}
