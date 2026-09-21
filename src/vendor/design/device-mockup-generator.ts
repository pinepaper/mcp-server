/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/device-mockup-generator.ts
 * sha256:    5f0fd41709f1f4f34bec9b8f3d497e07b0e8aee8791e50db411c5da42e1c7b6a
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * PROCEDURAL DEVICE MOCKUP & UI SIMULATION ENGINE
 *
 * Generates vector browser windows, laptop frames, simulated typing inputs,
 * animated mouse cursors, and UI layout mockups directly in Paper.js.
 */

/**
 * EVERYTHING BELOW IS PASTED INTO GENERATED CODE, so every value is cleaned where it enters.
 * Review of 2026-09-21: a product URL containing a quote and an expression ran that expression, and
 * a stray backslash made the whole generated program throw. Numbers must be finite, colours must be
 * a real colour, and text travels as a JSON string literal (with < and line separators escaped).
 */
const num = (v: unknown, fallback: number, lo = -1e5, hi = 1e5): number => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback; };
const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\))$/i;
const colour = (v: unknown, fallback: string): string => (typeof v === "string" && COLOUR.test(v.trim()) ? v.trim() : fallback);
/** A JS string literal that cannot end the string, the statement or a script element. */
export const lit = (v: unknown): string => JSON.stringify(String(v ?? "").slice(0, 500)).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export interface DeviceMockupOptions {
  type?: "browser_window" | "laptop_frame" | "frameless";
  width: number;
  height: number;
  x?: number;
  y?: number;
  urlBarText?: string;
  theme?: "dark" | "light";
  primaryColor?: string;
  backgroundColor?: string;
  dropShadow?: boolean;
  cornerRadius?: number;
}

export interface SimulatedTypingOptions {
  containerX: number;
  containerY: number;
  containerWidth: number;
  containerHeight: number;
  promptText: string;
  placeholder?: string;
  textColor?: string;
  accentColor?: string;
  showCursor?: boolean;
  buttonText?: string;
}

export interface SimulatedCursorOptions {
  x: number;
  y: number;
  clicking?: boolean;
  cursorColor?: string;
  scale?: number;
}

/**
 * Generates Paper.js code for a modern browser window mockup.
 */
