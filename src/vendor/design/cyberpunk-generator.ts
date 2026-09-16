/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/cyberpunk-generator.ts
 * sha256:    acc0e3f1dd2d83eb0e2615c20f35b7b6c4b5d920bd00a95c34eab57714d03222
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * CYBERPUNK & NEON HUD LAYOUT GENERATOR
 *
 * Implements procedural generation of dark void background scenes, glowing neon accents,
 * angular HUD frames, telemetry data overlays, and scanline effects.
 */

export interface CyberpunkLayoutInput {
  title: string;
  subtitle?: string;
  telemetryData?: Record<string, string>;
  canvasWidth?: number;
  canvasHeight?: number;
  primaryNeonHex?: string;
}

export interface CyberpunkLayoutItem {
  id: string;
  type: "text" | "rect" | "hud_frame" | "scanline_overlay" | "telemetry_card";
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily: string;
  fontWeight?: string | number;
  fill: string;
  stroke?: string;
  strokeWidthPx?: number;
  neonGlowHex?: string;
  textShadow?: string;
  clipPathAngle?: string;
  zIndex: number;
}

export interface CyberpunkLayoutResult {
  style: "cyberpunk_neon";
  canvas: { width: number; height: number };
  items: CyberpunkLayoutItem[];
  palette: string[];
}

/**
 * Generate a Cyberpunk & Neon HUD layout scene graph.
 */
export function generateCyberpunkLayout(input: CyberpunkLayoutInput): CyberpunkLayoutResult {
  const width = input.canvasWidth || 1280;
  const height = input.canvasHeight || 720;
  const darkVoid = "#090d16";
  const neonCyan = input.primaryNeonHex || "#00f0ff";
  const neonMagenta = "#ff0055";
  const cyberYellow = "#ffe600";
  const pureWhite = "#ffffff";

  const items: CyberpunkLayoutItem[] = [];

  // Dark Void Canvas Background
  items.push({
    id: "cyber_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
    fill: darkVoid,
    zIndex: 0,
  });

  const marginX = 64;
  const marginY = 64;

  // Outer Angular Cyber HUD Frame
  items.push({
    id: "cyber_outer_hud",
    type: "hud_frame",
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * 2,
    fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
    fill: "transparent",
    stroke: neonCyan,
    strokeWidthPx: 2,
    neonGlowHex: neonCyan,
    clipPathAngle: "polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 32px 100%, 0 calc(100% - 32px))",
    zIndex: 1,
  });

  // Glowing Neon Headline
  let currentY = marginY + 48;
  items.push({
    id: "cyber_title",
    type: "text",
    text: input.title.toUpperCase(),
    x: marginX + 32,
    y: currentY,
    width: width - marginX * 2 - 64,
    height: 60,
    fontSize: 48,
    fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
    fontWeight: "bold",
    fill: neonCyan,
    neonGlowHex: neonCyan,
    textShadow: `0 0 12px ${neonCyan}, 0 0 24px ${neonCyan}`,
    zIndex: 2,
  });

  currentY += 64;

  if (input.subtitle) {
    items.push({
      id: "cyber_subtitle",
      type: "text",
      text: `// ${input.subtitle.toUpperCase()}`,
      x: marginX + 32,
      y: currentY,
      width: width - marginX * 2 - 64,
      height: 32,
      fontSize: 20,
      fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
      fontWeight: "medium",
      fill: neonMagenta,
      neonGlowHex: neonMagenta,
      textShadow: `0 0 8px ${neonMagenta}`,
      zIndex: 2,
    });
    currentY += 48;
  }

  // Telemetry Grid Card Panel
  const telemetry = input.telemetryData || {
    "SYSTEM_STATUS": "ONLINE_NOMINAL",
    "ENCRYPTION": "QUANTUM_256",
    "GRID_NODE": "0x7F9B_NEON_CORE",
  };

  const cardW = 360;
  const cardH = Object.keys(telemetry).length * 36 + 32;

  items.push({
    id: "cyber_telemetry_bg",
    type: "telemetry_card",
    x: marginX + 32,
    y: currentY,
    width: cardW,
    height: cardH,
    fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
    fill: "rgba(0, 240, 255, 0.05)",
    stroke: neonMagenta,
    strokeWidthPx: 1,
    neonGlowHex: neonMagenta,
    zIndex: 2,
  });

  let tY = currentY + 16;
  for (const [key, val] of Object.entries(telemetry)) {
    items.push({
      id: `telemetry_${key}`,
      type: "text",
      text: `[${key}] : ${val}`,
      x: marginX + 48,
      y: tY,
      width: cardW - 32,
      height: 28,
      fontSize: 14,
      fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
      fill: cyberYellow,
      zIndex: 3,
    });
    tY += 36;
  }

  // Scanline Effect Overlay
  items.push({
    id: "cyber_scanlines",
    type: "scanline_overlay",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Share Tech Mono, Orbitron, Fira Code, monospace",
    fill: "rgba(0, 0, 0, 0.25)",
    zIndex: 10,
  });

  return {
    style: "cyberpunk_neon",
    canvas: { width, height },
    items,
    palette: [darkVoid, neonCyan, neonMagenta, cyberYellow, pureWhite],
  };
}

export function generateCyberpunkPoster(options: { title: string; subtitle?: string; body?: string }): CyberpunkLayoutResult {
  return generateCyberpunkLayout({
    title: options.title,
    subtitle: options.subtitle,
    telemetryData: options.body ? { NOTICE: options.body } : undefined,
  });
}

