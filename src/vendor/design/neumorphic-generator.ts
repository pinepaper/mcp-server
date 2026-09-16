/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/neumorphic-generator.ts
 * sha256:    652ce047ee45738858a3d2595dc9a67668c9bf027ee5d53badbd5c9f95f59ebe
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * NEUMORPHIC & GLASSMORPHIC SOFT UI LAYOUT GENERATOR
 *
 * Implements procedural generation of soft 3D extruded containers, dual shadows,
 * frosted glass panels, and rounded tactile UI elements.
 */

export interface NeumorphicLayoutInput {
  title: string;
  subtitle?: string;
  body?: string;
  cardTitle?: string;
  cardBody?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  accentColor?: string;
}

export interface NeumorphicLayoutItem {
  id: string;
  type: "text" | "rect" | "glass_card" | "neumorphic_button";
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  fill: string;
  borderRadius: number;
  boxShadow?: string;
  backdropFilter?: string;
  border?: string;
  zIndex: number;
}

export interface NeumorphicLayoutResult {
  style: "neumorphic_glass";
  canvas: { width: number; height: number };
  items: NeumorphicLayoutItem[];
  palette: string[];
}

/**
 * Generate a Neumorphic & Glassmorphic Soft UI layout scene graph.
 */
export function generateNeumorphicLayout(input: NeumorphicLayoutInput): NeumorphicLayoutResult {
  const width = input.canvasWidth || 1280;
  const height = input.canvasHeight || 720;
  const bgSoft = "#e0e5ec";
  const lightHighlight = "#ffffff";
  const shadowDepth = "#a3b1c6";
  const accentIndigo = input.accentColor || "#6366f1";
  const textColor = "#1e293b";

  const items: NeumorphicLayoutItem[] = [];

  // Background Canvas
  items.push({
    id: "neu_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Outfit, Inter, sans-serif",
    fill: bgSoft,
    borderRadius: 0,
    zIndex: 0,
  });

  // Main Soft Extruded Card Container
  const mainCardW = Math.round(width * 0.85);
  const mainCardH = Math.round(height * 0.8);
  const mainCardX = Math.round((width - mainCardW) / 2);
  const mainCardY = Math.round((height - mainCardH) / 2);

  items.push({
    id: "neu_main_card",
    type: "rect",
    x: mainCardX,
    y: mainCardY,
    width: mainCardW,
    height: mainCardH,
    fontFamily: "Outfit, Inter, sans-serif",
    fill: bgSoft,
    borderRadius: 24,
    boxShadow: `9px 9px 18px ${shadowDepth}, -9px -9px 18px ${lightHighlight}`,
    zIndex: 1,
  });

  // Header Title Text
  let currentY = mainCardY + 48;
  items.push({
    id: "neu_title",
    type: "text",
    text: input.title,
    x: mainCardX + 48,
    y: currentY,
    width: mainCardW - 96,
    height: 60,
    fontSize: 40,
    fontFamily: "Outfit, Inter, sans-serif",
    fontWeight: "bold",
    fill: textColor,
    borderRadius: 0,
    zIndex: 2,
  });

  currentY += 64;

  if (input.subtitle) {
    items.push({
      id: "neu_subtitle",
      type: "text",
      text: input.subtitle,
      x: mainCardX + 48,
      y: currentY,
      width: mainCardW - 96,
      height: 32,
      fontSize: 20,
      fontFamily: "Outfit, Inter, sans-serif",
      fontWeight: "medium",
      fill: accentIndigo,
      borderRadius: 0,
      zIndex: 2,
    });
    currentY += 48;
  }

  // Frosted Glassmorphic Overlay Panel
  const glassW = Math.round(mainCardW - 96);
  const glassH = 180;
  items.push({
    id: "glass_panel",
    type: "glass_card",
    x: mainCardX + 48,
    y: currentY,
    width: glassW,
    height: glassH,
    fontFamily: "Outfit, Inter, sans-serif",
    fill: "rgba(255, 255, 255, 0.35)",
    borderRadius: 20,
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.15)`,
    zIndex: 3,
  });

  if (input.cardTitle) {
    items.push({
      id: "glass_card_title",
      type: "text",
      text: input.cardTitle,
      x: mainCardX + 72,
      y: currentY + 24,
      width: glassW - 48,
      height: 36,
      fontSize: 24,
      fontFamily: "Outfit, Inter, sans-serif",
      fontWeight: "bold",
      fill: textColor,
      borderRadius: 0,
      zIndex: 4,
    });
  }

  if (input.cardBody) {
    items.push({
      id: "glass_card_body",
      type: "text",
      text: input.cardBody,
      x: mainCardX + 72,
      y: currentY + 68,
      width: glassW - 48,
      height: 80,
      fontSize: 16,
      fontFamily: "Outfit, Inter, sans-serif",
      fontWeight: "normal",
      fill: textColor,
      borderRadius: 0,
      zIndex: 4,
    });
  }

  currentY += glassH + 32;

  // Tactile Neumorphic Soft Button CTA
  items.push({
    id: "neu_cta_button",
    type: "neumorphic_button",
    text: "Explore Tactile Soft UI",
    x: mainCardX + 48,
    y: currentY,
    width: 240,
    height: 52,
    fontSize: 16,
    fontFamily: "Outfit, Inter, sans-serif",
    fontWeight: "bold",
    fill: bgSoft,
    borderRadius: 16,
    boxShadow: `4px 4px 8px ${shadowDepth}, -4px -4px 8px ${lightHighlight}`,
    border: `2px solid ${accentIndigo}`,
    zIndex: 3,
  });

  return {
    style: "neumorphic_glass",
    canvas: { width, height },
    items,
    palette: [bgSoft, lightHighlight, shadowDepth, accentIndigo, textColor],
  };
}

export function generateNeumorphicDashboard(options: { title: string; subtitle?: string; body?: string }): NeumorphicLayoutResult {
  return generateNeumorphicLayout({
    title: options.title,
    subtitle: options.subtitle,
    cardTitle: "System Telemetry",
    cardBody: options.body,
  });
}