export function generateBrowserWindowCode(opts: DeviceMockupOptions): string {
  const w = num(opts.width, 1280, 1, 8000);
  const h = num(opts.height, 720, 1, 8000);
  const cx = num(opts.x, w / 2);
  const cy = num(opts.y, h / 2);
  const isDark = (opts.theme ?? "dark") === "dark";
  const radius = num(opts.cornerRadius, 12, 0, 200);

  const headerHeight = Math.max(36, Math.round(h * 0.07));
  const bgWindow = isDark ? "#161b22" : "#ffffff";
  const bgHeader = isDark ? "#0d1117" : "#f1f5f9";
  const bgUrlBar = isDark ? "#21262d" : "#e2e8f0";
  const textUrl = isDark ? "#8b949e" : "#64748b";
  const borderColor = isDark ? "#30363d" : "#cbd5e1";
  const urlDisplay = opts.urlBarText || "https://pinepaper.studio/editor";

  const dotR = 5;
  const dotStartX = Math.round(cx - w / 2 + 18);
  const dotY = Math.round(cy - h / 2 + headerHeight / 2);

  const pillW = Math.min(Math.round(w * 0.55), 480);
  const pillH = Math.round(headerHeight * 0.65);
  const pillX = Math.round(cx - pillW / 2);
  const pillY = Math.round(cy - h / 2 + (headerHeight - pillH) / 2);

  return `
  // Browser Window Mockup Frame
  var frameGroup = new paper.Group();
  
  // Outer ambient shadow
  ${opts.dropShadow !== false ? `
  var shadow = new paper.Path.Rectangle({
    point: [${cx - w / 2 + 6}, ${cy - h / 2 + 10}],
    size: [${w}, ${h}],
    radius: ${radius},
    fillColor: '${isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.15)"}'
  });
  frameGroup.addChild(shadow);
  ` : ""}

  // Window Main Body
  var windowBody = new paper.Path.Rectangle({
    point: [${cx - w / 2}, ${cy - h / 2}],
    size: [${w}, ${h}],
    radius: ${radius},
    fillColor: '${bgWindow}',
    strokeColor: '${borderColor}',
    strokeWidth: 1.5
  });
  frameGroup.addChild(windowBody);

  // Header Titlebar
  var header = new paper.Path.Rectangle({
    point: [${cx - w / 2}, ${cy - h / 2}],
    size: [${w}, ${headerHeight}],
    radius: ${radius},
    fillColor: '${bgHeader}'
  });
  // Clip header bottom corners to keep top rounded
  var headerCut = new paper.Path.Rectangle({
    point: [${cx - w / 2}, ${cy - h / 2 + headerHeight - radius}],
    size: [${w}, ${radius}],
    fillColor: '${bgHeader}'
  });
  var fullHeader = header.unite(headerCut);
  fullHeader.strokeColor = '${borderColor}';
  fullHeader.strokeWidth = 1;
  frameGroup.addChild(fullHeader);

  // Traffic Light Window Controls
  var closeDot = new paper.Path.Circle({ center: [${dotStartX}, ${dotY}], radius: ${dotR}, fillColor: '#ff5f56' });
  var minDot = new paper.Path.Circle({ center: [${dotStartX + 14}, ${dotY}], radius: ${dotR}, fillColor: '#ffbd2e' });
  var maxDot = new paper.Path.Circle({ center: [${dotStartX + 28}, ${dotY}], radius: ${dotR}, fillColor: '#27c93f' });
  
  frameGroup.addChild(closeDot);
  frameGroup.addChild(minDot);
  frameGroup.addChild(maxDot);

  // Address Bar Pill
  var urlPill = new paper.Path.Rectangle({
    point: [${pillX}, ${pillY}],
    size: [${pillW}, ${pillH}],
    radius: ${pillH / 2},
    fillColor: '${bgUrlBar}',
    strokeColor: '${borderColor}',
    strokeWidth: 1
  });
  frameGroup.addChild(urlPill);

  // SSL Lock Icon
  var lockIcon = new paper.PointText({
    point: [${pillX + 12}, ${pillY + pillH / 2 + 4}],
    content: '🔒',
    fontSize: 10,
    fillColor: '${textUrl}'
  });
  frameGroup.addChild(lockIcon);

  // Address Bar Text
  var urlText = new paper.PointText({
    point: [${pillX + 28}, ${pillY + pillH / 2 + 4}],
    content: ${lit(urlDisplay)},
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    fillColor: '${textUrl}'
  });
  frameGroup.addChild(urlText);
  `;
}

/**
 * Generates Paper.js code for a simulated interactive prompt input box.
 */
export function generateSimulatedPromptInputCode(opts: SimulatedTypingOptions): string {
  const x = num(opts.containerX, 0);
  const y = num(opts.containerY, 0);
  const w = num(opts.containerWidth, 600, 1, 8000);
  const h = num(opts.containerHeight, 60, 1, 2000);
  const textColor = colour(opts.textColor, "#f0f6fc");
  // "#rrggbb" only: the code below appends a two-digit alpha ("${accent}22").
  const accent = /^#[0-9a-f]{6}$/i.test(String(opts.accentColor ?? "").trim()) ? String(opts.accentColor).trim() : "#2bb3c0";
  const text = opts.promptText || "A retro robot walking in cyberpunk rain";
  const btnText = opts.buttonText || "Generate";

  // Submit / Generate Button Pill
  const btnH = Math.round(h * 0.72);
  const btnFontSize = Math.max(12, Math.round(btnH * 0.38));

  return `
  // Simulated Interactive Prompt Bar
  var promptGroup = new paper.Group();

  // Outer glowing aura
  var glow = new paper.Path.Rectangle({
    point: [${x - 2}, ${y - 2}],
    size: [${w + 4}, ${h + 4}],
    radius: ${Math.round(h * 0.35) + 2},
    fillColor: '${accent}22',
    strokeColor: '${accent}55',
    strokeWidth: 1.5
  });
  promptGroup.addChild(glow);

  // Input background container
  var inputBg = new paper.Path.Rectangle({
    point: [${x}, ${y}],
    size: [${w}, ${h}],
    radius: ${Math.round(h * 0.35)},
    fillColor: '#090d13',
    strokeColor: '${accent}',
    strokeWidth: 1.5
  });
  promptGroup.addChild(inputBg);

  // Prompt Prefix Icon
  var sparkleIcon = new paper.PointText({
    point: [${x + 18}, ${y + h / 2 + 5}],
    content: '✦',
    fontFamily: 'system-ui',
    fontSize: ${Math.max(14, Math.round(h * 0.32))},
    fillColor: '${accent}'
  });
  promptGroup.addChild(sparkleIcon);

  // Prompt Text Content
  var promptContent = new paper.PointText({
    point: [${x + 44}, ${y + h / 2 + 5}],
    content: ${lit(text)},
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: ${Math.max(13, Math.round(h * 0.28))},
    fontWeight: '500',
    fillColor: '${textColor}'
  });
  promptGroup.addChild(promptContent);

  // Blinking Caret Cursor
  ${opts.showCursor !== false ? `
  var textBounds = promptContent.bounds;
  var caret = new paper.Path.Line({
    from: [textBounds.right + 3, ${y + h * 0.25}],
    to: [textBounds.right + 3, ${y + h * 0.75}],
    strokeColor: '${accent}',
    strokeWidth: 2
  });
  promptGroup.addChild(caret);
  ` : ""}

  // Submit / Generate Button Pill
  var btnW = ${Math.max(90, Math.round(w * 0.18))};
  var btnH = ${btnH};
  var btnX = ${x + w} - btnW - ${Math.round(h * 0.14)};
  var btnY = ${y} + (${h} - btnH) / 2;

  var submitBtn = new paper.Path.Rectangle({
    point: [btnX, btnY],
    size: [btnW, btnH],
    radius: btnH / 2,
    fillColor: '${accent}'
  });
  promptGroup.addChild(submitBtn);

  var btnLabel = new paper.PointText({
    point: [btnX + btnW / 2, btnY + btnH / 2 + 4],
    content: ${lit(btnText)},
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: ${btnFontSize},
    fontWeight: 'bold',
    fillColor: '#090d13',
    justification: 'center'
  });
  promptGroup.addChild(btnLabel);
  `;
}

