import { codeGenerator } from './types/code-generator.js';

const KITCHEN_SINK: Record<string, unknown> = {
  action: 'create', itemType: 'rectangle', id: 'item_1', itemId: 'item_1', itemIds: ['item_1', 'item_2'],
  name: 'thing', templateId: 'hero', url: 'https://example.com/a.png', text: 'hi', content: 'hi',
  position: { x: 10, y: 20 }, properties: { width: 10, height: 10 }, width: 100, height: 50,
  format: 'png', platform: 'auto', duration: 5, seconds: 1, at: { x: 1, y: 2 },
  regions: ['fr'], coords: [[0, 0], [1, 1]], mapId: 'world', operations: [], items: [],
  relationType: 'follows', sourceId: 'item_1', targetId: 'item_2', effectType: 'glow',
  generatorName: 'drawSunburst', shapeType: 'terminal', label: 'Start', code: 'app.create("circle",{})',
  color: '#fff', easing: 'linear', keyframes: [], exportId: 'exp_1', query: 'x', skeletonId: 'skeleton_1',
};

const proto = Object.getPrototypeOf(codeGenerator) as Record<string, unknown>;
const names = Object.getOwnPropertyNames(proto).filter((n) => /^generate[A-Z]/.test(n));

let produced = 0, failedGen = 0; const syntaxErrors: string[] = [];
for (const n of names) {
  const fn = (codeGenerator as unknown as Record<string, (a: unknown) => string>)[n];
  let code: string | undefined;
  try { code = fn.call(codeGenerator, KITCHEN_SINK); } catch { failedGen++; continue; }
  if (typeof code !== 'string' || !code.trim()) { failedGen++; continue; }
  produced++;
  try { new Function(`return (function(app, paper, document, window){ ${code} });`); }
  catch (e) { syntaxErrors.push(`${n}: ${(e as Error).message}`); }
}
console.log(`generators: ${names.length}  produced code: ${produced}  input-rejected: ${failedGen}`);
console.log(`SYNTAX ERRORS: ${syntaxErrors.length}`);
for (const s of syntaxErrors) console.log('  ' + s);
