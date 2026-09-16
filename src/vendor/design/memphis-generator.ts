/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/memphis-generator.ts
 * sha256:    2896f24ec57c20285a96eb83f43a7012467a1f35a01fbd9ee6e4b209d1c0a494
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface MemphisElement {
  id: string;
  type: "text" | "shape" | "squiggle" | "zigzag" | "terrazzo";
  shapeType?: "circle" | "pill" | "triangle" | "squiggle" | "zigzag";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  strokeHex?: string;
  strokeWidthPx?: number;
  offsetShadowPx?: number;
  shadowHex?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees?: number;
  textAlign?: "left" | "center" | "right";
}

export interface MemphisPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  mintVariant?: boolean;
}

export interface MemphisDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: MemphisElement[];
  metadata: {
    title: string;
    createdAt: string;
    compositionType: "memphis_asymmetric_postmodern";
    palette: string[];
  };
}

export const MEMPHIS_PALETTE = {
  pinkPastel: "#ffe4e6",
  mintPastel: "#ccfbf1",
  magentaElectric: "#ff007f",
  cyanBright: "#00f0ff",
  yellowCanary: "#ffee00",
  blackSolid: "#000000",
};

/**
 * Procedurally generates a Memphis Group postmodern poster layout with floating shapes, squiggles, and 2D offset black shadows.
 */
export function generateMemphisPoster(options: MemphisPosterOptions): MemphisDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = options.mintVariant ? MEMPHIS_PALETTE.mintPastel : MEMPHIS_PALETTE.pinkPastel;

  const elements: MemphisElement[] = [];

  // 1. Yellow Floating Pill Container with Offset 2D Black Shadow
  elements.push({
    id: "memphis-pill-container",
    type: "shape",
    shapeType: "pill",
    fillHex: MEMPHIS_PALETTE.yellowCanary,
    strokeHex: MEMPHIS_PALETTE.blackSolid,
    strokeWidthPx: 4,
    offsetShadowPx: 10,
    shadowHex: MEMPHIS_PALETTE.blackSolid,
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.12),
    width: Math.round(width * 0.84),
    height: 160,
    rotationDegrees: -2,
  });

  // 2. Playful Headline Typography inside Yellow Pill
  elements.push({
    id: "memphis-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 56,
    fontWeight: "900",
    fontFamily: "'Space Grotesk', 'Comic Neue', sans-serif",
    fillHex: MEMPHIS_PALETTE.blackSolid,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.15),
    width: Math.round(width * 0.8),
    height: 90,
    textAlign: "center",
  });

  // 3. Electric Magenta Bacterioid Squiggle
  elements.push({
    id: "memphis-magenta-squiggle",
    type: "squiggle",
    shapeType: "squiggle",
    fillHex: "transparent",
    strokeHex: MEMPHIS_PALETTE.magentaElectric,
    strokeWidthPx: 8,
    x: Math.round(width * 0.7),
    y: Math.round(height * 0.35),
    width: 200,
    height: 120,
    rotationDegrees: 15,
  });

  // 4. Bright Cyan Floating Circle Shape
  elements.push({
    id: "memphis-cyan-circle",
    type: "shape",
    shapeType: "circle",
    fillHex: MEMPHIS_PALETTE.cyanBright,
    strokeHex: MEMPHIS_PALETTE.blackSolid,
    strokeWidthPx: 4,
    offsetShadowPx: 8,
    shadowHex: MEMPHIS_PALETTE.blackSolid,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.42),
    width: 140,
    height: 140,
  });

  // 5. Zigzag Black Accent Line
  elements.push({
    id: "memphis-black-zigzag",
    type: "zigzag",
    shapeType: "zigzag",
    fillHex: "transparent",
    strokeHex: MEMPHIS_PALETTE.blackSolid,
    strokeWidthPx: 6,
    x: Math.round(width * 0.3),
    y: Math.round(height * 0.38),
    width: 280,
    height: 40,
  });

  // 6. Subtitle Card Block with Offset Shadow
  elements.push({
    id: "memphis-subtitle-card",
    type: "shape",
    shapeType: "pill",
    fillHex: MEMPHIS_PALETTE.cyanBright,
    strokeHex: MEMPHIS_PALETTE.blackSolid,
    strokeWidthPx: 3,
    offsetShadowPx: 6,
    shadowHex: MEMPHIS_PALETTE.blackSolid,
    x: Math.round(width * 0.25),
    y: Math.round(height * 0.52),
    width: Math.round(width * 0.65),
    height: 70,
  });

  elements.push({
    id: "memphis-subtitle-text",
    type: "text",
    content: options.subtitle,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "'Space Grotesk', sans-serif",
    fillHex: MEMPHIS_PALETTE.blackSolid,
    x: Math.round(width * 0.27),
    y: Math.round(height * 0.535),
    width: Math.round(width * 0.6),
    height: 45,
    textAlign: "center",
  });

  // 7. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "memphis-body-text",
      type: "text",
      content: options.body,
      fontSize: 18,
      fontWeight: "600",
      fontFamily: "'Space Grotesk', sans-serif",
      fillHex: MEMPHIS_PALETTE.blackSolid,
      x: Math.round(width * 0.12),
      y: Math.round(height * 0.68),
      width: Math.round(width * 0.76),
      height: 140,
      textAlign: "left",
    });
  }

  return {
    id: `memphis-poster-${Date.now()}`,
    style: "memphis_group",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      compositionType: "memphis_asymmetric_postmodern",
      palette: [
        MEMPHIS_PALETTE.pinkPastel,
        MEMPHIS_PALETTE.mintPastel,
        MEMPHIS_PALETTE.magentaElectric,
        MEMPHIS_PALETTE.cyanBright,
        MEMPHIS_PALETTE.yellowCanary,
        MEMPHIS_PALETTE.blackSolid,
      ],
    },
  };
}
