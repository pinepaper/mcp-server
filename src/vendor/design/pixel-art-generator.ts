/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/pixel-art-generator.ts
 * sha256:    47ee971991d886f71eb32ca122a5f1af210b3285075b28d9b37ae4ea6db26b45
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * PIXEL ART 8-BIT RETRO ARCADE STYLE PROCEDURAL GENERATOR
 *
 * Implements 8-bit/16-bit retro video game sprite aesthetic:
 * - Crisp pixel grid alignment & stepped stair-step geometry.
 * - Retro arcade palette (black #000000, cyan #38b6ff, red #ff5757, yellow #ffde59, green #7ed957).
 * - Pixelated bounding box frames & heart/coin HUD icons.
 * - Pixel display typography ("Press Start 2P" / "VT323" / Monospace).
 */

export interface PixelArtInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface PixelArtItem {
  id: string;
  type: "text" | "rect";
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  textAlign: "left" | "center";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  zIndex: number;
}

export interface PixelArtResult {
  style: "pixel_art_8bit";
  canvas: { width: number; height: number };
  pixelSize: number;
  items: PixelArtItem[];
  palette: string[];
}

export function generatePixelArtPoster(input: PixelArtInput): PixelArtResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;
  const pixelSize = 16; // Pixel grid step

  const bgBlack = "#0d0d11";
  const cyanHex = "#38b6ff";
  const redHex = "#ff5757";
  const yellowHex = "#ffde59";
  const greenHex = "#7ed957";
  const whiteHex = "#ffffff";

  const items: PixelArtItem[] = [];

  // Black background
  items.push({
    id: "pa_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Courier New, monospace",
    textAlign: "left",
    fill: bgBlack,
    zIndex: 0,
  });

  // Pixelated border frame (stepped corners)
  items.push({
    id: "pa_border_outer",
    type: "rect",
    x: pixelSize * 2,
    y: pixelSize * 2,
    width: width - pixelSize * 4,
    height: height - pixelSize * 4,
    fontFamily: "Courier New, monospace",
    textAlign: "left",
    fill: "transparent",
    stroke: cyanHex,
    strokeWidth: pixelSize / 2,
    zIndex: 1,
  });

  // Pixel art heart / sprite representation (grid blocks)
  const spriteCenterX = width / 2;
  const spriteCenterY = height * 0.4;
  const blocks = [
    { dx: -1, dy: -1, color: redHex },
    { dx: 1, dy: -1, color: redHex },
    { dx: -2, dy: 0, color: redHex },
    { dx: -1, dy: 0, color: redHex },
    { dx: 0, dy: 0, color: redHex },
    { dx: 1, dy: 0, color: redHex },
    { dx: 2, dy: 0, color: redHex },
    { dx: -1, dy: 1, color: redHex },
    { dx: 0, dy: 1, color: redHex },
    { dx: 1, dy: 1, color: redHex },
    { dx: 0, dy: 2, color: redHex },
  ];

  blocks.forEach((b, idx) => {
    items.push({
      id: `pa_sprite_block_${idx}`,
      type: "rect",
      x: spriteCenterX + b.dx * pixelSize * 3,
      y: spriteCenterY + b.dy * pixelSize * 3,
      width: pixelSize * 3,
      height: pixelSize * 3,
      fontFamily: "Courier New, monospace",
      textAlign: "left",
      fill: b.color,
      zIndex: 2,
    });
  });

  // Title
  items.push({
    id: "pa_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 48,
    fontFamily: "Press Start 2P, Courier New, monospace",
    fontWeight: 700,
    textAlign: "left",
    fill: yellowHex,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "pa_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.8,
      fontSize: 24,
      fontFamily: "VT323, Courier New, monospace",
      fontWeight: 400,
      textAlign: "left",
      fill: cyanHex,
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "pa_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.86,
      fontSize: 18,
      fontFamily: "Courier New, monospace",
      fontWeight: 400,
      textAlign: "left",
      fill: greenHex,
      zIndex: 5,
    });
  }

  return {
    style: "pixel_art_8bit",
    canvas: { width, height },
    pixelSize,
    items,
    palette: [bgBlack, cyanHex, redHex, yellowHex, greenHex, whiteHex],
  };
}
