/**
 * SCC (Scenarist) captions: CEA-608, channel CC1, pop-on, 29.97 fps
 * drop-frame timecode — the broadcast deliverable SRT / VTT are not.
 *
 * Each cue is loaded off screen (RCL, ENM, a preamble address code per row,
 * the text) and swapped on with EOC at its start frame; EDM clears it at its
 * stop unless the next cue swaps on at that frame. 608 carries two bytes a
 * frame, so the load is scheduled to END before the start; when cues are too
 * close for that, a cue goes on late and the result says by how much.
 *
 * Every byte carries odd parity. Control codes are sent twice, which is the
 * convention decoders rely on to survive a dropped pair.
 */

export interface SccCue { start: number; stop: number; text: string }

export interface SccResult {
  text: string;
  cues: number;
  truncated: number;              // cues whose text did not fit 2 x 32
  replacedChars: string[];        // characters outside the 608 character set, dropped
  delayed: Array<{ cue: number; frames: number }>;
}

const FPS = 30000 / 1001;
const COLS = 32;
const ROWS = [14, 15];            // the bottom two rows

/** Odd parity on a 7-bit value. */
export function parity(b: number): number {
  let ones = 0;
  for (let v = b & 0x7f; v; v >>= 1) ones += v & 1;
  return ones % 2 === 1 ? b & 0x7f : (b & 0x7f) | 0x80;
}

const word = (hi: number, lo: number) =>
  parity(hi).toString(16).padStart(2, '0') + parity(lo).toString(16).padStart(2, '0');

const CTRL = {
  RCL: word(0x14, 0x20),  // resume caption loading (pop-on)
  ENM: word(0x14, 0x2e),  // erase non-displayed memory
  EOC: word(0x14, 0x2f),  // end of caption: swap on
  EDM: word(0x14, 0x2c),  // erase displayed memory
};

/** Row → first byte and base second byte of its preamble address code (CC1). */
const PAC_ROW: Record<number, [number, number]> = {
  1: [0x11, 0x40], 2: [0x11, 0x60], 3: [0x12, 0x40], 4: [0x12, 0x60], 5: [0x15, 0x40], 6: [0x15, 0x60],
  7: [0x16, 0x40], 8: [0x16, 0x60], 9: [0x17, 0x40], 10: [0x17, 0x60], 11: [0x10, 0x40], 12: [0x13, 0x40],
  13: [0x13, 0x60], 14: [0x14, 0x40], 15: [0x14, 0x60],
};

/** A PAC placing the cursor at `row`, column `indent` (a multiple of 4), white. */
export function pac(row: number, indent: number): string {
  const [hi, base] = PAC_ROW[row];
  return word(hi, base + 0x10 + (indent / 4) * 2);
}

// The basic 608 set is ASCII except these positions, which hold accented
// letters instead of the ASCII characters.
const BASIC_ACCENTED: Record<string, number> = { 'á': 0x2a, 'é': 0x5c, 'í': 0x5e, 'ó': 0x5f, 'ú': 0x60, 'ç': 0x7b, '÷': 0x7c, 'Ñ': 0x7d, 'ñ': 0x7e };
const ASCII_NOT_IN_608 = new Set(['*', '\\', '^', '_', '`', '{', '|', '}', '~']);

function encodeChar(ch: string, replaced: Set<string>): number | null {
  if (BASIC_ACCENTED[ch] !== undefined) return BASIC_ACCENTED[ch];
  const c = ch.charCodeAt(0);
  if (ch.length === 1 && c >= 0x20 && c < 0x7f && !ASCII_NOT_IN_608.has(ch)) return c;
  // (Typographic quotes, dashes and ellipses were made plain by normalise.)
  replaced.add(ch);
  return null;
}

function normalise(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
}

/** Wrap to at most 2 lines of 32; `truncated` when it did not fit. */
export function wrap(text: string): { lines: string[]; truncated: boolean } {
  const lines: string[] = [];
  let truncated = false;
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const w of normalise(para).split(' ')) {
      if (!w) continue;
      const next = line ? `${line} ${w}` : w;
      if (next.length <= COLS) { line = next; continue; }
      if (line) lines.push(line);
      line = w.length > COLS ? (truncated = true, w.slice(0, COLS)) : w;
    }
    if (line) lines.push(line);
  }
  if (lines.length > ROWS.length) { truncated = true; lines.length = ROWS.length; }
  return { lines, truncated };
}

