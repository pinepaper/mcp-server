/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/textile-weave-generator.ts
 * sha256:    1704c25e676721c9d78f0ce723e06d7f2969bd959940f93852eff056bdc78d6a
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * Vector textile and knot generation engine.
 *
 * Compiles declarative weave topologies (Plain/Tabby, Twill/Herringbone, Basketweave)
 * and three-dimensional embroidered knots (French knots, bullion coils, rosette anchors)
 * into mathematically clean, executable Paper.js vector geometry.
 */

export interface WeaveBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface PlainWeaveOptions {
  bounds?: WeaveBounds;
  warpColor?: string;
  weftColor?: string;
  pitch?: number;
  density?: number;
  threadWidth?: number;
  threadThickness?: number;
  slubJitter?: number;
  opacity?: number;
  idPrefix?: string;
}

export interface TwillWeaveOptions {
  bounds?: WeaveBounds;
  warpColor?: string;
  weftColor?: string;
  pitch?: number;
  density?: number;
  threadWidth?: number;
  threadThickness?: number;
  floatRatio?: number;
  herringbone?: boolean;
  twillVariant?: "standard" | "herringbone" | string;
  chevronWidth?: number;
  opacity?: number;
  idPrefix?: string;
}

export interface BasketWeaveOptions {
  bounds?: WeaveBounds;
  colorA?: string;
  colorB?: string;
  warpColor?: string;
  weftColor?: string;
  bundleThreads?: number;
  bundleSize?: number;
  bundleGap?: number;
  threadWidth?: number;
  threadThickness?: number;
  pitch?: number;
  density?: number;
  opacity?: number;
  idPrefix?: string;
}

export interface KnotItem {
  x: number;
  y: number;
  radius?: number;
  color?: string;
  highlightColor?: string;
  shadowColor?: string;
  length?: number;
  angle?: number;
}

export interface KnotOptions {
  knotType?: "french_knot" | "bullion_roll" | "knot_anchor" | string;
  knots?: KnotItem[];
  points?: KnotItem[];
  bounds?: WeaveBounds;
  density?: number;
  defaultRadius?: number;
  threadColor?: string;
  defaultColor?: string;
  highlightColor?: string;
  defaultHighlight?: string;
  shadowColor?: string;
  defaultShadow?: string;
  idPrefix?: string;
}

export type WeaveParams = PlainWeaveOptions &
  TwillWeaveOptions &
  BasketWeaveOptions & {
    weave?: "plain" | "twill" | "basket" | "herringbone" | string;
    twillVariant?: string;
    variant?: string;
  };

export type KnotParams = KnotOptions;

export interface SashikoOptions {
  bounds?: WeaveBounds;
  pattern?: "seigaiha" | "asanoha" | "hishi" | "kaki_no_hana" | string;
  stitchLength?: number;
  gapLength?: number;
  threadWidth?: number;
  threadThickness?: number;
  threadColor?: string;
  groundColor?: string;
  scale?: number;
  gridSize?: number;
  concentricArcs?: number;
  vertexGap?: number;
  opacity?: number;
  idPrefix?: string;
}

export type SashikoParams = SashikoOptions;

export interface TextileOptions {
  type?: "plain" | "twill" | "herringbone" | "basket" | "knots" | "french_knot" | "bullion_roll" | "knot_anchor" | "sashiko" | string;
  weave?: string;
  pattern?: string;
  bounds?: WeaveBounds;
  [key: string]: unknown;
}

/**
 * Generate Paper.js code for a Plain (Tabby) Weave.
 * Warp and weft threads alternate over and under using complementary dashArray offsets.
 */
