/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/recursive-subdivision-generator.ts
 * sha256:    f1383a9c42ada6df674ea65790cc61693e8c25dac0bfee68a09c7669fc851a6b
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * Recursive Quadtree / Rectangular Subdivision Generative Engine.
 *
 * Procedurally partitions a canvas into asymmetric orthogonal compositions
 * inspired by De Stijl (Piet Mondrian), Bauhaus, and Swiss International Style.
 *
 * Adheres strictly to the generative rules in gen:recursive-quad:
 * 1. "A cell either subdivides or takes a colour — never both."
 * 2. "Depth is bounded; an unbounded recursion is a hang, not a design."
 * 3. "Leave one large cell undivided as a rest for the eye."
 */

export interface SubdivisionBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type SubdivisionPreset = "mondrian" | "swiss" | "bauhaus" | "minimal" | "custom";

export interface SubdivisionPalette {
  ground?: string;
  colors?: string[];
  dividerColor?: string;
}

export interface RecursiveSubdivisionOptions {
  bounds?: SubdivisionBounds;
  preset?: SubdivisionPreset;
  minDepth?: number;
  maxDepth?: number;
  splitBias?: [number, number];
  palette?: SubdivisionPalette;
  groundColor?: string;
  accentColors?: string[];
  colorProbability?: number;
  dividerWidth?: number;
  dividerColor?: string;
  cellInset?: number;
  nestedProbability?: number;
  seed?: number;
  idPrefix?: string;
}

export interface SubdivisionCell {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  isLeaf: boolean;
  color?: string;
  hasNested?: boolean;
  nestedColor?: string;
  isRestCell?: boolean;
}

// Built-in presets tuned for iconic graphic design movements
export const SUBDIVISION_PRESETS: Record<
  SubdivisionPreset,
  {
    ground: string;
    colors: string[];
    dividerColor: string;
    dividerWidth: number;
    colorProbability: number;
    nestedProbability: number;
    cellInset: number;
    splitBias: [number, number];
  }
> = {
  mondrian: {
    ground: "#ffffff",
    colors: ["#dc2626", "#1d4ed8", "#facc15", "#171717"], // Primary Red, Blue, Yellow, Deep Black
    dividerColor: "#0a0a0a",
    dividerWidth: 8,
    colorProbability: 0.35,
    nestedProbability: 0,
    cellInset: 0,
    splitBias: [0.35, 0.65],
  },
  swiss: {
    ground: "#f8fafc",
    colors: ["#e11d48", "#2563eb", "#059669", "#d97706", "#0f172a"],
    dividerColor: "#cbd5e1",
    dividerWidth: 1.5,
    colorProbability: 0.45,
    nestedProbability: 0.25,
    cellInset: 4,
    splitBias: [0.4, 0.6],
  },
  bauhaus: {
    ground: "#fef3c7", // Warm parchment
    colors: ["#b91c1c", "#1e3a8a", "#d97706", "#047857", "#18181b"],
    dividerColor: "#18181b",
    dividerWidth: 4,
    colorProbability: 0.4,
    nestedProbability: 0.15,
    cellInset: 2,
    splitBias: [0.33, 0.67],
  },
  minimal: {
    ground: "#ffffff",
    colors: ["#18181b", "#52525b", "#a1a1aa"],
    dividerColor: "#e4e4e7",
    dividerWidth: 1,
    colorProbability: 0.25,
    nestedProbability: 0.1,
    cellInset: 6,
    splitBias: [0.4, 0.6],
  },
  custom: {
    ground: "#ffffff",
    colors: ["#dc2626", "#1d4ed8", "#facc15"],
    dividerColor: "#000000",
    dividerWidth: 4,
    colorProbability: 0.35,
    nestedProbability: 0,
    cellInset: 0,
    splitBias: [0.35, 0.65],
  },
};

/**
 * Fast deterministic PRNG (Mulberry32).
 */
