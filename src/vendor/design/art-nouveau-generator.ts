/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/art-nouveau-generator.ts
 * sha256:    d70ea759329050c26323f25f11171055fa019227d1787b49802184805132407c
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * ART NOUVEAU ORGANIC FLORAL PROCEDURAL GENERATOR
 *
 * Implements Alphonse Mucha-inspired organic Art Nouveau aesthetics:
 * - Sinuous S-curve whiplash lines & asymmetrical floral tendrils.
 * - Muted jewel & earth tones (forest green #2d4a3e, gold #d4af37, terracotta #8c2d19, parchment #f4ecd8).
 * - Intricate halo halo framing & arched border filigree.
 * - Elegant organic serif typography (Cinzel Decorative, Cormorant Garamond).
 */

export interface ArtNouveauInput {
  title: string;
  subtitle?: string;
  body?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface ArtNouveauItem {
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

export interface ArtNouveauResult {
  style: "art_nouveau";
  canvas: { width: number; height: number };
  items: ArtNouveauItem[];
  palette: string[];
}

export function generateArtNouveauPoster(input: ArtNouveauInput): ArtNouveauResult {
  const width = input.canvasWidth || 1080;
  const height = input.canvasHeight || 1350;

  const bgParchment = "#f4ecd8";
  const forestGreen = "#2d4a3e";
  const goldHex = "#d4af37";
  const terracottaHex = "#8c2d19";
  const darkBrown = "#1a0f0a";

  const items: ArtNouveauItem[] = [];

  // Parchment background
  items.push({
    id: "an_bg",
    type: "rect",
    x: 0,
    y: 0,
    width,
    height,
    fontFamily: "Cormorant Garamond, serif",
    textAlign: "left",
    fill: bgParchment,
    zIndex: 0,
  });

  // Architectural halo arch behind focal point
  items.push({
    id: "an_halo_outer",
    type: "circle",
    x: width * 0.5,
    y: height * 0.38,
    radius: 220,
    fontFamily: "Cormorant Garamond, serif",
    textAlign: "center",
    fill: "transparent",
    stroke: goldHex,
    strokeWidth: 8,
    zIndex: 1,
  });

  items.push({
    id: "an_halo_inner",
    type: "circle",
    x: width * 0.5,
    y: height * 0.38,
    radius: 195,
    fontFamily: "Cormorant Garamond, serif",
    textAlign: "center",
    fill: forestGreen,
    zIndex: 2,
  });

  // Floral S-curve tendril motif paths (whiplash curves)
  items.push({
    id: "an_whiplash_left",
    type: "path",
    x: width * 0.2,
    y: height * 0.3,
    d: `M ${width * 0.2} ${height * 0.4} C ${width * 0.15} ${height * 0.25}, ${width * 0.35} ${height * 0.2}, ${width * 0.45} ${height * 0.35}`,
    fontFamily: "Cormorant Garamond, serif",
    textAlign: "left",
    fill: "none",
    stroke: goldHex,
    strokeWidth: 4,
    zIndex: 3,
  });

  // Title
  items.push({
    id: "an_title",
    type: "text",
    text: input.title,
    x: width * 0.1,
    y: height * 0.72,
    fontSize: 56,
    fontFamily: "Cinzel Decorative, Cormorant Garamond, serif",
    fontWeight: 700,
    textAlign: "left",
    fill: darkBrown,
    zIndex: 5,
  });

  // Subtitle
  if (input.subtitle) {
    items.push({
      id: "an_subtitle",
      type: "text",
      text: input.subtitle,
      x: width * 0.1,
      y: height * 0.79,
      fontSize: 28,
      fontFamily: "Cormorant Garamond, serif",
      fontWeight: 600,
      textAlign: "left",
      fill: terracottaHex,
      zIndex: 5,
    });
  }

  // Body
  if (input.body) {
    items.push({
      id: "an_body",
      type: "text",
      text: input.body,
      x: width * 0.1,
      y: height * 0.84,
      fontSize: 20,
      fontFamily: "Cormorant Garamond, serif",
      fontWeight: 400,
      textAlign: "left",
      fill: "#4a3b32",
      zIndex: 5,
    });
  }

  return {
    style: "art_nouveau",
    canvas: { width, height },
    items,
    palette: [bgParchment, forestGreen, goldHex, terracottaHex, darkBrown],
  };
}