export function generatePlainWeaveCode(opts: PlainWeaveOptions = {}): string {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;
  const pitch = Math.max(4, opts.pitch ?? (opts.density ? Math.max(4, opts.density) : 16));
  const threadWidth = opts.threadWidth ?? opts.threadThickness ?? 1.5;
  const warpColor = opts.warpColor ?? "rgba(51, 65, 85, 0.4)";
  const weftColor = opts.weftColor ?? "rgba(148, 163, 184, 0.4)";
  const slubJitter = opts.slubJitter ?? 0;
  const opacity = opts.opacity ?? 0.85;
  const prefix = opts.idPrefix ?? "plain_weave";

  return `// Plain Weave / Tabby Vector Generator
(function() {
  const items = [];
  const x0 = ${x}, y0 = ${y}, x1 = ${x + w}, y1 = ${y + h};
  const pitch = ${pitch};
  const strokeWidth = ${threadWidth};
  const slubJitter = ${slubJitter};

  // Vertical Warp threads
  let colIdx = 0;
  for (let vx = x0; vx <= x1; vx += pitch) {
    const jitterX = slubJitter ? (Math.sin(colIdx * 1.7) * slubJitter * 2) : 0;
    const warp = new paper.Path.Line({
      from: [vx + jitterX, y0],
      to: [vx + jitterX, y1],
      strokeColor: "${warpColor}",
      strokeWidth: strokeWidth,
      strokeCap: "round",
      dashArray: [pitch, pitch],
      dashOffset: (colIdx % 2 === 0) ? 0 : pitch,
      opacity: ${opacity}
    });
    const id = "${prefix}_warp_" + colIdx;
    if (typeof app.registerItem === "function") app.registerItem(warp, id, { source: "weave_generator", weave: "plain", role: "warp" });
    items.push(warp);
    colIdx++;
  }

  // Horizontal Weft threads
  let rowIdx = 0;
  for (let vy = y0; vy <= y1; vy += pitch) {
    const jitterY = slubJitter ? (Math.cos(rowIdx * 1.7) * slubJitter * 2) : 0;
    const weft = new paper.Path.Line({
      from: [x0, vy + jitterY],
      to: [x1, vy + jitterY],
      strokeColor: "${weftColor}",
      strokeWidth: strokeWidth,
      strokeCap: "round",
      dashArray: [pitch, pitch],
      dashOffset: (rowIdx % 2 === 0) ? pitch : 0,
      opacity: ${opacity}
    });
    const id = "${prefix}_weft_" + rowIdx;
    if (typeof app.registerItem === "function") app.registerItem(weft, id, { source: "weave_generator", weave: "plain", role: "weft" });
    items.push(weft);
    rowIdx++;
  }

  const group = new paper.Group(items);
  if (typeof app.registerItem === "function") app.registerItem(group, "${prefix}_group", { source: "weave_generator", weave: "plain" });
  return group;
})();`;
}

/**
 * Generate Paper.js code for a Twill / Herringbone Weave.
 * Stepped float ratios produce diagonal ridges with optional chevron direction reversals.
 */