function mulberry32(seed: number): () => number {
  let s = Math.floor(seed) || 1;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Compute the recursive partition tree over the bounding rectangle.
 */
export function partitionSubdivision(opts: RecursiveSubdivisionOptions = {}): {
  cells: SubdivisionCell[];
  dividers: Array<{ x0: number; y0: number; x1: number; y1: number }>;
} {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;

  const presetName = opts.preset ?? "mondrian";
  const presetConfig = SUBDIVISION_PRESETS[presetName] ?? SUBDIVISION_PRESETS.mondrian;

  const maxDepth = Math.max(1, Math.min(6, opts.maxDepth ?? 4));
  const minDepth = Math.max(1, Math.min(maxDepth, opts.minDepth ?? 2));
  const splitBias = opts.splitBias ?? presetConfig.splitBias;

  const ground = opts.groundColor ?? opts.palette?.ground ?? presetConfig.ground;
  const colors = opts.accentColors ?? opts.palette?.colors ?? presetConfig.colors;
  const colorProb = opts.colorProbability ?? presetConfig.colorProbability;
  const nestedProb = opts.nestedProbability ?? presetConfig.nestedProbability;

  const rng = mulberry32(opts.seed ?? 42);

  const leaves: SubdivisionCell[] = [];
  const dividers: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];

  let restCellSelected = false;

  function subdivide(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    depth: number,
    allowRestCandidate: boolean
  ) {
    const minCellDim = 32;
    const canSubdivide = depth < maxDepth && cw > minCellDim * 2 && ch > minCellDim * 2;

    // Rule: "Leave one large cell undivided as a rest for the eye."
    // At depth 1 or 2, freeze one cell early to create asymmetric negative space.
    if (!restCellSelected && allowRestCandidate && depth >= 1 && depth <= 2 && rng() < 0.45) {
      restCellSelected = true;
      leaves.push({
        x: cx,
        y: cy,
        width: cw,
        height: ch,
        depth,
        isLeaf: true,
        color: ground, // Rest cell remains calm ground color
        isRestCell: true,
      });
      return;
    }

    if (!canSubdivide || (depth >= minDepth && rng() < 0.3)) {
      // Leaf cell - Rule: "A cell either subdivides or takes a colour — never both."
      const receivesColor = rng() < colorProb;
      const color = receivesColor
        ? colors[Math.floor(rng() * colors.length)]
        : ground;

      const hasNested = receivesColor && rng() < nestedProb;
      const nestedColor = hasNested
        ? colors[Math.floor(rng() * colors.length)]
        : undefined;

      leaves.push({
        x: cx,
        y: cy,
        width: cw,
        height: ch,
        depth,
        isLeaf: true,
        color,
        hasNested,
        nestedColor,
      });
      return;
    }

    // Determine split direction: bias toward splitting the longer axis
    const splitHorizontally = ch > cw * 1.15 ? true : cw > ch * 1.15 ? false : rng() < 0.5;
    const [minB, maxB] = splitBias;
    const ratio = minB + rng() * (maxB - minB);

    if (splitHorizontally) {
      const splitY = cy + Math.round(ch * ratio);
      dividers.push({ x0: cx, y0: splitY, x1: cx + cw, y1: splitY });

      subdivide(cx, cy, cw, splitY - cy, depth + 1, true);
      subdivide(cx, splitY, cw, cy + ch - splitY, depth + 1, false);
    } else {
      const splitX = cx + Math.round(cw * ratio);
      dividers.push({ x0: splitX, y0: cy, x1: splitX, y1: cy + ch });

      subdivide(cx, cy, splitX - cx, ch, depth + 1, true);
      subdivide(splitX, cy, cx + cw - splitX, ch, depth + 1, false);
    }
  }

  subdivide(x, y, w, h, 0, false);

  // Fallback guarantee: if rest cell was never picked, mark the largest leaf as the rest cell
  if (!restCellSelected && leaves.length > 0) {
    let largestIdx = 0;
    let maxArea = 0;
    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      if (!leaf) continue;
      const area = leaf.width * leaf.height;
      if (area > maxArea) {
        maxArea = area;
        largestIdx = i;
      }
    }
    const target = leaves[largestIdx];
    if (target) {
      target.color = ground;
      target.isRestCell = true;
      target.hasNested = false;
    }
  }

  return { cells: leaves, dividers };
}

/**
 * Generate executable Paper.js vector code for recursive quadtree / rectangular subdivision.
 */
