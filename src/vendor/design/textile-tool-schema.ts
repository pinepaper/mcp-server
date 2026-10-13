/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/textile-tool-schema.ts
 * sha256:    b360bad615f5735239a7ecdc120577196379874ce20e45b90eb54fc7c32d3e0c
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * Public MCP Tool Schemas for Vector Textile, Weave & Embroidery Generation.
 *
 * Declared once and derived directly from generator contracts.
 * Exposes pinepaper_draw_weave, pinepaper_draw_knots, and pinepaper_draw_sashiko
 * to AI models and agentic clients connecting via the Model Context Protocol.
 */

export interface TextileToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function textileTools(): TextileToolDef[] {
  return [
    {
      name: "pinepaper_draw_weave",
      description:
        "Draw authentic structural woven textiles (Plain/Tabby, Twill, Herringbone, Basketweave/Panama) as vector fiber lattices with alternating over/under warp and weft phase offsets. Supports natural yarn slub jitter, float ratios, and herringbone chevron reversals. Appends to canvas state for high-fidelity export and playback. [Cost: $0.001]",
      inputSchema: {
        type: "object",
        properties: {
          weave: {
            type: "string",
            enum: ["plain", "twill", "basket", "herringbone"],
            description: "The weave topology. plain = 1/1 orthogonal interlace; twill = stepped diagonal float ridges; basket = grouped thread checkerboard; herringbone = chevron zig-zag twill.",
          },
          warpColor: {
            type: "string",
            description: "Color of vertical warp threads (hex or rgba, e.g. '#334155').",
          },
          weftColor: {
            type: "string",
            description: "Color of horizontal weft threads (hex or rgba, e.g. '#94a3b8').",
          },
          threadThickness: {
            type: "number",
            description: "Thread stroke width in px (default: 1.8).",
          },
          density: {
            type: "number",
            description: "Thread pitch / grid density (default: 16).",
          },
          floatRatio: {
            type: "number",
            description: "Float span multiplier for twill (e.g. 2 for 2/2 twill, default: 2).",
          },
          twillVariant: {
            type: "string",
            enum: ["standard", "herringbone"],
            description: "Variant for twill weave.",
          },
          chevronWidth: {
            type: "number",
            description: "Width of herringbone chevron directional blocks in px (default: 140).",
          },
          bundleSize: {
            type: "number",
            description: "Number of parallel threads bundled in basketweave blocks (default: 2).",
          },
          bundleGap: {
            type: "number",
            description: "Spacing gap between checkerboard blocks in basketweave (default: 2).",
          },
          slubJitter: {
            type: "number",
            description: "Natural spun fiber imperfection jitter (0 for smooth CAD, 0.15 for natural yarn).",
          },
          opacity: {
            type: "number",
            description: "Weave layer opacity (0.0 to 1.0, default: 0.85).",
          },
          bounds: {
            type: "object",
            description: "Bounding rectangle for weave canvas coverage.",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
          },
        },
      },
    },
    {
      name: "pinepaper_draw_knots",
      description:
        "Draw three-dimensional embroidered knot relief (French knots, bullion coil rolls, and tension anchor tacks) with drop shadows, tight thread wraps, and specular highlight glints. Appends to canvas state for high-fidelity export and playback. [Cost: $0.001]",
      inputSchema: {
        type: "object",
        properties: {
          knotType: {
            type: "string",
            enum: ["french_knot", "bullion_roll", "knot_anchor"],
            description: "Style of knot. french_knot = concentric coiled bead with crescent shadow; bullion_roll = elongated cylindrical coils; knot_anchor = cross-tack stitches.",
          },
          points: {
            type: "array",
            description: "Locations and individual properties of knots.",
            items: {
              type: "object",
              properties: {
                x: { type: "number", description: "X center coordinate." },
                y: { type: "number", description: "Y center coordinate." },
                radius: { type: "number", description: "Knot bead radius." },
                color: { type: "string", description: "Thread body color." },
                highlightColor: { type: "string", description: "Specular glint highlight color." },
                shadowColor: { type: "string", description: "Drop shadow crescent color." },
                length: { type: "number", description: "Length of bullion roll in px." },
                angle: { type: "number", description: "Angle of bullion roll in degrees." },
              },
              required: ["x", "y"],
            },
          },
          threadColor: {
            type: "string",
            description: "Default knot thread color (hex or rgba, e.g. '#fbbf24').",
          },
          highlightColor: {
            type: "string",
            description: "Default highlight glint color (hex or rgba, e.g. '#fef08a').",
          },
          shadowColor: {
            type: "string",
            description: "Default drop shadow color (hex or rgba, e.g. 'rgba(15, 23, 42, 0.4)').",
          },
          defaultRadius: {
            type: "number",
            description: "Default knot bead radius in px (default: 5).",
          },
        },
      },
    },
    {
      name: "pinepaper_draw_sashiko",
      description:
        "Draw Japanese Sashiko geometric folk embroidery lattices (Seigaiha blue sea waves, Asanoha hemp-leaf stars, Hishi diamond grids) with dashed running stitches on indigo ground cloth. Strictly enforces authentic vertex gaps so stitches never collide at meeting points. Appends to canvas state for high-fidelity export and playback. [Cost: $0.001]",
      inputSchema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            enum: ["seigaiha", "asanoha", "hishi", "kaki_no_hana"],
            description: "Traditional Sashiko pattern. seigaiha = concentric overlapping wave arcs; asanoha = hexagonal hemp-leaf star lattice; hishi/kaki_no_hana = diamond grid with persimmon flower intersections.",
          },
          stitchLength: {
            type: "number",
            description: "Length of individual running stitches in px (default: 8).",
          },
          gapLength: {
            type: "number",
            description: "Spacing gap between running stitches in px (default: 4).",
          },
          vertexGap: {
            type: "number",
            description: "Corner standoff clearance distance ensuring stitches do not collide at intersection vertices (default: 3).",
          },
          scale: {
            type: "number",
            description: "Size of repeating geometric unit in px (default: 42).",
          },
          concentricArcs: {
            type: "number",
            description: "Number of concentric wave arcs per crest in Seigaiha (default: 3).",
          },
          threadColor: {
            type: "string",
            description: "Thread color (default: '#ffffff' white cotton).",
          },
          groundColor: {
            type: "string",
            description: "Ground cloth color (default: '#1e3a8a' indigo).",
          },
          threadWidth: {
            type: "number",
            description: "Thread stroke width in px (default: 1.6).",
          },
          bounds: {
            type: "object",
            description: "Bounding rectangle for pattern canvas coverage.",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
          },
        },
      },
    },
  ];
}