export function generateTwillWeaveCode(opts: TwillWeaveOptions = {}): string {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;
  const pitch = Math.max(4, opts.pitch ?? (opts.density ? Math.max(4, opts.density) : 14));
  const threadWidth = opts.threadWidth ?? opts.threadThickness ?? 2;
  const floatRatio = Math.max(1, opts.floatRatio ?? 2);
  const floatLen = pitch * floatRatio;
  const isHerringbone = Boolean(opts.herringbone || opts.twillVariant === "herringbone");
  const chevronW = Math.max(40, opts.chevronWidth ?? 140);
  const warpColor = opts.warpColor ?? "rgba(30, 58, 138, 0.45)";
  const weftColor = opts.weftColor ?? "rgba(203, 213, 225, 0.5)";
  const opacity = opts.opacity ?? 0.9;
  const prefix = opts.idPrefix ?? (isHerringbone ? "herringbone_weave" : "twill_weave");

  return `// Twill Weave & Herringbone Vector Generator
(function() {
  const items = [];
  const x0 = ${x}, y0 = ${y}, x1 = ${x + w}, y1 = ${y + h};
  const pitch = ${pitch};
  const floatLen = pitch * ${floatRatio};
  const isHerringbone = ${isHerringbone};
  const chevronWidth = ${chevronW};

  // Warp lines (base grid)
  let colIdx = 0;
  for (let vx = x0; vx <= x1; vx += pitch) {
    const warp = new paper.Path.Line({
      from: [vx, y0],
      to: [vx, y1],
      strokeColor: "${warpColor}",
      strokeWidth: ${threadWidth},
      strokeCap: "round",
      opacity: ${opacity * 0.7}
    });
    const id = "${prefix}_warp_" + colIdx;
    if (typeof app.registerItem === "function") app.registerItem(warp, id, { source: "weave_generator", weave: "twill", role: "warp" });
    items.push(warp);
    colIdx++;
  }

  // Weft float lines with diagonal stepped offsets
  let rowIdx = 0;
  for (let vy = y0; vy <= y1; vy += pitch) {
    if (isHerringbone) {
      // Split into chevron blocks with reversing slants
      for (let bx = x0; bx < x1; bx += chevronWidth) {
        const segEnd = Math.min(x1, bx + chevronWidth);
        const blockIdx = Math.floor((bx - x0) / chevronWidth);
        const dir = (blockIdx % 2 === 0) ? 1 : -1;
        const phase = dir === 1 ? ((rowIdx * pitch) % (floatLen * 2)) : (((1000 - rowIdx) * pitch) % (floatLen * 2));
        const weftSeg = new paper.Path.Line({
          from: [bx, vy],
          to: [segEnd, vy],
          strokeColor: "${weftColor}",
          strokeWidth: ${threadWidth},
          strokeCap: "round",
          dashArray: [floatLen, pitch],
          dashOffset: phase,
          opacity: ${opacity}
        });
        const id = "${prefix}_weft_" + rowIdx + "_" + blockIdx;
        if (typeof app.registerItem === "function") app.registerItem(weftSeg, id, { source: "weave_generator", weave: "herringbone", role: "weft" });
        items.push(weftSeg);
      }
    } else {
      // Classic diagonal twill
      const phase = (rowIdx * pitch) % (floatLen * 2);
      const weft = new paper.Path.Line({
        from: [x0, vy],
        to: [x1, vy],
        strokeColor: "${weftColor}",
        strokeWidth: ${threadWidth},
        strokeCap: "round",
        dashArray: [floatLen, pitch],
        dashOffset: phase,
        opacity: ${opacity}
      });
      const id = "${prefix}_weft_" + rowIdx;
      if (typeof app.registerItem === "function") app.registerItem(weft, id, { source: "weave_generator", weave: "twill", role: "weft" });
      items.push(weft);
    }
    rowIdx++;
  }

  const group = new paper.Group(items);
  if (typeof app.registerItem === "function") app.registerItem(group, "${prefix}_group", { source: "weave_generator", weave: isHerringbone ? "herringbone" : "twill" });
  return group;
})();`;
}

/**
 * Generate Paper.js code for a Basketweave (Panama) pattern.
 * Groups of parallel threads interlace together as square blocks.
 */
export function generateBasketWeaveCode(opts: BasketWeaveOptions = {}): string {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;
  const bundleSize = Math.max(2, opts.bundleSize ?? opts.bundleThreads ?? 2);
  const bundleGap = opts.bundleGap ?? 2;
  const threadWidth = opts.threadWidth ?? opts.threadThickness ?? 1.8;
  const pitch = Math.max(8, opts.pitch ?? (opts.density ? Math.max(8, opts.density) : 18));
  const colorA = opts.colorA ?? opts.warpColor ?? "rgba(180, 83, 9, 0.6)";
  const colorB = opts.colorB ?? opts.weftColor ?? "rgba(217, 119, 6, 0.6)";
  const opacity = opts.opacity ?? 0.85;
  const prefix = opts.idPrefix ?? "basket_weave";

  return `// Basketweave Vector Generator
(function() {
  const items = [];
  const x0 = ${x}, y0 = ${y}, x1 = ${x + w}, y1 = ${y + h};
  const pitch = ${pitch};
  const bundleSize = ${bundleSize};
  const bundleGap = ${bundleGap};
  const blockSize = (bundleSize * pitch) + bundleGap;
  const threadWidth = ${threadWidth};

  let rIdx = 0;
  for (let vy = y0; vy <= y1; vy += blockSize) {
    let cIdx = 0;
    for (let vx = x0; vx <= x1; vx += blockSize) {
      const isHorizontal = (rIdx + cIdx) % 2 === 0;
      for (let t = 0; t < bundleSize; t++) {
        const offset = t * pitch + pitch / 2;
        let line;
        if (isHorizontal) {
          line = new paper.Path.Line({
            from: [vx, vy + offset],
            to: [Math.min(x1, vx + blockSize - bundleGap), vy + offset],
            strokeColor: "${colorA}",
            strokeWidth: threadWidth,
            strokeCap: "round",
            opacity: ${opacity}
          });
        } else {
          line = new paper.Path.Line({
            from: [vx + offset, vy],
            to: [vx + offset, Math.min(y1, vy + blockSize - bundleGap)],
            strokeColor: "${colorB}",
            strokeWidth: threadWidth,
            strokeCap: "round",
            opacity: ${opacity}
          });
        }
        items.push(line);
      }
      cIdx++;
    }
    rIdx++;
  }

  const group = new paper.Group(items);
  if (typeof app.registerItem === "function") app.registerItem(group, "${prefix}_group", { source: "weave_generator", weave: "basket" });
  return group;
})();`;
}

