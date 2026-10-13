/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/subdivision-tool-schema.ts
 * sha256:    ce1d01ac572d9bbf66ea31160548f657dcf6a294eebb36427be64a458ef92d5c
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * Subdivision tool schemas for the public MCP server API.
 *
 * Exposes pinepaper_draw_subdivision for autonomous and assisted agents.
 */

export interface SubdivisionToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export function subdivisionTools(): SubdivisionToolDef[] {
  return [
    {
      name: "pinepaper_draw_subdivision",
      description:
        "Generate asymmetric recursive quadtree/rectangular partition compositions (De Stijl/Mondrian, Swiss International Style, Bauhaus, Minimal) with bounded depth, asymmetric rest cell preservation, and crisp orthogonal dividers. Appends to canvas state for rendering and vector export. [Cost: $0.001]",
      inputSchema: {
        type: "object",
        properties: {
          preset: {
            type: "string",
            enum: ["mondrian", "swiss", "bauhaus", "minimal", "custom"],
            description:
              "Style preset: mondrian = primary red/blue/yellow with heavy black dividers; swiss = clean modernist with hairline grid and nested cards; bauhaus = geometric warm parchment palette; minimal = quiet monochromatic; custom = user-specified palette.",
          },
          maxDepth: {
            type: "integer",
            minimum: 1,
            maximum: 6,
            description: "Maximum subdivision recursion depth (default: 4). Bounded to guarantee non-hanging design generation.",
          },
          minDepth: {
            type: "integer",
            minimum: 1,
            maximum: 6,
            description: "Minimum subdivision depth before leaf cells are permitted (default: 2).",
          },
          splitBias: {
            type: "array",
            items: { type: "number" },
            minItems: 2,
            maxItems: 2,
            description: "Partition ratio range [min, max] along the splitting axis (default: [0.35, 0.65]).",
          },
          colorProbability: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Probability that a leaf cell receives an accent color fill rather than neutral ground (default: 0.35 - 0.45).",
          },
          nestedProbability: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Probability that a colored cell receives an inner nested accent frame (default: 0 - 0.25).",
          },
          dividerWidth: {
            type: "number",
            description: "Stroke thickness in px for orthogonal divider grid lines (e.g. 8 for Mondrian, 1.5 for Swiss, 0 for borderless).",
          },
          dividerColor: {
            type: "string",
            description: "Color of dividing grid lines (hex or rgba, e.g. '#0a0a0a').",
          },
          groundColor: {
            type: "string",
            description: "Canvas background / rest color (e.g. '#ffffff' or '#f8fafc').",
          },
          accentColors: {
            type: "array",
            items: { type: "string" },
            description: "List of hex/rgba colors used for cell fills.",
          },
          cellInset: {
            type: "number",
            description: "Inner padding in px inside each cell (default: 0 - 4).",
          },
          bounds: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            description: "Bounding box for the subdivision layout (default: full canvas 1280x720 or 1080x1350).",
          },
          seed: {
            type: "integer",
            description: "Deterministic PRNG seed for reproducible composition layouts.",
          },
          idPrefix: {
            type: "string",
            description: "Prefix for generated Paper.js item registry IDs.",
          },
        },
      },
    },
  ];
}
