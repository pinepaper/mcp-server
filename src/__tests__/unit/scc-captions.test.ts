/**
 * SCC / CEA-608 captions (8.37). Expected bytes are from the 608 tables and
 * worked by hand, not from the encoder — a mirror of the encoder would agree
 * with itself.
 */
import { describe, it, expect } from 'bun:test';
import { parity, pac, dropFrameTimecode, wrap, buildScc } from '../../utils/scc.js';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

describe('608 bytes', () => {
  it('odd parity', () => {
    expect(parity(0x14)).toBe(0x94); // 00010100: two ones → set bit 7
    expect(parity(0x20)).toBe(0x20); // one one → already odd
    expect(parity(0x41)).toBe(0xc1); // 'A'
    expect(parity(0x45)).toBe(0x45); // 'E': three ones
    expect(parity(0x00)).toBe(0x80); // padding null
  });

  it('preamble address codes for the bottom rows, column 0 and indented', () => {
    expect(pac(15, 0)).toBe('9470');
    expect(pac(14, 0)).toBe('94d0');
    expect(pac(15, 8)).toBe('94f4'); // indent 8: 0x60 + 0x10 + 4 = 0x74, four ones → parity sets bit 7
  });

  it('29.97 drop-frame timecode skips frames 0 and 1 of each minute except every tenth', () => {
    expect(dropFrameTimecode(29)).toBe('00:00:00;29');
    expect(dropFrameTimecode(30)).toBe('00:00:01;00');
    expect(dropFrameTimecode(1799)).toBe('00:00:59;29');
    expect(dropFrameTimecode(1800)).toBe('00:01:00;02');
    expect(dropFrameTimecode(17982)).toBe('00:10:00;00');
    expect(dropFrameTimecode(107892)).toBe('01:00:00;00');
  });

  it('wraps to two rows of 32 and says when it cut', () => {
    expect(wrap('Hello world')).toEqual({ lines: ['Hello world'], truncated: false });
    const long = wrap('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen');
    expect(long.lines).toHaveLength(2);
    expect(long.lines.every((l) => l.length <= 32)).toBe(true);
    expect(long.truncated).toBe(true);
  });
});

describe('buildScc', () => {
  it('a cue: header, load ending before its start, EOC on the start frame, EDM at the stop', () => {
    const r = buildScc([{ start: 2, stop: 4, text: 'HELLO' }]);
    const lines = r.text.trim().split('\n\n');
    expect(lines[0]).toBe('Scenarist_SCC V1.0');
    const load = lines[1].split('\t');
    // RCL RCL ENM ENM, row-15 PAC twice, a tab offset (col 13 = indent 12 + 1), then HE LL O+pad
    expect(load[1]).toBe('9420 9420 94ae 94ae 9476 9476 97a1 97a1 c845 4c4c 4f80');
    expect(lines[2]).toBe('00:00:02;00\t942f 942f');   // frame round(2 * 29.97) = 60
    expect(lines[3]).toBe('00:00:04;00\t942c 942c');   // frame round(4 * 29.97) = 120; no drop inside the first minute
    expect(r.delayed).toEqual([]);
  });

  it('back-to-back cues swap without a clear, and never load over a caption not yet shown', () => {
    const r = buildScc([{ start: 1, stop: 2, text: 'A' }, { start: 2, stop: 3, text: 'B' }]);
    const words = r.text.split('\n\n').slice(1).map((l) => l.split('\t')[1]);
    // EOC for cue 1 comes before cue 2's RCL / ENM.
    const eoc1 = words.findIndex((w) => w.startsWith('942f'));
    const load2 = words.findIndex((w, i) => i > eoc1 && w.startsWith('9420'));
    expect(eoc1).toBeGreaterThan(-1);
    expect(load2).toBeGreaterThan(eoc1);
    // Cue 1's stop equals cue 2's start: no EDM between them.
    expect(words.slice(eoc1, load2 + 2).some((w) => w.startsWith('942c'))).toBe(false);
  });

  it('a cue at 0 cannot be loaded in time and says so; out-of-set characters are named', () => {
    const r = buildScc([{ start: 0, stop: 1, text: 'Price * {x}' }]);
    expect(r.delayed[0].cue).toBe(0);
    expect(r.replacedChars.sort()).toEqual(['*', '{', '}'].sort());
  });

  it('accented letters use their 608 codes', () => {
    const r = buildScc([{ start: 5, stop: 6, text: 'é' }]);
    expect(r.text).toContain('dc80'); // é = 0x5C, parity → 0xDC, padded
  });
});

describe('scc through the export tool', () => {
  it('the page returns the cues; the schema accepts scc', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'scc' }).success).toBe(true);
    const code = codeGenerator.generateAgentExport({ format: 'scc' } as never);
    expect(code).toContain('sccCues: cues');
  });
});