/**
 * Generate Paper.js code for tactile 3D Embroidered Knots (French knots, bullion coils, knot anchors).
 */
export function generateKnotCode(opts: KnotOptions = {}): string {
  const knots = opts.knots ?? opts.points ?? [];
  const knotType = opts.knotType ?? "french_knot";
  const defaultRadius = opts.defaultRadius ?? 5;
  const defaultColor = opts.threadColor ?? opts.defaultColor ?? "#fbbf24";
  const defaultHighlight = opts.highlightColor ?? opts.defaultHighlight ?? "#fef08a";
  const defaultShadow = opts.shadowColor ?? opts.defaultShadow ?? "rgba(15, 23, 42, 0.4)";
  const prefix = opts.idPrefix ?? "embroidery_knot";

  const serializedKnots = JSON.stringify(knots);

  return `// Embroidered Knots & Anchor Relief Vector Generator
(function() {
  const items = [];
  const knotList = ${serializedKnots};
  const knotType = "${knotType}";
  const defR = ${defaultRadius};
  const defCol = "${defaultColor}";
  const defHi = "${defaultHighlight}";
  const defShadow = "${defaultShadow}";

  knotList.forEach((k, idx) => {
    const kx = k.x, ky = k.y;
    const kr = k.radius || defR;
    const col = k.color || defCol;
    const hi = k.highlightColor || defHi;
    const sh = k.shadowColor || defShadow;
    const knotParts = [];

    if (knotType === "bullion_roll") {
      // Bullion roll coils along directional vector
      const len = k.length || (kr * 4);
      const angRad = ((k.angle || 0) * Math.PI) / 180;
      const dx = Math.cos(angRad);
      const dy = Math.sin(angRad);
      const steps = Math.max(3, Math.round(len / (kr * 0.8)));

      // Base shadow line
      const baseShadow = new paper.Path.Line({
        from: [kx + 1, ky + 1.5],
        to: [kx + dx * len + 1, ky + dy * len + 1.5],
        strokeColor: sh,
        strokeWidth: kr * 1.8,
        strokeCap: "round"
      });
      knotParts.push(baseShadow);

      // Overlapping coil loops
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = kx + dx * (len * t);
        const cy = ky + dy * (len * t);
        const coil = new paper.Path.Circle({
          center: [cx, cy],
          radius: kr,
          fillColor: col,
          strokeColor: hi,
          strokeWidth: 0.8
        });
        knotParts.push(coil);
      }
    } else if (knotType === "knot_anchor") {
      // Anchor tack cross stitches
      const tackLen = kr * 1.5;
      const line1 = new paper.Path.Line({
        from: [kx - tackLen, ky - tackLen],
        to: [kx + tackLen, ky + tackLen],
        strokeColor: col,
        strokeWidth: Math.max(1, kr * 0.4),
        strokeCap: "round"
      });
      const line2 = new paper.Path.Line({
        from: [kx - tackLen, ky + tackLen],
        to: [kx + tackLen, ky - tackLen],
        strokeColor: col,
        strokeWidth: Math.max(1, kr * 0.4),
        strokeCap: "round"
      });
      const centerDot = new paper.Path.Circle({
        center: [kx, ky],
        radius: kr * 0.6,
        fillColor: hi
      });
      knotParts.push(line1, line2, centerDot);
    } else {
      // Standard tactile French knot relief
      // 1. French knot shadow crescent anchor beneath knot
      const shadow = new paper.Path.Circle({
        center: [kx + 1, ky + 1.5],
        radius: kr,
        fillColor: sh,
        strokeColor: null
      });
      knotParts.push(shadow);

      // 2. French knot coil body outer thread
      const body = new paper.Path.Circle({
        center: [kx, ky],
        radius: kr,
        fillColor: col,
        strokeColor: "#f8fafc",
        strokeWidth: 1
      });
      knotParts.push(body);

      // 3. Inner coiled thread wrap
      const innerCoil = new paper.Path.Circle({
        center: [kx + kr * 0.1, ky + kr * 0.1],
        radius: Math.max(1, kr * 0.55),
        fillColor: null,
        strokeColor: col,
        strokeWidth: Math.max(0.8, kr * 0.28)
      });
      knotParts.push(innerCoil);

      // 4. Specular glint highlight
      const glint = new paper.Path.Circle({
        center: [kx - kr * 0.32, ky - kr * 0.32],
        radius: Math.max(0.8, kr * 0.3),
        fillColor: hi,
        strokeColor: null
      });
      knotParts.push(glint);
    }

    const knotGroup = new paper.Group(knotParts);
    const id = "${prefix}_" + idx;
    if (typeof app.registerItem === "function") app.registerItem(knotGroup, id, { source: "knot_generator", x: kx, y: ky, radius: kr });
    items.push(knotGroup);
  });

  const masterGroup = new paper.Group(items);
  if (typeof app.registerItem === "function") app.registerItem(masterGroup, "${prefix}_collection", { source: "knot_generator", count: items.length });
  return masterGroup;
})();`;
}