export function generateRecursiveSubdivisionCode(opts: RecursiveSubdivisionOptions = {}): string {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;

  const presetName = opts.preset ?? "mondrian";
  const presetConfig = SUBDIVISION_PRESETS[presetName] ?? SUBDIVISION_PRESETS.mondrian;

  const ground = opts.groundColor ?? opts.palette?.ground ?? presetConfig.ground;
  const dividerColor = opts.dividerColor ?? opts.palette?.dividerColor ?? presetConfig.dividerColor;
  const dividerWidth = opts.dividerWidth ?? presetConfig.dividerWidth;
  const cellInset = opts.cellInset ?? presetConfig.cellInset;
  const prefix = opts.idPrefix ?? "subdiv";

  const { cells, dividers } = partitionSubdivision(opts);
  const serializedCells = JSON.stringify(cells);
  const serializedDividers = JSON.stringify(dividers);

  return `// Recursive Quadtree Subdivision Vector Generator (${presetName})
(function() {
  const items = [];
  const prefix = "${prefix}";
  const cellInset = ${cellInset};
  const dividerWidth = ${dividerWidth};
  const dividerColor = "${dividerColor}";
  const groundColor = "${ground}";

  // 1. Solid Ground Backdrop
  const bg = new paper.Path.Rectangle({
    point: [${x}, ${y}],
    size: [${w}, ${h}],
    fillColor: groundColor,
    strokeColor: null
  });
  if (typeof app.registerItem === "function") {
    app.registerItem(bg, prefix + "_backdrop", { source: "recursive_subdivision", role: "backdrop" });
  }
  items.push(bg);

  // 2. Leaf Color Blocks & Nested Accents
  const cells = ${serializedCells};
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const ix = c.x + cellInset;
    const iy = c.y + cellInset;
    const iw = Math.max(1, c.width - cellInset * 2);
    const ih = Math.max(1, c.height - cellInset * 2);

    if (c.color && c.color !== groundColor) {
      const rect = new paper.Path.Rectangle({
        point: [ix, iy],
        size: [iw, ih],
        fillColor: c.color,
        strokeColor: null
      });
      const cellId = prefix + "_cell_" + i;
      if (typeof app.registerItem === "function") {
        app.registerItem(rect, cellId, {
          source: "recursive_subdivision",
          depth: c.depth,
          isRestCell: Boolean(c.isRestCell)
        });
      }
      items.push(rect);

      // Optional nested accent box
      if (c.hasNested && c.nestedColor && iw > 24 && ih > 24) {
        const nestInset = Math.min(iw, ih) * 0.22;
        const nestRect = new paper.Path.Rectangle({
          point: [ix + nestInset, iy + nestInset],
          size: [iw - nestInset * 2, ih - nestInset * 2],
          fillColor: c.nestedColor,
          strokeColor: null
        });
        const nestId = prefix + "_cell_" + i + "_nested";
        if (typeof app.registerItem === "function") {
          app.registerItem(nestRect, nestId, { source: "recursive_subdivision", role: "nested" });
        }
        items.push(nestRect);
      }
    }
  }

  // 3. Orthogonal Divider Grid Lines
  if (dividerWidth > 0) {
    const dividers = ${serializedDividers};
    for (let j = 0; j < dividers.length; j++) {
      const d = dividers[j];
      const line = new paper.Path.Line({
        from: [d.x0, d.y0],
        to: [d.x1, d.y1],
        strokeColor: dividerColor,
        strokeWidth: dividerWidth,
        strokeCap: "square"
      });
      const divId = prefix + "_divider_" + j;
      if (typeof app.registerItem === "function") {
        app.registerItem(line, divId, { source: "recursive_subdivision", role: "divider" });
      }
      items.push(line);
    }

    // Outer border frame
    const frame = new paper.Path.Rectangle({
      point: [${x}, ${y}],
      size: [${w}, ${h}],
      fillColor: null,
      strokeColor: dividerColor,
      strokeWidth: dividerWidth * 1.5
    });
    if (typeof app.registerItem === "function") {
      app.registerItem(frame, prefix + "_frame", { source: "recursive_subdivision", role: "frame" });
    }
    items.push(frame);
  }

  const group = new paper.Group(items);
  if (typeof app.registerItem === "function") {
    app.registerItem(group, prefix + "_group", {
      source: "recursive_subdivision",
      cellCount: cells.length,
      preset: "${presetName}"
    });
  }
  return group;
})();`;
}
