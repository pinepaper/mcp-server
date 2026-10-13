/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/ui-kit-runtime.ts
 * sha256:    b3b1b6320a9d131077bcdf4b7f56d5e52ba0dbdb269348db419130200c16da47
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * THE UI KIT — phone lock screens, notifications, prompt boxes, toggles, calendar and ad cards (D83, #81).
 *
 * A product video is mostly interface: a phone wakes, three notifications stack in, a prompt box types a
 * request. Asked for that, a model stacked rectangles and guessed at what a Dynamic Island looks like, and
 * every answer was a different, slightly wrong phone. The kit draws them once, properly, as parametric
 * components the designer calls by name — `UIKit.phone(...)`, `UIKit.notifications(...)`,
 * `UIKit.promptBox(...)` — and the result takes its colours, fonts and corner rounding from the brand kit
 * when one is set.
 *
 * IT TRAVELS THE WAY THE RIG LIBRARY DOES (a863f78c): the source is served at /v1/ui-kit-runtime.js, the
 * chat attaches it to generated code that calls the kit without defining it, and the render door attaches
 * it to a scene's custom code (ui-kit-attach.ts). It never travels in the prompt: a model asked to paste a
 * library paraphrases it and the paraphrase drops lines.
 *
 * BUILT ONLY FROM PRIMITIVES EVERY ENGINE DOOR DRAWS: `PinePaper.create` with rectangle (radius), circle,
 * text (justification left/center/right) and path, animated only by `PinePaper.addAnimation` keyframes on
 * opacity, y, x, scale and content. Nothing here reaches for a DOM, a font loader or a network. Each
 * component is a set of ordinary registered items, so it can be selected, edited and recoloured afterwards.
 *
 * WHY A STRING: this is JavaScript that runs inside the engine (the Studio's canvas, the render container,
 * the still engine), not code the Worker executes. Plain ES5 on purpose — no template literals, no arrow
 * functions — so it parses in every one of those realms, and so this file can hold it in a String.raw.
 */

/** Names whose presence in generated code means the kit must be attached. */
export const UI_KIT_SYMBOLS: readonly string[] = ["UIKit."];

/** The sentinel the runtime defines; code that carries it already has the kit. */
export const UI_KIT_SENTINEL = "__PP_UI_KIT__";

export const UI_KIT_RUNTIME: string = String.raw`// --- PINEPAPER UI KIT (attached automatically; do not paste) -------------------
var __PP_UI_KIT__ = true;
var UIKit = (function () {
  var P = (typeof PinePaper !== 'undefined' && PinePaper) ? PinePaper : (typeof app !== 'undefined' ? app : null);
  var PJ = (typeof paper !== 'undefined' && paper) ? paper : null;
  var DEFAULT = {
    name: '',
    colors: { primary: '#0a84ff', secondary: '#5e5ce6', accent: '#34c759', background: '#f2f2f7', text: '#1c1c1e' },
    fonts: { heading: 'Geist', body: 'Geist', mono: 'Geist Mono' },
    radius: 1
  };
  var brand = null;          // the kit set by UIKit.brand(), or captured from applyBrandKit
  var kitEnd = 0;            // the last keyframe time any component asked for
  var minDuration = 0;       // UIKit.duration(D)
  var HOLD = 1.5;            // seconds the last state is held on screen

  // ---------- colour --------------------------------------------------------
  function isColour(c) { return typeof c === 'string' && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(c.trim()); }
  function rgb(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3 || h.length === 4) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h.slice(0, 6), 16);
    if (!isFinite(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex(c) {
    function p(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + p(c[0]) + p(c[1]) + p(c[2]);
  }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function lum(c) {
    var v = rgb(c).map(function (u) { u /= 255; return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /** White or near-black, whichever reads on this colour. */
  function ink(on) { return contrast('#ffffff', on) >= contrast('#111111', on) ? '#ffffff' : '#111111'; }

  // ---------- theme -----------------------------------------------------------
  function theme() {
    var k = brand || {};
    var c = k.colors || {};
    var f = k.fonts || {};
    var primary = isColour(c.primary) ? c.primary : DEFAULT.colors.primary;
    var secondary = isColour(c.secondary) ? c.secondary : (brand ? primary : DEFAULT.colors.secondary);
    var accent = isColour(c.accent) ? c.accent : (brand ? secondary : DEFAULT.colors.accent);
    var radius = k.radius;
    if (radius === 'sharp') radius = 0.35; else if (radius === 'soft') radius = 1; else if (radius === 'round') radius = 1.35;
    radius = (typeof radius === 'number' && isFinite(radius)) ? Math.max(0, Math.min(2, radius)) : 1;
    return {
      branded: !!brand,
      name: k.name || '',
      primary: primary, secondary: secondary, accent: accent,
      background: isColour(c.background) ? c.background : DEFAULT.colors.background,
      text: isColour(c.text) ? c.text : DEFAULT.colors.text,
      heading: f.heading || DEFAULT.fonts.heading,
      body: f.body || f.heading || DEFAULT.fonts.body,
      mono: f.mono || DEFAULT.fonts.mono,
      radius: radius
    };
  }

  // ---------- canvas & timeline ----------------------------------------------
  /**
   * The frame the render draws. PinePaper.canvas is the Studio shell's property and a render engine may
   * not define it (the browser engine did not: a 1080x1920 phone was sized and centred for 1280x720,
   * #81), so the engine's own artboard and then paper's view are asked before the 1280x720 guess.
   */
  function canvas() {
    var w = 0, h = 0;
    function take(c) { if (!w && c && +c.width > 0 && +c.height > 0) { w = +c.width; h = +c.height; } }
    try { if (P) take(P.canvas); } catch (e) {}
    try { if (P && typeof P.getCanvasSize === 'function') take(P.getCanvasSize()); } catch (e) {}
    try { if (P) take(P.canvasSize); } catch (e) {}
    try { if (PJ && PJ.view) take(PJ.view.bounds); } catch (e) {}
    return { width: w || 1280, height: h || 720 };
  }
  /** The canvas background, when the engine says what it is: text placed straight on the canvas reads against it. */
  function ground() {
    try { var b = P && (P.backgroundColor || P.background); if (isColour(b)) return b; } catch (e) {}
    return null;
  }
  function note(t) { if (t > kitEnd) kitEnd = t; }
  function play() {
    var D = Math.max(minDuration, kitEnd > 0 ? kitEnd + HOLD : 0);
    if (D > 0 && P && P.playKeyframeTimeline) { try { P.playKeyframeTimeline(D, false); } catch (e) {} }
  }

  // ---------- primitives --------------------------------------------------------
  function made(list, id) { if (id !== undefined && id !== null) list.push({ id: id }); return id; }
  function rect(list, x, y, w, h, r, fill, extra) {
    var o = { x: x, y: y, width: Math.max(0.5, w), height: Math.max(0.5, h), radius: Math.max(0, Math.min(r, Math.min(w, h) / 2)) };
    if (fill === null) o.fillColor = null; else o.color = fill;
    if (extra) for (var k in extra) o[k] = extra[k];
    var id = made(list, P.create('rectangle', o));
    list[list.length - 1].cy = y;
    return id;
  }
  function circle(list, x, y, r, fill, extra) {
    var o = { x: x, y: y, radius: r, color: fill };
    if (extra) for (var k in extra) o[k] = extra[k];
    var id = made(list, P.create('circle', o));
    list[list.length - 1].cy = y;
    return id;
  }
  /** pathData authored around the origin with a bounding box centred on it, so x/y IS the centre. */
  function path(list, x, y, d, fill, extra) {
    var o = { x: x, y: y, pathData: d, closed: true, fillColor: fill, color: fill };
    if (extra) for (var k in extra) o[k] = extra[k];
    var id = made(list, P.create('path', o));
    list[list.length - 1].cy = y;
    return id;
  }
  /** Text: x is the left edge for align 'left', the right edge for 'right', the centre otherwise; y is the centre. */
  function text(list, content, x, y, size, fill, weight, align, family, extra) {
    var o = { x: x, y: y, content: String(content), fontSize: size, color: fill, fontFamily: family, fontWeight: String(weight || 400), justification: align || 'center' };
    if (extra) for (var k in extra) o[k] = extra[k];
    var id = made(list, P.create('text', o));
    list[list.length - 1].cy = y;
    return id;
  }
  var measured = {};
  function measure(str, size, weight, family) {
    str = String(str);
    var key = size + '|' + weight + '|' + family + '|' + str;
    if (measured[key] !== undefined) return measured[key];
    return (measured[key] = measureNow(str, size, weight, family));
  }
  function measureNow(str, size, weight, family) {
    if (PJ && PJ.PointText) {
      try {
        var t = new PJ.PointText({ content: str, fontSize: size, fontWeight: String(weight || 400), fontFamily: family });
        var w = t.bounds.width; t.remove();
        if (w > 0 && isFinite(w)) return w;
      } catch (e) {}
    }
    return str.length * size * 0.54;
  }
  /** Greedy word wrap into at most maxLines lines, the last one ellipsised if it had to be cut. */
  function wrap(str, maxWidth, size, weight, family, maxLines) {
    var words = String(str || '').split(/\s+/).filter(Boolean), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var trial = cur ? cur + ' ' + words[i] : words[i];
      if (measure(trial, size, weight, family) <= maxWidth || !cur) cur = trial;
      else { lines.push(cur); cur = words[i]; if (lines.length === maxLines) { cur = ''; lines[maxLines - 1] += ' ' + words.slice(i).join(' '); break; } }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) lines = lines.slice(0, maxLines);
    for (var j = 0; j < lines.length; j++) lines[j] = fit(lines[j], maxWidth, size, weight, family);
    return lines;
  }
  function fit(str, maxWidth, size, weight, family) {
    str = String(str);
    if (measure(str, size, weight, family) <= maxWidth) return str;
    while (str.length > 1 && measure(str + '…', size, weight, family) > maxWidth) str = str.slice(0, -1);
    return str.replace(/\s+$/, '') + '…';
  }

  // ---------- motion ------------------------------------------------------------
  /**
   * One addAnimation per item, carrying every animated property in every key: a second track on the
   * same item fights the first. keys: [{ t, opacity, dy, scale }] — dy is relative to the item's own
   * creation y, so a whole component moves together.
   */
  function animate(list, keys, easing) {
    if (!keys || !keys.length || !P || !P.addAnimation) return;
    keys = keys.slice().sort(function (a, b) { return a.t - b.t; });
    if (keys[0].t > 0) keys.unshift(copy(keys[0], 0));
    // Every key carries every property that any key animates: a property missing from one key has no
    // value to interpolate from. y is animated only when something actually moves, so a component
    // that merely fades never has its items re-placed.
    var moves = keys.some(function (k) { return k.dy; });
    var props = ['opacity', 'dy', 'scale'];
    props.forEach(function (p) {
      var any = keys.some(function (k) { return k[p] !== undefined; });
      if (!any) return;
      var first; for (var a = 0; a < keys.length; a++) if (keys[a][p] !== undefined) { first = keys[a][p]; break; }
      var cur = first;
      keys = keys.map(function (k) { var c = copy(k, k.t); if (c[p] === undefined) c[p] = cur; else cur = c[p]; return c; });
    });
    if (!moves) keys = keys.map(function (k) { var c = copy(k, k.t); delete c.dy; return c; });
    var last = keys[keys.length - 1].t;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var frames = keys.map(function (k) {
        var props = {};
        if (k.opacity !== undefined) props.opacity = k.opacity * (it.alpha === undefined ? 1 : it.alpha);
        if (k.dy !== undefined && it.cy !== undefined) props.y = it.cy + k.dy;
        if (k.scale !== undefined) props.scale = k.scale;
        return { time: k.t, properties: props, easing: k.easing || easing || 'easeOut' };
      });
      try { P.addAnimation(it.id, frames, { duration: Math.max(last, 0.01), loop: false }); } catch (e) {}
    }
    note(last);
  }
  function copy(k, t) { var o = {}; for (var p in k) o[p] = k[p]; o.t = t; return o; }
  /** Opacity window: hidden until at, in over fade, out at until. */
  function windowKeys(at, fade, until, rise) {
    var keys = [];
    at = +at || 0; fade = fade === undefined ? 0.4 : +fade; rise = +rise || 0;
    if (at > 0 || rise) {
      keys.push({ t: Math.max(0, at), opacity: 0, dy: rise });
      keys.push({ t: Math.max(0, at) + fade, opacity: 1, dy: 0 });
    }
    if (until !== undefined && until !== null && isFinite(until)) {
      if (!keys.length) keys.push({ t: 0, opacity: 1, dy: 0 });
      keys.push({ t: +until, opacity: 1, dy: 0 });
      keys.push({ t: +until + fade, opacity: 0, dy: 0 });
    }
    return keys;
  }
  function settle(list, o, rise) {
    var keys = windowKeys(o.at, o.fade, o.until, rise);
    if (keys.length) animate(list, keys);
    play();
  }
  function ids(list) { return list.map(function (it) { return it.id; }); }
  function glyphAlpha(list, a) { list[list.length - 1].alpha = a; }

  // ---------- phone -------------------------------------------------------------
  // Drawn in iPhone points (screen 390 x 844) and scaled: the phone is the unit every other component
  // placed on it inherits through phone.s.
  var FRAME_W = 414, FRAME_H = 868, BEZEL = 12, SCREEN_W = 390, SCREEN_H = 844;

  function phone(o) {
    o = o || {};
    var th = theme(), cv = canvas();
    var maxH = cv.height * (cv.height > cv.width ? 0.78 : 0.88);
    var H = +o.height || Math.min(maxH, cv.width * 0.9 * FRAME_H / FRAME_W);
    var s = H / FRAME_H, W = FRAME_W * s;
    var cx = o.x === undefined ? cv.width / 2 : +o.x, cy = o.y === undefined ? cv.height / 2 : +o.y;
    var dark = o.dark !== false;
    var frameCol = isColour(o.frame) ? o.frame : '#1d1d1f';
    var sw = SCREEN_W * s, sh = SCREEN_H * s, sl = cx - sw / 2, st = cy - sh / 2;
    var wall = o.wallpaper;
    var stops = Array.isArray(wall) ? wall.filter(isColour) : (isColour(wall) ? [wall] : [th.primary, mix(th.secondary, '#000000', 0.45)]);
    if (!stops.length) stops = [th.primary, mix(th.secondary, '#000000', 0.45)];
    var avg = stops.length > 1 ? mix(stops[0], stops[stops.length - 1], 0.5) : stops[0];
    var onWall = isColour(o.ink) ? o.ink : ink(avg);
    var list = [];

    // body, buttons, glass
    rect(list, cx + 6 * s, cy + 14 * s, W, FRAME_H * s, 66 * s, '#000000', { opacity: 0.28 }); glyphAlpha(list, 0.28);
    var btn = '#2a2a2d';
    rect(list, cx - W / 2 - 1.5 * s, st + 160 * s, 4 * s, 34 * s, 2 * s, btn);
    rect(list, cx - W / 2 - 1.5 * s, st + 235 * s, 4 * s, 62 * s, 2 * s, btn);
    rect(list, cx - W / 2 - 1.5 * s, st + 310 * s, 4 * s, 62 * s, 2 * s, btn);
    rect(list, cx + W / 2 + 1.5 * s, st + 270 * s, 4 * s, 98 * s, 2 * s, btn);
    rect(list, cx, cy, W, FRAME_H * s, 66 * s, frameCol, { strokeColor: mix(frameCol, '#ffffff', 0.22), strokeWidth: Math.max(1, 2 * s) });
    var fill = stops.length > 1
      ? { gradient: { stops: stops }, origin: [sl, st], destination: [sl + sw * 0.6, st + sh] }
      : stops[0];
    var screenId = rect(list, cx, cy, sw, sh, 54 * s, fill);

    // status bar + Dynamic Island
    var sbY = st + 29 * s;
    if (o.island !== false) rect(list, cx, sbY, 124 * s, 36 * s, 18 * s, '#000000');
    if (o.statusBar !== false) {
      text(list, o.time || '9:41', sl + 66 * s, sbY, 17 * s, onWall, 600, 'center', th.body);
      var bx = sl + sw - 92 * s;
      for (var i = 0; i < 4; i++) rect(list, bx + i * 5.2 * s, sbY + (4 - i) * 1.4 * s, 3.2 * s, (5 + i * 2.8) * s, 1 * s, onWall);
      // wi-fi: three nested fans, drawn as one centred path
      var r1 = 7.6 * s, r2 = 4.9 * s, r3 = 2.2 * s;
      var fan = function (r, r0) {
        var a0 = -Math.PI * 0.78, a1 = -Math.PI * 0.22, pts = [];
        for (var k = 0; k <= 8; k++) { var a = a0 + (a1 - a0) * k / 8; pts.push([Math.cos(a) * r, Math.sin(a) * r + 3.6 * s]); }
        for (var m = 8; m >= 0; m--) { var b = a0 + (a1 - a0) * m / 8; pts.push([Math.cos(b) * r0, Math.sin(b) * r0 + 3.6 * s]); }
        return 'M ' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L ') + ' Z';
      };
      path(list, sl + sw - 64 * s, sbY - 1 * s, fan(r1, r1 - 1.9 * s) + ' ' + fan(r2, r2 - 1.9 * s) + ' ' + fan(r3, 0.01), onWall);
      rect(list, sl + sw - 37 * s, sbY, 25 * s, 12 * s, 3.6 * s, null, { strokeColor: onWall, strokeWidth: Math.max(0.8, 1.1 * s), opacity: 0.45 }); glyphAlpha(list, 0.45);
      rect(list, sl + sw - 38.2 * s, sbY, 19.6 * s, 8 * s, 2 * s, onWall);
      rect(list, sl + sw - 22.6 * s, sbY, 1.6 * s, 4 * s, 0.8 * s, onWall, { opacity: 0.45 }); glyphAlpha(list, 0.45);
    }

    // lock screen
    var lock = o.lockScreen !== false;
    if (lock) {
      text(list, o.date || 'Tuesday, June 9', cx, st + 118 * s, 21 * s, onWall, 600, 'center', th.body, { opacity: 0.88 }); glyphAlpha(list, 0.88);
      text(list, o.clock || o.time || '9:41', cx, st + 196 * s, 98 * s, onWall, 700, 'center', th.heading);
      var gl = onWall === '#ffffff' ? '#ffffff' : '#000000';
      circle(list, sl + 66 * s, st + sh - 92 * s, 25 * s, gl, { opacity: 0.18 }); glyphAlpha(list, 0.18);
      circle(list, sl + sw - 66 * s, st + sh - 92 * s, 25 * s, gl, { opacity: 0.18 }); glyphAlpha(list, 0.18);
      // torch and camera glyphs, centred on the origin
      path(list, sl + 66 * s, st + sh - 92 * s, 'M ' + (-4 * s) + ' ' + (-10 * s) + ' L ' + (4 * s) + ' ' + (-10 * s) + ' L ' + (4 * s) + ' ' + (-4 * s) + ' L ' + (2 * s) + ' ' + (0) + ' L ' + (2 * s) + ' ' + (10 * s) + ' L ' + (-2 * s) + ' ' + (10 * s) + ' L ' + (-2 * s) + ' ' + (0) + ' L ' + (-4 * s) + ' ' + (-4 * s) + ' Z', onWall);
      rect(list, sl + sw - 66 * s, st + sh - 92 * s, 22 * s, 16 * s, 4 * s, onWall);
      circle(list, sl + sw - 66 * s, st + sh - 92 * s, 4.6 * s, gl === '#ffffff' ? mix(avg, '#000000', 0.2) : '#ffffff');
    }
    if (o.homeIndicator !== false) rect(list, cx, st + sh - 9 * s, 136 * s, 5 * s, 2.5 * s, onWall);

    settle(list, o);
    var ph = {
      kind: 'phone', s: s, x: cx, y: cy, width: W, height: FRAME_H * s, ink: onWall, dark: dark,
      screen: { x: cx, y: cy, width: sw, height: sh, left: sl, top: st, right: sl + sw, bottom: st + sh, id: screenId },
      /** Canvas position of a point given in phone-screen points (0..390, 0..844). */
      at: function (px, py) { return { x: sl + px * s, y: st + py * s }; },
      ids: ids(list)
    };
    return ph;
  }

  // ---------- notifications -------------------------------------------------------
  function cardTheme(o, th) {
    var dark = !!o.dark;
    return dark
      ? { bg: '#1c1c1e', alpha: 0.78, title: '#ffffff', body: '#ebebf5', meta: '#ebebf5', metaA: 0.6 }
      : { bg: '#ffffff', alpha: 0.82, title: '#111111', body: '#1c1c1e', meta: '#3c3c43', metaA: 0.6 };
  }
  /**
   * Build one notification's items at slot-0 position and return them with their height. Not animated.
   */
  function noteItems(n, i, x, top, width, s, th, ct) {
    var list = [];
    var pad = 14 * s, icon = 38 * s, fsT = 15 * s, fsB = 15 * s, fsM = 13 * s;
    var textLeft = x - width / 2 + pad + icon + 12 * s, textW = width / 2 + x - pad - textLeft;
    var title = n.title || n.app || 'Notification';
    var lines = wrap(n.body || '', textW, fsB, 400, th.body, n.lines || 2);
    var h = pad * 2 + fsT * 1.25 + lines.length * fsB * 1.28;
    h = Math.max(h, icon + pad * 2);
    var cy = top + h / 2;
    var colours = [th.primary, th.accent, th.secondary];
    var ic = isColour(n.color) ? n.color : colours[i % colours.length];
    rect(list, x, cy, width, h, 24 * s * th.radius, ct.bg, { opacity: ct.alpha }); glyphAlpha(list, ct.alpha);
    var ix = x - width / 2 + pad + icon / 2;
    rect(list, ix, cy, icon, icon, 9.5 * s * th.radius, ic);
    text(list, (n.icon || String(n.app || title).charAt(0) || '•').slice(0, 2), ix, cy, 19 * s, ink(ic), 700, 'center', th.heading);
    var metaText = n.time || 'now';
    var metaW = measure(metaText, fsM, 400, th.body);
    var tY = top + pad + fsT * 0.62;
    text(list, fit(title, textW - metaW - 10 * s, fsT, 600, th.body), textLeft, tY, fsT, ct.title, 600, 'left', th.body);
    text(list, metaText, x + width / 2 - pad, tY, fsM, ct.meta, 400, 'right', th.body, { opacity: ct.metaA }); glyphAlpha(list, ct.metaA);
    for (var l = 0; l < lines.length; l++) text(list, lines[l], textLeft, tY + fsT * 0.66 + fsB * 0.64 + l * fsB * 1.28, fsB, ct.body, 400, 'left', th.body);
    return { list: list, h: h };
  }
  /**
   * A stack of notifications arriving one by one. Newest on top pushes the others down (iOS), or
   * newest: 'bottom' to append below. phoneOrOpts may be a phone from UIKit.phone() — the stack then
   * sits under the clock and inherits its scale — or plain options { x, y(top), width, scale }.
   */
  function notifications(phoneOrOpts, items, o) {
    o = o || {};
    // notifications(phone, items, opts) | notifications(items, opts) | notifications({ items, x, y, ... })
    var th = theme(), ph = phoneOrOpts && phoneOrOpts.kind === 'phone' ? phoneOrOpts : null;
    if (!ph && Array.isArray(phoneOrOpts)) { o = items || {}; items = phoneOrOpts; }
    else if (!ph && phoneOrOpts && typeof phoneOrOpts === 'object') { o = phoneOrOpts; items = o.items; }
    o = o || {};
    if (!ph && o.phone && o.phone.kind === 'phone') ph = o.phone;
    items = (items || []).map(function (n) { return typeof n === 'string' ? { title: n } : (n || {}); });
    var cv = canvas();
    var s = ph ? ph.s : (+o.scale || Math.min(cv.width, cv.height) / 720);
    var width = +o.width || (ph ? ph.screen.width - 24 * s : 360 * s);
    var x = o.x !== undefined ? +o.x : (ph ? ph.screen.x : cv.width / 2);
    var top = o.y !== undefined ? +o.y : (ph ? ph.screen.top + 300 * s : cv.height * 0.25);
    var gap = (o.gap === undefined ? 8 : +o.gap) * s;
    var start = o.start === undefined ? 0.6 : +o.start, stagger = o.stagger === undefined ? 0.9 : +o.stagger;
    var newestTop = o.newest !== 'bottom';
    var ct = cardTheme(o, th);
    var built = [];
    for (var i = 0; i < items.length; i++) built.push(noteItems(items[i], i, x, top, width, s, th, ct));
    var times = items.map(function (n, k) { return n.at !== undefined ? +n.at : start + k * stagger; });
    var IN = 0.45, RISE = -16 * s;
    var all = [];
    for (var j = 0; j < built.length; j++) {
      // y offset of card j once card k has arrived
      var offset = function (k) {
        if (!newestTop) { var d0 = 0; for (var m0 = 0; m0 < j; m0++) d0 += built[m0].h + gap; return d0; }
        var d = 0; for (var m = j + 1; m <= k; m++) d += built[m].h + gap; return d;
      };
      var keys = [{ t: 0, opacity: 0, dy: offset(j) + RISE }, { t: times[j], opacity: 0, dy: offset(j) + RISE },
        { t: times[j] + IN, opacity: 1, dy: offset(j) }];
      if (newestTop) for (var k = j + 1; k < built.length; k++) {
        keys.push({ t: times[k], opacity: 1, dy: offset(k - 1) });
        keys.push({ t: times[k] + IN, opacity: 1, dy: offset(k) });
      }
      if (o.until !== undefined) { keys.push({ t: +o.until, opacity: 1, dy: offset(built.length - 1) }); keys.push({ t: +o.until + 0.4, opacity: 0, dy: offset(built.length - 1) }); }
      if (times[j] <= 0 && !newestTop && o.until === undefined) keys = [];
      animate(built[j].list, keys);
      all = all.concat(built[j].list);
    }
    play();
    var total = 0; for (var q = 0; q < built.length; q++) total += built[q].h + (q ? gap : 0);
    return { kind: 'notifications', ids: ids(all), cards: built.map(function (b) { return ids(b.list); }), arrivals: times,
      top: top, bottom: top + total, height: total, doneAt: times.length ? times[times.length - 1] + IN : 0 };
  }
  function notification(o) {
    o = o || {};
    return notifications({ phone: o.phone, items: [o], x: o.x, y: o.y, width: o.width, scale: o.scale, dark: o.dark, start: o.at === undefined ? 0 : o.at, until: o.until });
  }

  // ---------- prompt box ------------------------------------------------------------
  /**
   * A chat input that types its prompt. text types from typeAt at cps characters a second, a caret
   * follows the last character, and the send button presses when typing finishes.
   */
  function promptBox(o) {
    o = o || {};
    var th = theme(), cv = canvas(), ph = o.phone && o.phone.kind === 'phone' ? o.phone : null;
    var s = ph ? ph.s : (+o.scale || Math.min(cv.width, cv.height) / 720);
    var width = +o.width || (ph ? ph.screen.width - 32 * s : Math.min(cv.width * 0.6, 640 * s));
    var height = +o.height || 56 * s;
    var x = o.x !== undefined ? +o.x : (ph ? ph.screen.x : cv.width / 2);
    var y = o.y !== undefined ? +o.y : (ph ? ph.screen.bottom - 172 * s : cv.height * 0.6);
    var dark = !!o.dark;
    var bg = dark ? '#1c1c1e' : '#ffffff', stroke = dark ? '#3a3a3c' : '#d1d1d6';
    var fg = dark ? '#ffffff' : (contrast(th.text, '#ffffff') >= 4.5 ? th.text : '#111111');
    var fs = +o.fontSize || Math.round(height * 0.31 * 10) / 10;
    var r = Math.min(height / 2, height / 2 * th.radius);
    var list = [];
    if (o.glow !== false) { rect(list, x, y, width + 10 * s, height + 10 * s, r + 5 * s, th.primary, { opacity: 0.16 }); glyphAlpha(list, 0.16); }
    rect(list, x, y + 3 * s, width, height, r, '#000000', { opacity: dark ? 0.35 : 0.08 }); glyphAlpha(list, dark ? 0.35 : 0.08);
    rect(list, x, y, width, height, r, bg, { strokeColor: stroke, strokeWidth: Math.max(1, 1.2 * s) });
    var left = x - width / 2 + height * 0.36;
    if (o.attach !== false) {
      var pr = height * 0.2;
      path(list, left + pr, y, 'M ' + (-pr) + ' ' + (-0.9 * s) + ' L ' + pr + ' ' + (-0.9 * s) + ' L ' + pr + ' ' + (0.9 * s) + ' L ' + (-pr) + ' ' + (0.9 * s) + ' Z M ' + (-0.9 * s) + ' ' + (-pr) + ' L ' + (0.9 * s) + ' ' + (-pr) + ' L ' + (0.9 * s) + ' ' + pr + ' L ' + (-0.9 * s) + ' ' + pr + ' Z', fg, { opacity: 0.55 }); glyphAlpha(list, 0.55);
      left += pr * 2 + height * 0.24;
    }
    var bR = height * 0.36, bX = x + width / 2 - height * 0.14 - bR;
    var textW = bX - bR - 10 * s - left;
    // The whole prompt is typed. A line longer than the field scrolls, as a real input does: the field
    // shows the END of what has been typed behind a leading ellipsis, so no word of the prompt is lost.
    var full = String(o.text || '').slice(0, 400);
    var shown = function (str) {
      if (measure(str, fs, 400, th.body) <= textW) return str;
      var t = str;
      while (t.length > 1 && measure('\u2026' + t, fs, 400, th.body) > textW) t = t.slice(1);
      return '\u2026' + t;
    };
    var placeholder = fit(o.placeholder || 'Ask anything', textW, fs, 400, th.body);
    var typeAt = o.typeAt === undefined ? (+o.at || 0) + 0.8 : +o.typeAt;
    var cps = +o.cps || 22;
    var doneAt = typeAt + full.length / cps;
    var baseList = list;
    var phList = [];
    text(phList, placeholder, left, y, fs, fg, 400, 'left', th.body, { opacity: 0.4 }); glyphAlpha(phList, 0.4);
    var typed = [];
    var typedId = null;
    var caretH = fs * 1.25;
    var caret = [];
    var caretId = rect(caret, left + 1 * s, y, Math.max(1.5, 2 * s), caretH, 1 * s, th.primary);
    var btn = [];
    circle(btn, bX, y, bR, th.primary);
    var a = bR * 0.5, sh = Math.max(1.2, 1.9 * s);
    path(btn, bX, y, 'M 0 ' + (-a) + ' L ' + (a * 0.85) + ' ' + (-a * 0.15) + ' L ' + (a * 0.85 - sh) + ' ' + (-a * 0.15 + sh) + ' L ' + (sh / 2) + ' ' + (-a + sh * 1.6) + ' L ' + (sh / 2) + ' ' + a + ' L ' + (-sh / 2) + ' ' + a + ' L ' + (-sh / 2) + ' ' + (-a + sh * 1.6) + ' L ' + (-a * 0.85 + sh) + ' ' + (-a * 0.15 + sh) + ' L ' + (-a * 0.85) + ' ' + (-a * 0.15) + ' Z', ink(th.primary));

    // TYPING IS A RUN OF PREFIX LINES, each shown for its own instant. One text item stepping its
    // its content was tried first and measured wrong: the engine re-places a text item after a content
    // change (it keeps a captured position, not the left edge), so the line slid left out of the box, and
    // keyframing x did not pin it either. A text created at x with justification 'left' DOES start at x
    // (measured), and a prefix that never changes never moves. Long prompts step two or more characters
    // at a time so a sentence stays a few dozen items.
    var stepN = Math.max(1, Math.ceil(full.length / 48));
    var cuts = [];
    for (var c = stepN; c < full.length; c += stepN) cuts.push(c);
    if (full.length) cuts.push(full.length);
    var EPS = 0.001;
    var endT = o.until !== undefined ? +o.until : null;
    for (var q = 0; q < cuts.length; q++) {
      var one = [];
      typedId = text(one, shown(full.slice(0, cuts[q])), left, y, fs, fg, 400, 'left', th.body);
      typed.push(one[0]);
      var tOn = typeAt + cuts[q] / cps, tOff = q + 1 < cuts.length ? typeAt + cuts[q + 1] / cps : endT;
      var kf = [{ time: 0, properties: { opacity: 0 }, easing: 'linear' }, { time: Math.max(0, tOn - EPS), properties: { opacity: 0 }, easing: 'linear' }, { time: tOn, properties: { opacity: 1 }, easing: 'linear' }];
      if (tOff !== null) {
        var fadeOut = q + 1 < cuts.length ? EPS : 0.4;
        kf.push({ time: tOff, properties: { opacity: 1 }, easing: 'linear' }, { time: tOff + fadeOut, properties: { opacity: 0 }, easing: 'linear' });
      }
      try { P.addAnimation(typedId, kf, { duration: Math.max(kf[kf.length - 1].time, 0.01), loop: false }); } catch (e) {}
      note(kf[kf.length - 1].time);
    }

    // caret: follows the measured end of each prefix, then blinks
    var step = Math.max(1, Math.ceil(full.length / 40));
    var ck = [{ time: 0, properties: { x: left + 1 * s, opacity: o.at ? 0 : 1 } }];
    if (o.at) ck.push({ time: +o.at + 0.4, properties: { x: left + 1 * s, opacity: 1 } });
    if (typeAt > 0) ck.push({ time: typeAt, properties: { x: left + 1 * s, opacity: 1 } });
    for (var c2 = step; c2 <= full.length; c2 += step) ck.push({ time: typeAt + c2 / cps, properties: { x: left + measure(shown(full.slice(0, c2)), fs, 400, th.body) + 2.5 * s, opacity: 1 } });
    var endX = left + measure(shown(full), fs, 400, th.body) + 2.5 * s;
    ck.push({ time: doneAt, properties: { x: endX, opacity: 1 } });
    var blinkUntil = o.until !== undefined ? +o.until : doneAt + (o.blink === undefined ? 2 : +o.blink);
    for (var bt = doneAt + 0.5, on = false; bt < blinkUntil; bt += 0.5, on = !on) ck.push({ time: bt, properties: { x: endX, opacity: on ? 1 : 0 }, easing: 'linear' });
    if (o.until !== undefined) ck.push({ time: +o.until + 0.4, properties: { x: endX, opacity: 0 } });
    try { P.addAnimation(caretId, ck.map(function (k) { k.easing = k.easing || 'linear'; return k; }), { duration: Math.max(ck[ck.length - 1].time, 0.01), loop: false }); } catch (e) {}
    note(ck[ck.length - 1].time);

    // placeholder leaves as the first character lands
    var phKeys = windowKeys(o.at, 0.4, null);
    phKeys.push({ t: Math.max(typeAt, (+o.at || 0) + 0.4), opacity: 1 }, { t: Math.max(typeAt, (+o.at || 0) + 0.4) + 0.12, opacity: 0 });
    if (full.length) animate(phList, phKeys, 'linear'); else settle(phList, o);
    settle(baseList, o);
    // the send button presses when typing finishes
    var press = o.press === false || !full.length ? null : doneAt + 0.35;
    var bk = windowKeys(o.at, 0.4, o.until);
    if (press !== null) {
      if (!bk.length) bk.push({ t: 0, opacity: 1 });
      bk.push({ t: press, opacity: 1, scale: 1 }, { t: press + 0.12, opacity: 1, scale: 0.86 }, { t: press + 0.3, opacity: 1, scale: 1 });
      bk.sort(function (p, q) { return p.t - q.t; });
      for (var z = 0; z < bk.length; z++) if (bk[z].scale === undefined) bk[z].scale = 1;
    }
    if (bk.length) animate(btn, bk);
    play();
    var all = baseList.concat(phList, typed, caret, btn);
    return { kind: 'promptBox', ids: ids(all), textId: typedId, typeAt: typeAt, doneAt: doneAt, pressAt: press,
      x: x, y: y, width: width, height: height, top: y - height / 2, bottom: y + height / 2 };
  }

  // ---------- toggle ----------------------------------------------------------------
  function toggle(o) {
    o = o || {};
    var th = theme(), cv = canvas(), ph = o.phone && o.phone.kind === 'phone' ? o.phone : null;
    var s = ph ? ph.s : (+o.scale || Math.min(cv.width, cv.height) / 720);
    var h = (+o.size || 31) * s, w = h * 51 / 31;
    var x = o.x !== undefined ? +o.x : cv.width / 2, y = o.y !== undefined ? +o.y : cv.height / 2;
    var dark = !!o.dark;
    var onCol = isColour(o.color) ? o.color : (th.branded ? th.accent : '#34c759');
    var offCol = dark ? '#39393d' : '#e9e9eb';
    var startOn = !!o.on, flip = o.switchAt === undefined || o.switchAt === null ? null : +o.switchAt;
    var list = [];
    var labelIds = [];
    if (o.label) {
      var lbl = [];
      text(lbl, o.label, x - w / 2 - 14 * s, y, 17 * s, isColour(o.labelColor) ? o.labelColor : (ph ? ph.ink : (dark ? '#ffffff' : (ground() ? ink(ground()) : th.text))), 500, 'right', th.body);
      labelIds = lbl; list = list.concat(lbl);
    }
    var base = [];
    rect(base, x, y, w, h, h / 2, offCol);
    var onTrack = [];
    rect(onTrack, x, y, w, h, h / 2, onCol);
    var kr = h / 2 - 2 * s, kxOff = x - w / 2 + 2 * s + kr, kxOn = x + w / 2 - 2 * s - kr;
    var knob = [];
    circle(knob, startOn ? kxOn : kxOff, y + 1.5 * s, kr, '#000000', { opacity: 0.16 }); glyphAlpha(knob, 0.16);
    circle(knob, startOn ? kxOn : kxOff, y, kr, '#ffffff');
    var win = windowKeys(o.at, o.fade, o.until);
    if (labelIds.length && win.length) animate(labelIds, win);
    if (win.length) animate(base, win);
    // on-track opacity and knob x, together with the appearance window
    var times = [0];
    win.forEach(function (k) { times.push(k.t); });
    if (flip !== null) times.push(flip, flip + 0.28);
    times = times.filter(function (t, i, a) { return a.indexOf(t) === i; }).sort(function (a, b) { return a - b; });
    var vis = function (t) {
      if (!win.length) return 1;
      var v = win[0].opacity;
      for (var i = 0; i < win.length; i++) if (win[i].t <= t) v = win[i].opacity;
      for (var j = 1; j < win.length; j++) if (t > win[j - 1].t && t < win[j].t) { var f = (t - win[j - 1].t) / (win[j].t - win[j - 1].t); v = win[j - 1].opacity + (win[j].opacity - win[j - 1].opacity) * f; }
      return v;
    };
    var state = function (t) { if (flip === null || t <= flip) return startOn ? 1 : 0; if (t >= flip + 0.28) return startOn ? 0 : 1; return startOn ? 1 - (t - flip) / 0.28 : (t - flip) / 0.28; };
    if (win.length || flip !== null) {
      try { P.addAnimation(onTrack[0].id, times.map(function (t) { return { time: t, properties: { opacity: vis(t) * state(t) }, easing: 'easeInOut' }; }), { duration: Math.max(times[times.length - 1], 0.01), loop: false }); } catch (e) {}
      knob.forEach(function (it) {
        try { P.addAnimation(it.id, times.map(function (t) { return { time: t, properties: { opacity: vis(t) * (it.alpha === undefined ? 1 : it.alpha), x: kxOff + (kxOn - kxOff) * state(t) }, easing: 'easeInOut' }; }), { duration: Math.max(times[times.length - 1], 0.01), loop: false }); } catch (e) {}
      });
      note(times[times.length - 1]);
    } else if (!startOn) {
      try { P.modifyItem(onTrack[0].id, { opacity: 0 }); } catch (e) {}
    }
    play();
    list = list.concat(base, onTrack, knob);
    return { kind: 'toggle', ids: ids(list), on: flip === null ? startOn : !startOn, switchAt: flip, x: x, y: y, width: w, height: h };
  }

  // ---------- calendar card ------------------------------------------------------------
  function calendarCard(o) {
    o = o || {};
    var th = theme(), cv = canvas(), ph = o.phone && o.phone.kind === 'phone' ? o.phone : null;
    var s = ph ? ph.s : (+o.scale || Math.min(cv.width, cv.height) / 720);
    var width = +o.width || (ph ? ph.screen.width - 32 * s : 340 * s);
    var x = o.x !== undefined ? +o.x : (ph ? ph.screen.x : cv.width / 2);
    var events = (o.events || [{ time: '10:00', title: 'Launch review' }, { time: '13:30', title: 'Design sync' }]).slice(0, 5);
    var pad = 18 * s, rowH = 46 * s, headH = 74 * s;
    var h = pad + headH + events.length * rowH + pad * 0.6;
    var top = o.y !== undefined ? +o.y - h / 2 : (ph ? ph.screen.top + 300 * s : cv.height / 2 - h / 2);
    var dark = !!o.dark;
    var bg = dark ? '#1c1c1e' : '#ffffff', fg = dark ? '#ffffff' : '#111111', sub = dark ? '#ebebf5' : '#3c3c43';
    var left = x - width / 2 + pad;
    var list = [];
    rect(list, x, top + h / 2 + 4 * s, width, h, 24 * s * th.radius, '#000000', { opacity: 0.1 }); glyphAlpha(list, 0.1);
    rect(list, x, top + h / 2, width, h, 24 * s * th.radius, bg, { opacity: o.glass ? 0.84 : 1 }); if (o.glass) glyphAlpha(list, 0.84);
    text(list, String(o.day || 'Tuesday').toUpperCase(), left, top + pad + 8 * s, 13 * s, th.primary, 700, 'left', th.body);
    text(list, String(o.date === undefined ? 9 : o.date), left, top + pad + 44 * s, 40 * s, fg, 500, 'left', th.heading);
    if (o.month) { text(list, String(o.month), x + width / 2 - pad, top + pad + 8 * s, 13 * s, sub, 500, 'right', th.body, { opacity: 0.7 }); glyphAlpha(list, 0.7); }
    var colours = [th.primary, th.accent, th.secondary];
    for (var i = 0; i < events.length; i++) {
      var ev = events[i] || {}, ry = top + pad + headH + i * rowH + rowH / 2;
      var col = isColour(ev.color) ? ev.color : colours[i % colours.length];
      rect(list, x, ry, width - pad * 2 + 4 * s, rowH - 8 * s, 8 * s * th.radius, col, { opacity: 0.14 }); glyphAlpha(list, 0.14);
      rect(list, left + 2 * s, ry, 4 * s, rowH - 16 * s, 2 * s, col);
      text(list, fit(ev.title || 'Event', width - pad * 2 - 90 * s, 15 * s, 600, th.body), left + 14 * s, ry - 7 * s, 15 * s, fg, 600, 'left', th.body);
      text(list, String(ev.time || ''), left + 14 * s, ry + 10 * s, 12 * s, sub, 400, 'left', th.body, { opacity: 0.75 }); glyphAlpha(list, 0.75);
    }
    settle(list, o, o.rise === undefined ? (o.at ? 14 * s : 0) : +o.rise);
    return { kind: 'calendarCard', ids: ids(list), x: x, top: top, bottom: top + h, height: h, width: width };
  }

  // ---------- ad card ---------------------------------------------------------------------
  function adCard(o) {
    o = o || {};
    var th = theme(), cv = canvas(), ph = o.phone && o.phone.kind === 'phone' ? o.phone : null;
    var s = ph ? ph.s : (+o.scale || Math.min(cv.width, cv.height) / 720);
    var width = +o.width || (ph ? ph.screen.width - 24 * s : 360 * s);
    var x = o.x !== undefined ? +o.x : (ph ? ph.screen.x : cv.width / 2);
    var pad = 14 * s, headH = 52 * s, mediaH = width * (o.aspect === 'square' ? 1 : 0.75), footH = 64 * s;
    var h = headH + mediaH + footH;
    var top = o.y !== undefined ? +o.y - h / 2 : (ph ? ph.screen.top + 110 * s : cv.height / 2 - h / 2);
    var dark = !!o.dark;
    var bg = dark ? '#1c1c1e' : '#ffffff', fg = dark ? '#ffffff' : '#111111', sub = dark ? '#ebebf5' : '#3c3c43';
    var name = o.brandName || th.name || 'Your Brand';
    var list = [];
    var R = 20 * s * th.radius;
    rect(list, x, top + h / 2 + 5 * s, width, h, R, '#000000', { opacity: 0.12 }); glyphAlpha(list, 0.12);
    rect(list, x, top + h / 2, width, h, R, bg);
    var left = x - width / 2 + pad, av = 32 * s;
    circle(list, left + av / 2, top + headH / 2, av / 2, th.primary);
    text(list, (o.logo || name.charAt(0)).slice(0, 2), left + av / 2, top + headH / 2, 15 * s, ink(th.primary), 700, 'center', th.heading);
    text(list, fit(name, width - av - pad * 3 - 20 * s, 15 * s, 600, th.body), left + av + 10 * s, top + headH / 2 - 8 * s, 15 * s, fg, 600, 'left', th.body);
    text(list, o.sponsored === false ? (o.handle || '') : (o.sponsoredLabel || 'Sponsored'), left + av + 10 * s, top + headH / 2 + 9 * s, 12 * s, sub, 400, 'left', th.body, { opacity: 0.7 }); glyphAlpha(list, 0.7);
    for (var d = 0; d < 3; d++) circle(list, x + width / 2 - pad - 4 * s - d * 6 * s, top + headH / 2, 1.8 * s, sub);
    var mTop = top + headH, mStops = Array.isArray(o.media) ? o.media.filter(isColour) : (isColour(o.media) ? [o.media] : [th.primary, th.secondary]);
    if (!mStops.length) mStops = [th.primary, th.secondary];
    var mFill = mStops.length > 1 ? { gradient: { stops: mStops }, origin: [x - width / 2, mTop], destination: [x + width / 2, mTop + mediaH] } : mStops[0];
    rect(list, x, mTop + mediaH / 2, width, mediaH, 0, mFill);
    var mInk = ink(mStops.length > 1 ? mix(mStops[0], mStops[mStops.length - 1], 0.5) : mStops[0]);
    var hl = wrap(o.headline || 'Meet the new way to work', width - pad * 4, 30 * s, 700, th.heading, 3);
    var hlTop = mTop + mediaH / 2 - (hl.length - 1) * 30 * s * 0.6;
    for (var l = 0; l < hl.length; l++) text(list, hl[l], x, hlTop + l * 30 * s * 1.2, 30 * s, mInk, 700, 'center', th.heading);
    var fy = mTop + mediaH + footH / 2;
    var cta = o.cta || 'Learn more';
    var ctaFs = 14 * s, ctaW = measure(cta, ctaFs, 600, th.body) + 28 * s, ctaH = 34 * s;
    var ctaX = x + width / 2 - pad - ctaW / 2;
    text(list, fit(o.body || name, width - ctaW - pad * 3, 14 * s, 500, th.body), left, fy, 14 * s, fg, 500, 'left', th.body);
    rect(list, ctaX, fy, ctaW, ctaH, Math.min(ctaH / 2, 10 * s * th.radius * 1.7), th.primary);
    text(list, cta, ctaX, fy, ctaFs, ink(th.primary), 600, 'center', th.body);
    settle(list, o, o.rise === undefined ? (o.at ? 18 * s : 0) : +o.rise);
    return { kind: 'adCard', ids: ids(list), x: x, top: top, bottom: top + h, height: h, width: width };
  }

  // ---------- brand -------------------------------------------------------------------------
  /** Set the brand the kit draws in: the brand kit's own shape { name, colors: { primary, secondary,
   *  accent, background, text }, fonts: { heading, body }, radius: 'sharp'|'soft'|'round'|number }. */
  function setBrand(kit) {
    if (kit === null) { brand = null; return theme(); }
    if (kit && typeof kit === 'object') {
      var colours = kit.colors || kit.colours || {};
      if (Array.isArray(colours)) colours = { primary: colours[0], secondary: colours[1], accent: colours[2] };
      brand = { name: kit.name || '', colors: colours, fonts: kit.fonts || {}, radius: kit.radius };
    }
    return theme();
  }
  // A brand kit applied in code also becomes the kit's brand. Wrapped once, and the engine's own
  // behaviour is kept exactly: the wrapper records and then calls through.
  try {
    if (P && typeof P.applyBrandKit === 'function' && !P.applyBrandKit.__uiKit) {
      var orig = P.applyBrandKit;
      var wrapped = function (kit) { try { if (kit && kit.colors && kit.colors.primary) setBrand(kit); } catch (e) {} return orig.apply(this, arguments); };
      wrapped.__uiKit = true;
      P.applyBrandKit = wrapped;
    }
  } catch (e) {}

  return {
    version: '1.0.0',
    brand: setBrand,
    theme: theme,
    duration: function (D) { if (D !== undefined) { minDuration = +D || 0; play(); } return Math.max(minDuration, kitEnd > 0 ? kitEnd + HOLD : 0); },
    phone: phone,
    notifications: notifications,
    notification: notification,
    promptBox: promptBox,
    toggle: toggle,
    calendarCard: calendarCard,
    adCard: adCard
  };
})();
// --- END PINEPAPER UI KIT -----------------------------------------------------------
`;

/** Does this code call the kit without carrying it? */
export function usesUiKit(code: string): boolean {
  const src = String(code ?? "");
  if (!src) return false;
  if (src.includes(UI_KIT_SENTINEL)) return false;
  // Code that defines its own UIKit is left alone: prepending would be shadowed or would shadow.
  if (/(?:var|let|const)\s+UIKit\s*=|function\s+UIKit\s*\(/.test(src)) return false;
  return UI_KIT_SYMBOLS.some((s) => src.includes(s));
}

/** The engine's brand-kit shape, the part the kit reads. */
export interface UiKitBrand {
  name?: string;
  colors?: Record<string, string>;
  fonts?: { heading?: string; body?: string; mono?: string };
  radius?: number | "sharp" | "soft" | "round";
}

const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const FONT = /^[\w \-]{1,60}$/;

/**
 * The one line that tells the kit which brand it is drawing in, built from a scene's brand_kit op.
 * Every value is checked where it enters (this becomes code): colours must be colours, fonts plain
 * family names, and the whole thing travels as JSON.
 */
export function uiKitBrandLine(kit: unknown): string | null {
  if (!kit || typeof kit !== "object") return null;
  const k = kit as UiKitBrand;
  const colors: Record<string, string> = {};
  for (const role of ["primary", "secondary", "accent", "background", "text"]) {
    const v = k.colors?.[role];
    if (typeof v === "string" && COLOUR.test(v.trim())) colors[role] = v.trim();
  }
  if (!colors.primary) return null;
  const fonts: Record<string, string> = {};
  for (const role of ["heading", "body", "mono"] as const) {
    const v = k.fonts?.[role];
    if (typeof v === "string" && FONT.test(v.trim())) fonts[role] = v.trim();
  }
  const out: UiKitBrand = { name: typeof k.name === "string" ? k.name.slice(0, 80) : "", colors, fonts };
  if (typeof k.radius === "number" && Number.isFinite(k.radius)) out.radius = Math.max(0, Math.min(2, k.radius));
  else if (k.radius === "sharp" || k.radius === "soft" || k.radius === "round") out.radius = k.radius;
  const LS = new RegExp(String.fromCharCode(0x2028), "g"), PS = new RegExp(String.fromCharCode(0x2029), "g");
  const json = JSON.stringify(out).replace(/</g, "\\u003c").replace(LS, "\\u2028").replace(PS, "\\u2029");
  return `UIKit.brand(${json});`;
}