/**
 * Generate Paper.js code for Japanese Sashiko geometric folk embroidery.
 * Enforces authentic vertex gaps (running stitches do not collide at intersection nodes).
 */
export function generateSashikoCode(opts: SashikoOptions = {}): string {
  const x = opts.bounds?.x ?? 0;
  const y = opts.bounds?.y ?? 0;
  const w = opts.bounds?.width ?? 1280;
  const h = opts.bounds?.height ?? 720;
  const pattern = opts.pattern ?? (opts as any).motif ?? "seigaiha";
  const stitchLen = Math.max(3, opts.stitchLength ?? 8);
  const gapLen = Math.max(2, opts.gapLength ?? 4);
  const vertexGap = Math.max(1, opts.vertexGap ?? 3);
  const threadWidth = opts.threadWidth ?? opts.threadThickness ?? 1.6;
  const threadColor = opts.threadColor ?? "#ffffff";
  const groundColor = opts.groundColor ?? "#1e3a8a";
  const scale = Math.max(20, opts.scale ?? opts.gridSize ?? 42);
  const concentricArcs = Math.max(1, opts.concentricArcs ?? 3);
  const opacity = opts.opacity ?? 0.92;
  const prefix = opts.idPrefix ?? `sashiko_${pattern}`;

  return `// Sashiko Geometric Folk Embroidery Generator (${pattern})
(function() {
  const items = [];
  const x0 = ${x}, y0 = ${y}, x1 = ${x + w}, y1 = ${y + h};
  const threadColor = "${threadColor}";
  const threadWidth = ${threadWidth};
  const stitchLen = ${stitchLen};
  const gapLen = ${gapLen};
  const vertexGap = ${vertexGap};
  const scale = ${scale};
  const concentricArcs = ${concentricArcs};
  const opacity = ${opacity};

  // 0. Ground cloth plate
  const bgPlate = new paper.Path.Rectangle({
    point: [x0, y0],
    size: [x1 - x0, y1 - y0],
    fillColor: "${groundColor}",
    strokeColor: null
  });
  items.push(bgPlate);

  if ("${pattern}" === "seigaiha") {
    // Seigaiha: Overlapping concentric ocean wave arcs with staggered centers
    const R = scale;
    const dy = R * 0.55;
    let row = 0;
    for (let cy = y0 + R * 0.4; cy <= y1 + R; cy += dy) {
      const offsetX = (row % 2 === 0) ? 0 : R;
      let col = 0;
      for (let cx = x0 - R + offsetX; cx <= x1 + R; cx += R * 2) {
        for (let a = 1; a <= concentricArcs; a++) {
          const arcR = (R * a) / concentricArcs;
          const fromPt = [cx - arcR + vertexGap * 0.5, cy - vertexGap * 0.2];
          const throughPt = [cx, cy - arcR];
          const toPt = [cx + arcR - vertexGap * 0.5, cy - vertexGap * 0.2];
          const arc = new paper.Path.Arc(fromPt, throughPt, toPt);
          arc.strokeColor = threadColor;
          arc.strokeWidth = threadWidth;
          arc.strokeCap = "round";
          arc.dashArray = [stitchLen, gapLen];
          arc.opacity = opacity;
          items.push(arc);
        }
        col++;
      }
      row++;
    }
  } else if ("${pattern}" === "asanoha") {
    // Asanoha: Hexagonal star / hemp-leaf isometric lattice with vertex gap clearance
    const S = scale;
    const H = S * Math.sqrt(3) / 2;
    let rIdx = 0;
    for (let py = y0; py <= y1 + H; py += H) {
      const offX = (rIdx % 2 === 0) ? 0 : S * 0.5;
      for (let px = x0 - S + offX; px <= x1 + S; px += S) {
        const mx = px;
        const my = py;
        const angles = [0, 60, 120, 180, 240, 300];
        angles.forEach(angDeg => {
          const rad = (angDeg * Math.PI) / 180;
          const targetX = mx + Math.cos(rad) * S * 0.55;
          const targetY = my + Math.sin(rad) * S * 0.55;

          const startX = mx + Math.cos(rad) * vertexGap;
          const startY = my + Math.sin(rad) * vertexGap;
          const endX = targetX - Math.cos(rad) * vertexGap;
          const endY = targetY - Math.sin(rad) * vertexGap;

          const spoke = new paper.Path.Line({
            from: [startX, startY],
            to: [endX, endY],
            strokeColor: threadColor,
            strokeWidth: threadWidth,
            strokeCap: "round",
            dashArray: [stitchLen, gapLen],
            opacity: opacity
          });
          items.push(spoke);
        });
      }
      rIdx++;
    }
  } else {
    // Hishi / Kaki no Hana: Diamond grid with vertex gap junctions
    const P = scale;
    for (let diag = -Math.max(w, h); diag <= w + h; diag += P) {
      for (let t = 0; t <= w + h; t += P) {
        const p1x = t + vertexGap;
        const p1y = t + diag + vertexGap;
        const p2x = t + P - vertexGap;
        const p2y = t + P + diag - vertexGap;
        if (p1x >= x0 - P && p1x <= x1 + P && p1y >= y0 - P && p1y <= y1 + P) {
          const seg1 = new paper.Path.Line({
            from: [p1x, p1y],
            to: [p2x, p2y],
            strokeColor: threadColor,
            strokeWidth: threadWidth,
            strokeCap: "round",
            dashArray: [stitchLen, gapLen],
            opacity: opacity
          });
          items.push(seg1);
        }

        const q1x = t + vertexGap;
        const q1y = -t + diag + vertexGap;
        const q2x = t + P - vertexGap;
        const q2y = -(t + P) + diag - vertexGap;
        if (q1x >= x0 - P && q1x <= x1 + P && q1y >= y0 - P && q1y <= y1 + P) {
          const seg2 = new paper.Path.Line({
            from: [q1x, q1y],
            to: [q2x, q2y],
            strokeColor: threadColor,
            strokeWidth: threadWidth,
            strokeCap: "round",
            dashArray: [stitchLen, gapLen],
            opacity: opacity
          });
          items.push(seg2);
        }
      }
    }
  }

  const group = new paper.Group(items);
  if (typeof app.registerItem === "function") {
    app.registerItem(group, "${prefix}_group", {
      source: "sashiko_generator",
      pattern: "${pattern}",
      stitchCount: items.length
    });
  }
  return group;
})();`;
}

/**
 * Master dispatcher for textile and embroidery vector code generation.
 */
export function generateTextileCode(opts: TextileOptions): string {
  const type = opts.type ?? opts.weave ?? "plain";
  switch (type) {
    case "plain":
      return generatePlainWeaveCode(opts as PlainWeaveOptions);
    case "twill":
      return generateTwillWeaveCode({
        ...opts,
        herringbone: opts.herringbone || opts.twillVariant === "herringbone" || opts.variant === "herringbone",
      } as TwillWeaveOptions);
    case "herringbone":
      return generateTwillWeaveCode({ ...opts, herringbone: true } as TwillWeaveOptions);
    case "basket":
      return generateBasketWeaveCode(opts as BasketWeaveOptions);
    case "knots":
    case "french_knot":
    case "bullion_roll":
    case "knot_anchor":
      return generateKnotCode({ knotType: (opts.knotType ?? (opts.type !== "knots" ? opts.type : "french_knot")) as any, ...opts });
    case "sashiko":
      return generateSashikoCode({ pattern: (opts.pattern ?? (opts as any).motif ?? "seigaiha") as any, ...opts });
    default:
      return generatePlainWeaveCode(opts as PlainWeaveOptions);
  }
}
