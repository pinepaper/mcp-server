/**
 * The duration scale, vendored as VALUES rather than as the module that derives
 * them. `character-perform` needs exactly this array and nothing else from
 * mcp-cloud's `motion-design-tokens.ts`, which also carries the prompt prose
 * and the token JSON — importing it whole would pull a design-system document
 * into an MCP server to read seven numbers.
 *
 * Vendored from mcp-cloud/src/data/motion-design-tokens.json @ a3557b7
 * (the `ms` field of each duration token, ascending). Guarded against drift by
 * src/__tests__/unit/character-vendor-parity.test.ts.
 */
export const DURATION_SCALE_MS: number[] = [100, 150, 200, 300, 400, 500, 800];
