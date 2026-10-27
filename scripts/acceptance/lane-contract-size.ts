/**
 * T-9: the size of the contract an agent must load to use the agent lane — the server instructions plus the five
 * tools exactly as tools/list sends them (name, annotations, description, input schema).
 *
 *   bun scripts/acceptance/lane-contract-size.ts [--write <file>]
 *
 * Prints bytes and est. tokens (bytes / 4, the tier study's convention). --write saves the contract text so a real
 * tokenizer can count it.
 */
import { writeFileSync } from 'node:fs';
import { PINEPAPER_TOOLS } from '../../src/tools/definitions.js';
import { getToolsForToolkit } from '../../src/tools/toolkits.js';
import { LANE_INSTRUCTIONS } from '../../src/tools/lane.js';

const tools = getToolsForToolkit(PINEPAPER_TOOLS, 'lane');
const rows = tools.map((t) => ({ name: t.name, bytes: Buffer.byteLength(JSON.stringify(t), 'utf8') }));
const instr = Buffer.byteLength(LANE_INSTRUCTIONS, 'utf8');
const contract = LANE_INSTRUCTIONS + '\n' + JSON.stringify(tools);
const total = Buffer.byteLength(contract, 'utf8');
for (const r of rows) console.log(`${r.name.padEnd(32)} ${String(r.bytes).padStart(6)} B  ~${Math.round(r.bytes / 4)} tok`);
console.log(`${'instructions'.padEnd(32)} ${String(instr).padStart(6)} B  ~${Math.round(instr / 4)} tok`);
console.log(`${'TOTAL (tools + instructions)'.padEnd(32)} ${String(total).padStart(6)} B  ~${Math.round(total / 4)} tok (budget 10,000)`);
const full = Buffer.byteLength(JSON.stringify(getToolsForToolkit(PINEPAPER_TOOLS, 'agent')), 'utf8');
console.log(`for comparison, the default 'agent' profile's tools: ${full} B ~${Math.round(full / 4)} tok`);
const i = process.argv.indexOf('--write');
if (i > 0 && process.argv[i + 1]) writeFileSync(process.argv[i + 1], contract);
