/**
 * Batch ops are passthrough, so the published-schema walk cannot see a key nothing reads; batchOpIgnoredPaths names
 * it. This holds that check honest: every op key the batch code reads is in AgentBatchOperationSchema or
 * BATCH_OP_HIDDEN (a working key is never called ignored), and every BATCH_OP_HIDDEN entry is still read (shrink-only).
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AgentBatchOperationSchema } from '../../types/schemas.js';
import { BATCH_OP_HIDDEN, batchOpIgnoredPaths } from '../../tools/handlers.js';

const root = join(import.meta.dir, '..', '..');
const gen = readFileSync(join(root, 'types', 'code-generator.ts'), 'utf8');
const start = gen.indexOf('generateAgentBatchExecute(');
const sources = [
  gen.slice(start, gen.indexOf('\n  generate', gen.indexOf('private generateBatchOperationCode', start) + 40)),
  readFileSync(join(root, 'tools', 'batch-macros.ts'), 'utf8'),
  readFileSync(join(root, 'tools', 'timeline.ts'), 'utf8'),
].join('\n');

const READ = /\bop\.([A-Za-z_]\w*)|\(op as any\)\.([A-Za-z_]\w*)|\bo\.(itemId|targetId|sourceId|id|_step)\b|\(op as any\)\[key\]/g;
const read = new Set<string>();
for (const m of sources.matchAll(READ)) { const k = m[1] ?? m[2] ?? m[3]; if (k) read.add(k); }
// The dynamic `(op as any)[key]` loop reads these.
['timeOffset', 'clipInPoint', 'clipOutPoint'].forEach((k) => read.add(k));
const hidden = new Set(Object.values(BATCH_OP_HIDDEN).flat());
const shape = new Set(Object.keys(AgentBatchOperationSchema.shape));

describe('batch op keys', () => {
  it('every key the batch reads is published or hidden', () => {
    const unknown = [...read].filter((k) => !shape.has(k) && !hidden.has(k) && !['type'].includes(k));
    expect(unknown).toEqual([]);
  });

  it('every hidden key is still read', () => {
    expect([...hidden].filter((k) => !read.has(k))).toEqual([]);
  });

  it('names a key a non-create op does not read, with the hint for the usual slip', () => {
    expect(batchOpIgnoredPaths({ operations: [
      { type: 'create', itemType: 'circle', radius: 4 },
      { type: 'modify', itemId: 'a', properties: {}, opacity: 0.5 },
      { type: 'relation', sourceId: 'a', targetId: 'b', relationType: 'orbits', params: { radius: 3 } },
      { type: 'keyframe_animate', itemId: 'a', keyframes: [], timeOffset: 1 },
    ] })).toEqual(['operations[1].opacity', 'operations[2].params (a relation op takes its parameters as relationOptions)']);
  });
});