/** Frame count at 29.97 → drop-frame timecode HH:MM:SS;FF. */
export function dropFrameTimecode(frame: number): string {
  const D = Math.floor(frame / 17982);
  const M = frame % 17982;
  const f = frame + 18 * D + (M < 2 ? 0 : 2 * Math.floor((M - 2) / 1798));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(f / 108000))}:${p(Math.floor(f / 1800) % 60)}:${p(Math.floor(f / 30) % 60)};${p(f % 30)}`;
}

export function buildScc(cues: SccCue[]): SccResult {
  const replaced = new Set<string>();
  let truncated = 0;
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  const out: string[] = [];
  const delayed: Array<{ cue: number; frames: number }> = [];
  let cursor = 0; // the first frame free for the next word (one word a frame)
  const emit = (want: number, words: string[]): number => {
    const at = Math.max(want, cursor, 0);
    out.push(`${dropFrameTimecode(at)}\t${words.join(' ')}`);
    cursor = at + words.length;
    return at;
  };
  // A cue's clear waits for the next cue: it is skipped when that cue swaps on
  // at (or before) the stop, since the swap replaces it.
  let pendingClear: number | null = null;

  sorted.forEach((c, i) => {
    const { lines, truncated: cut } = wrap(c.text);
    if (cut) truncated++;
    const words = [CTRL.RCL, CTRL.RCL, CTRL.ENM, CTRL.ENM];
    const rows = ROWS.slice(ROWS.length - lines.length);
    lines.forEach((line, li) => {
      const bytes: number[] = [];
      for (const ch of line) { const b = encodeChar(ch, replaced); if (b !== null) bytes.push(b); }
      const col = Math.max(0, Math.floor((COLS - bytes.length) / 2));
      const indent = col - (col % 4);
      const p = pac(rows[li], indent);
      words.push(p, p);
      if (col % 4) { const t = word(0x17, 0x20 + (col % 4)); words.push(t, t); } // tab offset 1-3
      for (let k = 0; k < bytes.length; k += 2) {
        words.push(parity(bytes[k]).toString(16).padStart(2, '0') + parity(bytes[k + 1] ?? 0x00).toString(16).padStart(2, '0'));
      }
    });
    const startF = Math.round(c.start * FPS);
    const stopF = Math.max(startF + 1, Math.round(c.stop * FPS));
    const loadWant = startF - words.length;

    // The previous cue's clear and this cue's load, in time order. Loading
    // goes to off-screen memory, so it may run while the previous cue shows;
    // both come before this cue's swap.
    // The clear lands ON the stop frame: the next load goes before it when it
    // fits (loading is off screen, so it may run while this cue shows), and
    // otherwise after it — never over it, which held cues on screen until the
    // next load finished (half a second late).
    // When the clear falls inside the load, the load is split around it: EDM
    // erases only the DISPLAYED caption, so it is valid mid-load.
    if (pendingClear !== null && pendingClear < startF) {
      const EDM2 = [CTRL.EDM, CTRL.EDM];
      if (Math.max(cursor, 0) + words.length <= pendingClear) {
        emit(Math.max(cursor, pendingClear - words.length), words);
        emit(pendingClear, EDM2);
      } else {
        const s0 = Math.max(cursor, startF - words.length - EDM2.length, 0);
        if (s0 >= pendingClear) { emit(pendingClear, EDM2); emit(loadWant, words); }
        else {
          const k = pendingClear - s0;
          emit(s0, words.slice(0, k));
          emit(pendingClear, EDM2);
          emit(cursor, words.slice(k));
        }
      }
    } else {
      emit(loadWant, words);
    }
    const shownAt = emit(startF, [CTRL.EOC, CTRL.EOC]);
    if (shownAt > startF) delayed.push({ cue: i, frames: shownAt - startF });
    pendingClear = stopF;
  });
  if (pendingClear !== null) emit(pendingClear, [CTRL.EDM, CTRL.EDM]);

  return {
    text: `Scenarist_SCC V1.0\n\n${out.join('\n\n')}\n`,
    cues: sorted.length,
    truncated,
    replacedChars: [...replaced],
    delayed,
  };
}
