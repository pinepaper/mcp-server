/**
 * Caller-supplied connector IDs.
 *
 * `pinepaper_update_connector` and `pinepaper_remove_connector` address a
 * connector by `connectorId`, and until this parameter existed there was no
 * value a caller could correctly pass: creation returns generated code rather
 * than an executed result, and the engine's own fallback is
 * `connector_${Date.now()}_${random}` — unpredictable, and different on every
 * run of the same scene.
 *
 * The engine already honours it (`Connector.js`: `config.id || <generated>`),
 * so the only missing link was this package not forwarding it.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator';
import { ConnectInputSchema, ConnectPortsInputSchema } from '../../types/schemas';

describe('connect accepts an id', () => {
  it('forwards it into the config the engine reads', () => {
    const code = codeGenerator.generateConnect({
      sourceItemId: 'a', targetItemId: 'b', id: 'a-to-b',
    } as never);
    expect(code).toContain('"id": "a-to-b"');
  });

  it('omits the key entirely when no id is given', () => {
    // The engine's fallback must stay reachable — passing `undefined` would
    // overwrite it with nothing and leave the connector unaddressable.
    const code = codeGenerator.generateConnect({ sourceItemId: 'a', targetItemId: 'b' } as never);
    expect(code).not.toContain('"id"');
  });

  it('is optional in the schema, so existing callers are unaffected', () => {
    expect(ConnectInputSchema.safeParse({ sourceItemId: 'a', targetItemId: 'b' }).success).toBe(true);
    expect(ConnectInputSchema.safeParse({ sourceItemId: 'a', targetItemId: 'b', id: 'x' }).success).toBe(true);
  });
});

describe('connect_ports accepts an id', () => {
  const base = { sourceItemId: 'a', sourcePort: 'right', targetItemId: 'b', targetPort: 'left' };

  it('MERGES it into the nested config rather than requiring callers to nest it', () => {
    // `id` sits at the top level of the tool's input because it is not a style
    // option, but the engine reads it from the config object.
    const code = codeGenerator.generateConnectPorts({ ...base, id: 'p1' } as never);
    expect(code).toContain('"id": "p1"');
  });

  it("keeps the caller's other config when merging", () => {
    const code = codeGenerator.generateConnectPorts({
      ...base, id: 'p1', config: { lineColor: '#ff0000' },
    } as never);
    expect(code).toContain('"id": "p1"');
    expect(code).toContain('"lineColor": "#ff0000"');
  });

  it('is optional here too', () => {
    expect(ConnectPortsInputSchema.safeParse(base).success).toBe(true);
  });
});