/**
 * Generates Paper.js code for an animated cursor with optional click pulse.
 */
export function generateSimulatedCursorCode(opts: SimulatedCursorOptions): string {
  const x = num(opts.x, 0);
  const y = num(opts.y, 0);
  const color = colour(opts.cursorColor, "#ffffff");
  const s = num(opts.scale, 1.0, 0.1, 10);

  return `
  // Animated Mouse Cursor
  var cursorGroup = new paper.Group();

  ${opts.clicking ? `
  // Click pulse ring
  var clickRing = new paper.Path.Circle({
    center: [${x}, ${y}],
    radius: ${16 * s},
    strokeColor: '${color}88',
    strokeWidth: 2,
    fillColor: '${color}22'
  });
  cursorGroup.addChild(clickRing);
  ` : ""}

  // Pointer Arrow SVG Path
  var arrow = new paper.Path({
    segments: [
      [${x}, ${y}],
      [${x}, ${y + 17 * s}],
      [${x + 4.5 * s}, ${y + 12.5 * s}],
      [${x + 8.5 * s}, ${y + 18.5 * s}],
      [${x + 11.5 * s}, ${y + 16.5 * s}],
      [${x + 7.5 * s}, ${y + 10.5 * s}],
      [${x + 13.5 * s}, ${y + 10.5 * s}]
    ],
    closed: true,
    fillColor: '${color}',
    strokeColor: '#000000',
    strokeWidth: 1.5
  });
  cursorGroup.addChild(arrow);
  `;
}

/**
 * Complete procedural mockup scene generator.
 */
export function generateMockupSceneCode(options: {
  canvasWidth: number;
  canvasHeight: number;
  browser: DeviceMockupOptions;
  prompt?: SimulatedTypingOptions;
  cursor?: SimulatedCursorOptions;
}): string {
  return `(function() {
    if (typeof paper === 'undefined') return { error: 'Paper.js not loaded' };
    
    // Background Plate
    var bg = new paper.Path.Rectangle({
      point: [0, 0],
      size: [${num(options.canvasWidth, 1280, 1, 8000)}, ${num(options.canvasHeight, 720, 1, 8000)}],
      fillColor: '${colour(options.browser.backgroundColor, "#0a0e14")}'
    });

    ${generateBrowserWindowCode({
      ...options.browser,
      width: options.browser.width,
      height: options.browser.height,
    })}

    ${options.prompt ? generateSimulatedPromptInputCode(options.prompt) : ""}

    ${options.cursor ? generateSimulatedCursorCode(options.cursor) : ""}

    return { success: true };
  })();`;
}

