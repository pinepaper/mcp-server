/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/bauhaus-generator.ts
 * sha256:    19ab8dfcd126e3f262e63c0d09ca8dd3ad70d21bd1e098f5716d5d65db3143ae
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface BauhausElement {
  id: string;
  type: "text" | "shape";
  shapeType?: "circle" | "square" | "triangle" | "line";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees?: number;
  textAlign?: "left" | "center" | "right";
  hasDropShadow?: boolean;
  hasBlur?: boolean;
}

export interface BauhausPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  darkVariant?: boolean;
}

export interface BauhausDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: BauhausElement[];
  metadata: {
    title: string;
    createdAt: string;
    gridSystem: "bauhaus_asymmetric_3col";
    palette: string[];
  };
}

export const BAUHAUS_PALETTE = {
  cream: "#f4f1de",
  red: "#d62828",
  blue: "#003049",
  yellow: "#fdf0d5",
  dark: "#111111",
};

/**
 * Procedurally generates an asymmetric Bauhaus Modernist geometric slide/poster layout.
 */
export function generateBauhausPoster(options: BauhausPosterOptions): BauhausDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const isDark = options.darkVariant ?? false;
  const backgroundHex = isDark ? BAUHAUS_PALETTE.dark : BAUHAUS_PALETTE.cream;
  const primaryTextColor = isDark ? BAUHAUS_PALETTE.cream : BAUHAUS_PALETTE.dark;

  const elements: BauhausElement[] = [];

  // 1. Primary Red Circle (large architectural structural shape)
  //
  // Sized from the SHORTER side, because the text block below it is placed by the height (subtitle at
  // 0.68 × h). Sized from the width, a 1920x1080 circle was 864 px tall and reached y = 1058, so the
  // subtitle (734) and body ran across it; 1280x720 the same. With min(w, h) the circle ends at
  // 0.18h + 0.45h = 0.63h on any landscape canvas, clear of the subtitle. On a portrait canvas the shorter
  // side IS the width, so the default 1080x1350 poster is unchanged (bauhaus-landscape-layout.test.ts).
  const circleSize = Math.round(Math.min(width, height) * 0.45);
  // The headline is a fixed 72 px in a fixed 90 px box at 0.06h, so on a short canvas the divider (0.15h) and
  // the circle (0.18h) would sit inside it: at 1280x720 the title box spans 43–133 and the divider was at 108,
  // through the glyphs. The divider goes no higher than the title box's bottom, and the circle keeps its gap
  // below the divider. Where the proportions already clear (1080x1350: divider 203, title bottom 171), both
  // max() pick the proportional value, so the default poster is unchanged.
  const titleY = Math.round(height * 0.06);
  const titleHeight = 90;
  const dividerY = Math.max(Math.round(height * 0.15), titleY + titleHeight);
  const circleY = Math.max(Math.round(height * 0.18), dividerY + 22);
  elements.push({
    id: "bauhaus-red-circle",
    type: "shape",
    shapeType: "circle",
    fillHex: BAUHAUS_PALETTE.red,
    x: Math.round(width * 0.42),
    y: circleY,
    width: circleSize,
    height: circleSize,
    hasDropShadow: false,
    hasBlur: false,
  });

  // 2. Deep Blue Rectangle
  elements.push({
    id: "bauhaus-blue-square",
    type: "shape",
    shapeType: "square",
    fillHex: BAUHAUS_PALETTE.blue,
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.35),
    width: Math.round(width * 0.28),
    height: Math.round(height * 0.42),
    hasDropShadow: false,
    hasBlur: false,
  });

  // 3. Black Structural Line Divider
  elements.push({
    id: "bauhaus-black-line",
    type: "shape",
    shapeType: "line",
    fillHex: isDark ? BAUHAUS_PALETTE.yellow : BAUHAUS_PALETTE.dark,
    x: Math.round(width * 0.1),
    y: dividerY,
    width: Math.round(width * 0.8),
    height: 6,
    hasDropShadow: false,
    hasBlur: false,
  });

  // 4. Asymmetric Heavy Headline Typography
  elements.push({
    id: "bauhaus-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 72,
    fontWeight: "900",
    fontFamily: "Futura, 'Bayer Universal', sans-serif",
    fillHex: primaryTextColor,
    x: Math.round(width * 0.1),
    y: titleY,
    width: Math.round(width * 0.8),
    height: titleHeight,
    textAlign: "left",
  });

  // 5. Subtitle Text Block
  elements.push({
    id: "bauhaus-subtitle-text",
    type: "text",
    content: options.subtitle,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura, sans-serif",
    fillHex: isDark ? BAUHAUS_PALETTE.cream : BAUHAUS_PALETTE.blue,
    x: Math.round(width * 0.42),
    y: Math.round(height * 0.68),
    width: Math.round(width * 0.5),
    height: 60,
    textAlign: "left",
  });

  // 6. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "bauhaus-body-text",
      type: "text",
      content: options.body,
      fontSize: 16,
      fontWeight: "400",
      fontFamily: "Futura, sans-serif",
      fillHex: primaryTextColor,
      x: Math.round(width * 0.42),
      y: Math.round(height * 0.76),
      width: Math.round(width * 0.5),
      height: 120,
      textAlign: "left",
    });
  }

  return {
    id: `bauhaus-poster-${Date.now()}`,
    style: "bauhaus_geometric",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      gridSystem: "bauhaus_asymmetric_3col",
      palette: [
        BAUHAUS_PALETTE.cream,
        BAUHAUS_PALETTE.red,
        BAUHAUS_PALETTE.blue,
        BAUHAUS_PALETTE.yellow,
        BAUHAUS_PALETTE.dark,
      ],
    },
  };
}
