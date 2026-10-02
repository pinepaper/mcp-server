/**
 * D36: through the cloud connector, canvas tools read as "returned code
 * instead of executing". The hosted service DOES run them (it records each
 * call and replays it at render), but every result said "Generated PinePaper
 * code" with a script to paste. A host that defers execution passes
 * `deferred: true`; the code travels in _meta for it to record either way.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall, CODE_META_KEY } from '../../tools/handlers.js';

const args = { itemType: 'circle', properties: { x: 10, y: 10, radius: 5 } };

describe('results for a host that runs the code later', () => {
  it('default: unchanged text (the cloud still parses the fenced code), plus the code in _meta', async () => {
    const r: any = await handleToolCall('pinepaper_create_item', args, { executeInBrowser: false });
    expect(r.content[0].text).toContain('```javascript');
    expect(typeof r._meta?.[CODE_META_KEY]).toBe('string');
  });

  it('deferred: the agent is told the step was recorded; no script, no paste instructions', async () => {
    const r: any = await handleToolCall('pinepaper_create_item', args, { executeInBrowser: false, deferred: true });
    const text = r.content.map((c: any) => c.text).join('\n');
    expect(text).toContain('"status": "recorded"');
    expect(text).not.toContain('```');
    expect(text.toLowerCase()).not.toContain('paste');
    expect(r._meta[CODE_META_KEY]).toContain('app.');
  });
});
