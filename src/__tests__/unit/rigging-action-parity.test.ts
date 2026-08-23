/**
 * Every rigging action must reach a real engine method.
 *
 * This release adds eighteen actions at once, which is exactly the situation
 * where a published name ends up with nothing behind it. The engine had 26
 * pose methods and the tool exposed 2 — the gap was never that the features
 * did not exist, it was that nothing could name them — and closing a gap that
 * size by hand is how you get an enum member no switch arm handles. An
 * unhandled action does not throw: it falls to the default and returns
 * something that looks like a result.
 *
 * Same shape as FxTool's stitch-reachability test, for the same reason.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RiggingInputSchema, DesignMediumInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';
import { TOOL_TAGS } from '../../tools/toolkits.js';

const SRC = join(import.meta.dir, '../../..');
const GENERATOR = readFileSync(join(SRC, 'src/types/code-generator.ts'), 'utf8');
const HANDLERS = readFileSync(join(SRC, 'src/tools/handlers.ts'), 'utf8');

/** The emitter body for one generate* method, so a case in another tool cannot count. */
function emitterBody(name: string): string {
  const start = GENERATOR.indexOf(`  ${name}(input:`);
  expect(start).toBeGreaterThan(-1);
  const next = GENERATOR.indexOf('\n  generate', start + 10);
  return GENERATOR.slice(start, next === -1 ? GENERATOR.length : next);
}

/** Unwraps a .refine()d schema, whose shape hides one level down. */
const actionsOf = (schema: unknown): string[] => {
  let s = schema as { shape?: Record<string, unknown>; _def?: { schema?: unknown } };
  while (!s.shape && s._def?.schema) s = s._def.schema as typeof s;
  const field = s.shape?.action as { options?: unknown[]; _def?: { values?: unknown[] } };
  const values = field?.options ?? field?._def?.values ?? [];
  return values.map((v) => String(v));
};

describe('pinepaper_rigging — every action is handled', () => {
  const body = emitterBody('generateRigging');
  const actions = actionsOf(RiggingInputSchema);

  it('exposes the pose-motion actions the engine has always had', () => {
    for (const a of ['list_poses', 'load_pose', 'interpolate_poses', 'play_pose_sequence',
      'stop_pose_sequence', 'stitch_poses', 'apply_pose_transition', 'bake_animation']) {
      expect(actions).toContain(a);
    }
  });

  it('every action has a case arm in the emitter', () => {
    const missing = actions.filter((a) => !body.includes(`case '${a}'`));
    expect(missing).toEqual([]);
  });

  it('every case arm is a declared action — no arm for a name nobody can pass', () => {
    const arms = [...body.matchAll(/case '([a-z_]+)':/g)].map((m) => m[1]);
    const orphan = arms.filter((a) => !actions.includes(a));
    expect(orphan).toEqual([]);
  });

  it('the new pose actions call riggingSystem methods, not invented ones', () => {
    // Each of these was checked against RiggingSystem.js before being added.
    const expected: Record<string, string> = {
      list_skeletons: 'R.listSkeletons(',
      list_poses: 'R.listPoses(',
      load_pose: 'R.loadPose(',
      interpolate_poses: 'R.interpolatePoses(',
      play_pose_sequence: 'R.playPoseSequence(',
      stop_pose_sequence: 'R.stopPoseSequence(',
      apply_pose_transition: 'R.applyPoseTransition(',
      move_root: 'R.moveRoot(',
      stop_root_track: 'R.stopRootTrack(',
      add_secondary_motion: 'R.addSecondaryMotion(',
      skin_path: 'R.skinPath(',
      bake_animation: 'R.bakeAnimation(',
      list_shape_keys: 'R.listShapeKeys(',
      load_shape_key: 'R.loadShapeKey(',
    };
    for (const call of Object.values(expected)) expect(body).toContain(call);
  });

  it('every action explains its refusal instead of a bare false', () => {
    // The standard was set for auto_* and bake_animation and then applied to
    // two of thirty-three actions. `success: false` with no `error` is what
    // sends an agent into a retry loop: it cannot tell "wrong id" from "wrong
    // shape" from "nothing to do", so it tries the same call again.
    const bare: string[] = [];
    for (const action of actions) {
      const idx = body.indexOf(`case '${action}'`);
      if (idx < 0) continue;
      let seg = body.slice(idx);
      const nxt = seg.indexOf("case '", 6);
      if (nxt > 0) seg = seg.slice(0, nxt);
      if (/success: !!/.test(seg) && !/error:/.test(seg)) bare.push(action);
    }
    expect(bare).toEqual([]);
  });

  it('each refusal names a precondition rather than restating the failure', () => {
    // "failed" is not a reason. Every message should say what was wrong with
    // the INPUT or the rig, and most point at the action that would fix it.
    const messages = [...body.matchAll(/error: "([^"]{10,})"/g)].map((m) => m[1]);
    expect(messages.length).toBeGreaterThan(15);
    for (const msg of messages) {
      expect(msg.length).toBeGreaterThan(25);
      expect(msg).not.toMatch(/^(failed|error|unknown error)\.?$/i);
    }
    // A good share should route the caller somewhere useful.
    const pointing = messages.filter((m) => /list_\w+|Call \w+|Pass /.test(m));
    expect(pointing.length).toBeGreaterThan(6);
  });

  it('no message carries a backtick — the emitted code is a template literal', () => {
    // Third variant of one trap in a day: a backtick, an apostrophe, or a
    // newline in prose interpolated into generated source is SYNTAX, and the
    // program only fails when the browser tries to run it.
    const messages = [...body.matchAll(/error: "([^"]+)"/g)].map((m) => m[1]);
    for (const msg of messages) expect(msg).not.toContain('`');
  });

  it('stitch_poses goes through the app facade and guards on it', () => {
    // It is the one action not on riggingSystem; an old FxTool must get a
    // stated error rather than a TypeError inside the page.
    expect(body).toContain('app.stitchPoses');
    expect(body).toContain("typeof app.stitchPoses !== 'function'");
  });

  it('the auto_* family maps to the real method names', () => {
    for (const m of ['autoWalk', 'autoBreath', 'autoIdle', 'autoJump']) expect(body).toContain(m);
  });
});

describe('pinepaper_design_medium — declared, handled, described, tagged', () => {
  const body = emitterBody('generateDesignMedium');

  it('every action has a case arm', () => {
    const actions = actionsOf(DesignMediumInputSchema);
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) expect(body).toContain(`case '${a}'`);
  });

  it('refuses gracefully on an FxTool without the medium axis', () => {
    // Three separate guards, because three different facades are involved.
    expect(body).toContain("typeof app.listDesignMedia !== 'function'");
    expect(body).toContain("typeof app.resolveDesignMedium !== 'function'");
    expect(body).toContain("typeof app.applyThreadPainting !== 'function'");
  });

  it('is registered everywhere a tool has to be registered', () => {
    // A tool missing from any ONE of these is invisible in a way that looks
    // like it does not exist rather than like a wiring bug.
    expect(PINEPAPER_TOOLS.some((t) => t.name === 'pinepaper_design_medium')).toBe(true);
    expect(HANDLERS).toContain("case 'pinepaper_design_medium':");
    expect(MINIMAL_DESCRIPTIONS.pinepaper_design_medium).toBeTruthy();
    expect(Object.values(TOOL_TAGS).some((names) => names.includes('pinepaper_design_medium'))).toBe(true);
  });
});
