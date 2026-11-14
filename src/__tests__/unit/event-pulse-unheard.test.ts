/**
 * A pulse of an id no event has returned success:true (tester, 1.6.36). An event's channel is its id; a literal
 * name is a channel only where a rule or relation listens on it. A pulse nothing hears now fails and says why.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { EventInputSchema } from '../../types/schemas.js';

const pulse = (eventId: string, app: Record<string, unknown>) => {
  const code = codeGenerator.generateEvent(EventInputSchema.parse({ action: 'pulse', eventId }));
  return new Function('app', `return ${code.split('\n').filter((l) => !l.startsWith('//')).join('\n').trim().replace(/;\s*$/, '')}`)(app);
};
const studio = (events: Array<{ id: string; name: string }>, extra: Record<string, unknown> = {}) => {
  const fired: string[] = [];
  return { fired, app: { pulseEvent: (id: string) => fired.push(id), itemRegistry: { getAll: () => events.map((e) => ({ id: e.id, item: { data: { isEvent: true, eventName: e.name } } })) }, ...extra } };
};

describe('pulse', () => {
  it('an event id fires', () => {
    const s = studio([{ id: 'item_4', name: 'done' }]);
    expect(pulse('item_4', s.app).success).toBe(true);
    expect(s.fired).toEqual(['item_4']);
  });

  it('an id nothing has and nothing hears fails, fires nothing, and names the event when it is a name', () => {
    const s = studio([{ id: 'item_4', name: 'done' }]);
    const r = pulse('done', s.app);
    expect(r.success).toBe(false);
    expect(r.code).toBe('event_not_found');
    expect(r.error).toContain('"done" is the name of event item_4: pulse its id.');
    expect(s.fired).toEqual([]);
    expect(pulse('nope', s.app).error).toContain('Create the event first');
  });

  it('a literal channel a contraption listens on still fires', () => {
    const s = studio([], { listContraptions: () => [{ id: 'c1', sourceEvent: 'go' }] });
    expect(pulse('go', s.app).success).toBe(true);
    expect(s.fired).toEqual(['go']);
  });
});