export interface PinePaperOp {
  tool: string;
  args: Record<string, unknown>;
}

export interface DeviceMockupOpsOptions {
  canvasWidth: number;
  canvasHeight: number;
  bornAt?: number;
  ttl?: number;
  fadeIn?: number;
  fadeOut?: number;
  browser: DeviceMockupOptions;
  prompt?: SimulatedTypingOptions;
  cursor?: SimulatedCursorOptions;
}

/**
 * Compiles a procedural device mockup directly into standard native PinePaperOps.
 * This guarantees offline vector SVG projection, SMIL animation, and Resvg rasterization.
 */
export function generateDeviceMockupOps(options: DeviceMockupOpsOptions): PinePaperOp[] {
  const ops: PinePaperOp[] = [];
  const opts = options.browser;
  const w = num(opts.width, 1280, 1, 8000);
  const h = num(opts.height, 720, 1, 8000);
  const cx = num(opts.x, w / 2);
  const cy = num(opts.y, h / 2);
  const isDark = (opts.theme ?? "dark") === "dark";
  const radius = num(opts.cornerRadius, 12, 0, 200);
  const bornAt = options.bornAt ?? 0;
  const ttl = options.ttl ?? 10;
  const fadeIn = options.fadeIn ?? 0.2;
  const fadeOut = options.fadeOut ?? 0.2;

  const headerHeight = Math.max(36, Math.round(h * 0.07));
  const bgWindow = isDark ? "#161b22" : "#ffffff";
  const bgHeader = isDark ? "#0d1117" : "#f1f5f9";
  const bgUrlBar = isDark ? "#21262d" : "#e2e8f0";
  const textUrl = isDark ? "#8b949e" : "#64748b";
  const borderColor = isDark ? "#30363d" : "#cbd5e1";
  const urlDisplay = opts.urlBarText || "https://pinepaper.studio/editor";

  const dotR = 5;
  const dotStartX = Math.round(cx - w / 2 + 18);
  const dotY = Math.round(cy - h / 2 + headerHeight / 2);

  const pillW = Math.min(Math.round(w * 0.55), 480);
  const pillH = Math.round(headerHeight * 0.65);
  const pillY = Math.round(cy - h / 2 + (headerHeight - pillH) / 2);

  const prefix = `mockup_${Math.round(bornAt * 10)}`;

  // 1. Ambient Drop Shadow
  if (opts.dropShadow !== false) {
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_shadow`,
        type: "rectangle",
        x: cx + 6,
        y: cy + 10,
        width: w,
        height: h,
        cornerRadius: radius,
        fill: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)",
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });
  }

  // 2. Window Main Body
  ops.push({
    tool: "pinepaper_create_item",
    args: {
      id: `${prefix}_window`,
      type: "rectangle",
      x: cx,
      y: cy,
      width: w,
      height: h,
      cornerRadius: radius,
      fill: bgWindow,
      stroke: borderColor,
      strokeWidth: 1.5,
      bornAt,
      ttl,
      fadeIn,
      fadeOut,
    },
  });

  // 3. Header Titlebar
  ops.push({
    tool: "pinepaper_create_item",
    args: {
      id: `${prefix}_header`,
      type: "rectangle",
      x: cx,
      y: Math.round(cy - h / 2 + headerHeight / 2),
      width: w,
      height: headerHeight,
      cornerRadius: radius,
      fill: bgHeader,
      stroke: borderColor,
      strokeWidth: 1,
      bornAt,
      ttl,
      fadeIn,
      fadeOut,
    },
  });

  // 4. Traffic Lights
  ops.push(
    {
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_dot_close`,
        type: "circle",
        x: dotStartX,
        y: dotY,
        radius: dotR,
        fill: "#ff5f56",
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    },
    {
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_dot_min`,
        type: "circle",
        x: dotStartX + 14,
        y: dotY,
        radius: dotR,
        fill: "#ffbd2e",
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    },
    {
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_dot_max`,
        type: "circle",
        x: dotStartX + 28,
        y: dotY,
        radius: dotR,
        fill: "#27c93f",
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    }
  );

  // 5. Address Bar Pill
  ops.push({
    tool: "pinepaper_create_item",
    args: {
      id: `${prefix}_urlpill`,
      type: "rectangle",
      x: cx,
      y: Math.round(pillY + pillH / 2),
      width: pillW,
      height: pillH,
      cornerRadius: Math.round(pillH / 2),
      fill: bgUrlBar,
      stroke: borderColor,
      strokeWidth: 1,
      bornAt,
      ttl,
      fadeIn,
      fadeOut,
    },
  });

  // 6. Address Bar Text
  ops.push({
    tool: "pinepaper_create_item",
    args: {
      id: `${prefix}_urltext`,
      type: "text",
      text: `🔒  ${urlDisplay}`,
      x: cx,
      y: Math.round(pillY + pillH / 2),
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fill: textUrl,
      textAlign: "center",
      bornAt,
      ttl,
      fadeIn,
      fadeOut,
    },
  });

  // 7. Prompt Bar Simulation (if present)
  if (options.prompt) {
    const p = options.prompt;
    const px = p.containerX;
    const py = p.containerY;
    const pw = p.containerWidth;
    const ph = p.containerHeight;
    const accent = p.accentColor || "#2bb3c0";
    const textColor = p.textColor || "#f0f6fc";
    const btnText = p.buttonText || "Generate";
    const btnW = Math.max(90, Math.round(pw * 0.18));
    const btnH = Math.round(ph * 0.72);
    const btnX = px + pw - btnW - Math.round(ph * 0.14);
    const btnY = py + (ph - btnH) / 2;

    // Glowing Aura
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_prompt_glow`,
        type: "rectangle",
        x: px + pw / 2,
        y: py + ph / 2,
        width: pw + 6,
        height: ph + 6,
        cornerRadius: Math.round(ph * 0.35) + 3,
        fill: `${accent}18`,
        stroke: `${accent}44`,
        strokeWidth: 1.5,
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });

    // Input Background Container
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_prompt_bg`,
        type: "rectangle",
        x: px + pw / 2,
        y: py + ph / 2,
        width: pw,
        height: ph,
        cornerRadius: Math.round(ph * 0.35),
        fill: "#090d13",
        stroke: accent,
        strokeWidth: 1.5,
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });

    // Prompt Text
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_prompt_text`,
        type: "text",
        text: `✦  ${p.promptText}`,
        x: Math.round(px + pw * 0.38),
        y: Math.round(py + ph / 2),
        fontSize: Math.max(13, Math.round(ph * 0.28)),
        fontFamily: "Inter, system-ui, sans-serif",
        fill: textColor,
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });

    // Button Pill
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_btn_pill`,
        type: "rectangle",
        x: Math.round(btnX + btnW / 2),
        y: Math.round(btnY + btnH / 2),
        width: btnW,
        height: btnH,
        cornerRadius: Math.round(btnH / 2),
        fill: accent,
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });

    // Button Label
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_btn_label`,
        type: "text",
        text: btnText,
        x: Math.round(btnX + btnW / 2),
        y: Math.round(btnY + btnH / 2),
        fontSize: Math.max(12, Math.round(btnH * 0.38)),
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "bold",
        fill: "#090d13",
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });
  }

  // 8. Animated Mouse Cursor (if present)
  if (options.cursor) {
    const c = options.cursor;
    const s = c.scale ?? 1.0;
    const curColor = c.cursorColor || "#ffffff";

    if (c.clicking) {
      ops.push({
        tool: "pinepaper_create_item",
        args: {
          id: `${prefix}_cursor_ring`,
          type: "circle",
          x: c.x,
          y: c.y,
          radius: Math.round(16 * s),
          fill: "rgba(255,255,255,0.15)",
          stroke: "rgba(255,255,255,0.6)",
          strokeWidth: 1.5,
          bornAt,
          ttl,
          fadeIn,
          fadeOut,
        },
      });
    }

    ops.push({
      tool: "pinepaper_create_item",
      args: {
        id: `${prefix}_cursor_arrow`,
        type: "path",
        path: `M ${c.x} ${c.y} L ${c.x} ${c.y + 17 * s} L ${c.x + 4.5 * s} ${c.y + 12.5 * s} L ${c.x + 8.5 * s} ${c.y + 18.5 * s} L ${c.x + 11.5 * s} ${c.y + 16.5 * s} L ${c.x + 7.5 * s} ${c.y + 10.5 * s} L ${c.x + 13.5 * s} ${c.y + 10.5 * s} Z`,
        fill: curColor,
        stroke: "#000000",
        strokeWidth: 1.5,
        bornAt,
        ttl,
        fadeIn,
        fadeOut,
      },
    });
  }

  return ops;
}
