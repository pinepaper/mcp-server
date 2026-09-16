/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/swiss-style-generator.ts
 * sha256:    6d132e15a6bdd2c508c2171e6c8260044efb5b10e470a4ac1315b1555cb23ba5
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * SWISS / INTERNATIONAL TYPOGRAPHIC STYLE LAYOUT GENERATOR
 *
 * Implements procedural generation of asymmetric, mathematically balanced layouts based on:
 * - 8pt / 16pt / 32pt grid columns.
 * - Modular font size scale (16, 24, 36, 54, 81).
 * - Flush-left, rag-right typography.
 * - High-contrast Swiss Red (#e63946), Black (#000000), White (#ffffff) palette.
 */

export interface SwissLayoutInput {
  title: string;
  subtitle?: string;
  body?: string;
  imageUri?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  accentColor?: string;
}

export interface SwissLayoutItem {
  id: string;
  type: "text" | "rect" | "image";
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  textAlign: "left"; // Swiss style rule: strictly flush-left
  fill: string;
  src?: string;
  zIndex: number;
}

export interface SwissLayoutResult {
  style: "swiss_typographic";
  canvas: { width: number; height: number };
  gridColumns: number;
  gutterPx: number;
  items: SwissLayoutItem[];
  palette: string[];
}

/**
 * Generate a Swiss International Typographic layout scene graph.
 */
export function generateSwissStyleLayout(input: SwissLayoutInput): SwissLayoutResult {
  const width = input.canvasWidth || 1280;
  const height = input.canvasHeight || 720;
  const accentColor = input.accentColor || "#e63946"; // Swiss Red
  const primaryColor = "#000000";
  const bgColor = "#f8fafc";

  // Grid setup: 12-column grid snapped to 8pt multiples
  const marginX = 64; // 8 * 8
  const marginY = 64;
  const gutterPx = 16; // 8 * 2
  const gridColumns = 12;

  const contentWidth = width - marginX * 2;

  const items: SwissLayoutItem[] = [];

  // Background card / canvas fill
  items.push({
    id: "swiss_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Inter, Helvetica, sans-serif",
    textAlign: "left",
    fill: bgColor,
    zIndex: 0,
  });

  // Top accent rules line (Swiss architectural grid mark)
  items.push({
    id: "swiss_accent_bar",
    type: "rect",
    x: marginX,
    y: marginY,
    width: 64, // 8 * 8
    height: 8,
    fontFamily: "Inter, Helvetica, sans-serif",
    textAlign: "left",
    fill: accentColor,
    zIndex: 1,
  });

  // Main Headline (large display size 54px or 81px on modular scale)
  const titleY = marginY + 32;
  items.push({
    id: "swiss_title",
    type: "text",
    text: input.title,
    x: marginX,
    y: titleY,
    width: Math.round((contentWidth * 0.6) / 8) * 8, // ~60% column width on 8pt grid
    fontSize: 54,
    fontFamily: "Inter, Helvetica, sans-serif",
    fontWeight: "bold",
    textAlign: "left",
    fill: primaryColor,
    zIndex: 2,
  });

  let currentY = titleY + 80;

  // Optional Subtitle
  if (input.subtitle) {
    items.push({
      id: "swiss_subtitle",
      type: "text",
      text: input.subtitle,
      x: marginX,
      y: currentY,
      width: Math.round((contentWidth * 0.5) / 8) * 8,
      fontSize: 24,
      fontFamily: "Inter, Helvetica, sans-serif",
      fontWeight: "medium",
      textAlign: "left",
      fill: accentColor,
      zIndex: 2,
    });
    currentY += 48;
  }

  // Optional Body Copy Column
  if (input.body) {
    items.push({
      id: "swiss_body",
      type: "text",
      text: input.body,
      x: marginX,
      y: currentY,
      width: Math.round((contentWidth * 0.45) / 8) * 8,
      fontSize: 16,
      fontFamily: "Inter, Helvetica, sans-serif",
      fontWeight: "normal",
      textAlign: "left",
      fill: primaryColor,
      zIndex: 2,
    });
  }

  // Optional Right-Aligned Asymmetric Image Block
  if (input.imageUri) {
    const imgX = marginX + Math.round((contentWidth * 0.5) / 8) * 8 + gutterPx;
    items.push({
      id: "swiss_image",
      type: "image",
      src: input.imageUri,
      x: Math.round(imgX / 8) * 8,
      y: marginY + 32,
      width: Math.round((contentWidth * 0.45) / 8) * 8,
      height: Math.round((height - marginY * 2 - 32) / 8) * 8,
      fontFamily: "Inter, Helvetica, sans-serif",
      textAlign: "left",
      fill: primaryColor,
      zIndex: 2,
    });
  }

  return {
    style: "swiss_typographic",
    canvas: { width, height },
    gridColumns,
    gutterPx,
    items,
    palette: [primaryColor, bgColor, accentColor, "#ffffff"],
  };
}

export function generateSwissPoster(options: { title: string; subtitle?: string; body?: string }): SwissLayoutResult {
  return generateSwissStyleLayout({
    title: options.title,
    subtitle: options.subtitle,
    body: options.body,
  });
}

