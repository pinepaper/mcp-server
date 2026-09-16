/**
 * pinepaper_world gains the mesh half: a canvas path becomes real geometry.
 *
 * 1.6.8 taught the design graph to RECORD meshProvenance {op, sourceId, opts}
 * for a mesh — while no tool could make one. The graph could describe a thing
 * the surface could not author, which is the same gap this project keeps
 * finding pointed the other way.
 *
 * Engine side: extrudeToMesh / latheToMesh / addWorldLight / addWorldMaterial
 * and friends on FxTool origin/main. Checked against origin/main, not a local
 * branch — a stale ref returns a confident zero.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { World3DInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import type { MeshProvenance } from '../../ontology/types.js';

const gen = (input: Parameters<typeof codeGenerator.generateWorld3D>[0]) =>
  codeGenerator.generateWorld3D(World3DInputSchema.parse(input));

describe('mesh authoring', () => {
  it('extrude and lathe call their own facades and pass the path through', () => {
    const ex = gen({ action: 'extrude_path', pathId: 'item_3', mesh: { depth: 20, caps: true } });
    expect(ex).toContain('app.extrudeToMesh("item_3"');
    expect(ex).toContain('"depth":20');
    expect(ex).toContain('"caps":true');

    const la = gen({ action: 'lathe_path', pathId: 'item_4', mesh: { arc: 180, segments: 24 } });
    expect(la).toContain('app.latheToMesh("item_4"');
    expect(la).toContain('"arc":180');
  });

  it('passes the ENGINE\'s refusal through instead of inventing a second wording', () => {
    // extrudeToMesh returns {ok:false, reason:'no world — call createWorld3D
    // first'} itself. Two different strings for one condition is the defect,
    // not the fix — so the no-world guard is only in front of the facades that
    // THROW (addWorldLight, addWorldMaterial).
    const ex = gen({ action: 'extrude_path', pathId: 'p', mesh: {} });
    expect(ex).toContain('r.reason');
    expect(ex).not.toContain('no 3D world — call');

    const light = gen({ action: 'add_light', light: { intensity: 4 } });
    expect(light).toContain('no 3D world — call');
  });

  it('rotY is RADIANS, and rotYDegrees is folded in before the engine sees it', () => {
    // The value is stored raw and handed to cos()/sin() in the shader with no
    // conversion anywhere on the path — an exception to the degrees convention
    // the rest of this surface follows, and the reason rotYDegrees exists.
    const deg = gen({ action: 'extrude_path', pathId: 'p', mesh: { rotYDegrees: 90 } });
    expect(deg).toContain(`"rotY":${Math.PI / 2}`);
    // Only one of them reaches the engine.
    expect(deg).not.toContain('rotYDegrees');

    // An explicit rotY wins and is passed untouched.
    const rad = gen({ action: 'extrude_path', pathId: 'p', mesh: { rotY: 1.5, rotYDegrees: 90 } });
    expect(rad).toContain('"rotY":1.5');
    expect(rad).not.toContain('rotYDegrees');
  });

  /**
   * THE ROUND TRIP. The engine records the mesh's provenance under exactly the
   * option names this action accepts, so a mesh captured in a design graph is
   * rebuilt by spreading `meshProvenance.opts` straight back into `mesh`. If
   * either side is renamed, a captured scene silently comes back without its
   * meshes — the graph knowing a mesh was here and having no way to make one.
   */
  it('accepts every key the graph records as mesh provenance', () => {
    const opts: Required<MeshProvenance>['opts'] = {
      depth: 20, unitsPerPixel: 0.01, caps: true, segments: 24, arc: 360,
      flatness: 0.2, x: 1, y: 2, z: 3, rotY: 0.5, scale: 2,
    };
    const parsed = World3DInputSchema.parse({ action: 'extrude_path', pathId: 'p', mesh: opts });
    for (const key of Object.keys(opts)) {
      expect(parsed.mesh).toHaveProperty(key);
    }
    const code = gen({ action: 'extrude_path', pathId: 'p', mesh: opts });
    for (const [k, v] of Object.entries(opts)) {
      expect(code).toContain(`"${k}":${JSON.stringify(v)}`);
    }
  });
});

describe('lights and materials', () => {
  it('each action emits its own facade, guarded', () => {
    const cases: Array<[Parameters<typeof gen>[0], string]> = [
      [{ action: 'add_light', light: {} }, 'app.addWorldLight'],
      [{ action: 'set_light', lightId: 'l1', light: { intensity: 2 } }, 'app.setWorldLight'],
      [{ action: 'remove_light', lightId: 'l1' }, 'app.removeWorldLight'],
      [{ action: 'list_lights' }, 'app.listWorldLights'],
      [{ action: 'add_material', material: {} }, 'app.addWorldMaterial'],
      [{ action: 'set_material', materialId: 'm1', material: { roughness: 0.4 } }, 'app.setWorldMaterial'],
      [{ action: 'remove_material', materialId: 'm1' }, 'app.removeWorldMaterial'],
      [{ action: 'list_materials' }, 'app.listWorldMaterials'],
      [{ action: 'list_meshes' }, 'app.listWorldMeshes'],
      [{ action: 'remove_mesh', meshId: 'mesh_1' }, 'app.removeWorldMesh'],
    ];
    for (const [input, call] of cases) {
      const code = gen(input);
      expect(code).toContain(call);
      expect(code).toContain('update FxTool');
    }
  });

  it('reads back the engine\'s `error` key, which is not `reason`', () => {
    // addLight/addMaterial refuse with {ok:false, error}; extrudeToMesh with
    // {ok:false, reason}. Reading the wrong one turns a named refusal — "at
    // most 8 point lights; remove one first" — into undefined.
    expect(gen({ action: 'add_light', light: {} })).toContain('r.error');
    expect(gen({ action: 'add_material', material: {} })).toContain('r.error');
  });

  it('every emitted variant parses as JavaScript', () => {
    const actions: Array<Parameters<typeof gen>[0]> = [
      { action: 'extrude_path', pathId: 'p', mesh: { depth: 1 } },
      { action: 'lathe_path', pathId: 'p', mesh: { arc: 90 } },
      { action: 'list_meshes' }, { action: 'remove_mesh', meshId: 'm' },
      { action: 'add_light', light: {} }, { action: 'set_light', lightId: 'l', light: {} },
      { action: 'remove_light', lightId: 'l' }, { action: 'list_lights' },
      { action: 'add_material', material: {} }, { action: 'set_material', materialId: 'm', material: {} },
      { action: 'remove_material', materialId: 'm' }, { action: 'list_materials' },
    ];
    for (const a of actions) {
      expect(() => new Function(gen(a))).not.toThrow();
    }
  });
});

describe('the schema refuses an incomplete call rather than emitting a broken one', () => {
  it('names the missing field', () => {
    const bad: Array<[Record<string, unknown>, string]> = [
      [{ action: 'extrude_path' }, 'pathId'],
      [{ action: 'lathe_path' }, 'pathId'],
      [{ action: 'remove_mesh' }, 'meshId'],
      [{ action: 'add_light' }, 'light'],
      [{ action: 'set_light', light: {} }, 'lightId'],
      [{ action: 'remove_light' }, 'lightId'],
      [{ action: 'add_material' }, 'material'],
      [{ action: 'set_material', material: {} }, 'materialId'],
      [{ action: 'remove_material' }, 'materialId'],
    ];
    for (const [input, field] of bad) {
      const r = World3DInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
  });
});

describe('the tool stops advertising knobs that reach no pixel', () => {
  it('add_object says metalness and roughness are ignored there', () => {
    // FxTool corrected this in its own vocabulary (74c8dbf9): a plain object is
    // drawn by the prop shader, which declares no such uniform, so a material's
    // metalness on a box is stored, listed and ignored. Our description had
    // been offering them as if they worked.
    // Asserted against the JSON-Schema the client actually receives, not the
    // Zod object — World3DInputSchema is wrapped in refinements and has no
    // .shape, and the served schema is what a model reads anyway.
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_world3d')!;
    const props = (tool.inputSchema as { properties: Record<string, { description?: string }> }).properties;
    expect(props.object.description).toContain('IGNORED');
    expect(props.object.description).toContain('mesh path');
    // And the three knobs FxTool deleted are not offered anywhere on the tool.
    const whole = JSON.stringify(tool.inputSchema);
    for (const gone of ['aoMapIntensity', 'normalScale', 'envMapIntensity']) {
      expect(whole).not.toContain(gone);
    }
    // The radians exception is stated where the field is, not only in prose.
    expect(props.mesh.description).toContain('RADIANS');
  });
});

/**
 * Import and navigation.
 *
 * The interesting guard here is not the facade check. Several of these answer
 * `null` — or 0, for groundHeightAt — when there is NO WORLD, which is
 * indistinguishable from a real answer: ground really can be at height 0, and
 * a ray really can miss. Guarding ahead of the call is what keeps "there is no
 * world" from arriving disguised as a measurement.
 */
describe('import', () => {
  it('both importers are guarded — they THROW without a world', () => {
    for (const [action, fn] of [['import_obj', 'importOBJToWorld'], ['import_gltf', 'importGLTFToWorld']] as const) {
      const code = gen({ action, source: 'x' });
      expect(code).toContain(`app.${fn}(`);
      expect(code).toContain('no 3D world — call');
      expect(code).toContain('update FxTool');
    }
  });

  it('a skinned mesh can be asked what clips it has, and told which to play', () => {
    expect(gen({ action: 'list_mesh_clips', meshId: 'm1' })).toContain('app.listWorldMeshClips("m1")');
    const set = gen({ action: 'set_mesh_clip', meshId: 'm1', clip: 'walk', crossfade: 0.3 });
    expect(set).toContain('app.setWorldMeshClip("m1", "walk", { crossfade: 0.3 })');
  });

  it('omits crossfade when it was not asked for', () => {
    expect(gen({ action: 'set_mesh_clip', meshId: 'm1', clip: 'walk' })).toContain('app.setWorldMeshClip("m1", "walk")');
  });
});

describe('navigation and picking', () => {
  it('guards the facades whose null is ambiguous', () => {
    // ground_height, raycast, dolly, pan, and both projections.
    const ambiguous: Array<Record<string, unknown>> = [
      { action: 'ground_height', point: { x: 1, y: 0, z: 2 } },
      { action: 'raycast', origin: [0, 5, 0], direction: [0, -1, 0] },
      { action: 'dolly_camera', multiplier: 1.5 },
      { action: 'pan_camera', dx: 10, dy: 0 },
      { action: 'world_to_canvas', point: { x: 1, y: 2, z: 3 } },
      { action: 'canvas_to_ground', point: { x: 100, y: 200 } },
    ];
    for (const input of ambiguous) {
      expect(gen(input)).toContain('no 3D world — call');
    }
  });

  it('distinguishes a MISS from the absence of a world', () => {
    // Once the guard has separated them, a null from raycastWorld can only
    // mean the ray hit nothing — so it is reported as a miss, not a failure.
    const code = gen({ action: 'raycast', origin: [0, 5, 0], direction: [0, -1, 0] });
    expect(code).toContain('missed: !hit');
    expect(code).toContain('success: true');
  });

  it('the nav target is validated by the engine and its refusal passed through', () => {
    const code = gen({ action: 'set_nav_target', navTarget: '3d' });
    expect(code).toContain('app.setWorldNavTarget("3d")');
    expect(code).toContain('r.error');
    // The engine accepts exactly '2d' and '3d'; so does the schema.
    expect(World3DInputSchema.safeParse({ action: 'set_nav_target', navTarget: 'vr' }).success).toBe(false);
  });

  it('reads z for a world point and falls back to y for a canvas one', () => {
    // groundHeightAt takes (x, z). A caller passing a canvas-shaped {x, y}
    // means the second number either way, so it is taken rather than refused.
    const code = gen({ action: 'ground_height', point: { x: 1, y: 7 } });
    expect(code).toContain('p.z !== undefined ? p.z : p.y');
  });

  it('every new action parses as JavaScript', () => {
    const actions: Array<Record<string, unknown>> = [
      { action: 'import_obj', source: 'v 0 0 0' },
      { action: 'import_gltf', source: 'https://example.invalid/m.glb' },
      { action: 'list_mesh_clips', meshId: 'm' },
      { action: 'set_mesh_clip', meshId: 'm', clip: 'idle' },
      { action: 'set_nav_target', navTarget: '2d' }, { action: 'get_nav_target' },
      { action: 'ground_height', point: { x: 0, y: 0 } },
      { action: 'raycast', origin: [0, 0, 0], direction: [0, -1, 0] },
      { action: 'dolly_camera', multiplier: 2 }, { action: 'pan_camera', dx: 1, dy: 1 },
      { action: 'world_to_canvas', point: { x: 0, y: 0, z: 0 } },
      { action: 'canvas_to_ground', point: { x: 0, y: 0 } },
    ];
    for (const a of actions) expect(() => new Function(gen(a))).not.toThrow();
  });

  it('refuses an incomplete call by naming the field', () => {
    const bad: Array<[Record<string, unknown>, string]> = [
      [{ action: 'import_obj' }, 'source'],
      [{ action: 'import_gltf' }, 'source'],
      [{ action: 'list_mesh_clips' }, 'meshId'],
      [{ action: 'set_mesh_clip', meshId: 'm' }, 'clip'],
      [{ action: 'set_nav_target' }, 'navTarget'],
      [{ action: 'ground_height' }, 'point'],
      [{ action: 'raycast', origin: [0, 0, 0] }, 'origin'],
      [{ action: 'dolly_camera' }, 'multiplier'],
      [{ action: 'pan_camera', dx: 1 }, 'dx'],
    ];
    for (const [input, field] of bad) {
      const r = World3DInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
  });
});

/**
 * Physics in the world, and the last of the mesh surface.
 *
 * pinepaper_physics is the 2D physicsWorld. This is the 3D one, and it is
 * deliberately narrower: a sphere or capsule under gravity colliding with the
 * terrain, objects, actors and imported meshes. No stacking solver, no joints.
 */
describe('world physics', () => {
  it('each action reaches its own facade and is guarded', () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ action: 'add_body', body: { kind: 'sphere' } }, 'app.addPhysicsBody3D'],
      [{ action: 'fire_projectile', body: { speed: 20 } }, 'app.fireProjectile3D'],
      [{ action: 'remove_body', bodyId: 'b1' }, 'app.removePhysicsBody3D("b1")'],
      [{ action: 'list_bodies' }, 'app.listPhysicsBodies3D()'],
      [{ action: 'step_physics', dt: 0.016 }, 'app.stepPhysics3D(0.016)'],
      [{ action: 'impulse', bodyId: 'b1', vector: [0, 5, 0] }, 'app.applyPhysicsImpulse3D("b1", [0,5,0])'],
      [{ action: 'set_velocity', bodyId: 'b1', vector: [1, 0, 0] }, 'app.setPhysicsVelocity3D("b1", [1,0,0])'],
      [{ action: 'line_of_sight', from: [0, 1, 0], to: [5, 1, 5] }, 'app.worldLineOfSight'],
      [{ action: 'set_mesh_instances', meshId: 'm', instances: [[0, 0, 0, 1, 0, 0]] }, 'app.setWorldMeshInstances'],
    ];
    for (const [input, call] of cases) {
      const code = gen(input);
      expect(code).toContain(call);
      expect(code).toContain('no 3D world — call');
      expect(() => new Function(code)).not.toThrow();
    }
  });

  it('a quiet step and an absent world are not the same answer', () => {
    // stepPhysics3D returns {contacts:[],removed:[]} with no world — which is
    // exactly what a perfectly ordinary quiet step returns. Only the guard
    // separates them, and the comment in the emitted code says so.
    const code = gen({ action: 'step_physics', dt: 0.016 });
    expect(code).toContain('perfectly\n  // ordinary quiet step');
    expect(code).toContain('no 3D world — call');
  });

  it('instance rotation is radians here too, and says so', () => {
    expect(gen({ action: 'set_mesh_instances', meshId: 'm', instances: [[0, 0, 0, 1, 0, 0]] }))
      .toContain('rotY (RADIANS');
  });

  it('refuses an incomplete call by naming the field', () => {
    for (const [input, field] of [
      [{ action: 'add_body' }, 'body'],
      [{ action: 'remove_body' }, 'bodyId'],
      [{ action: 'impulse', bodyId: 'b' }, 'vector'],
      [{ action: 'step_physics' }, 'dt'],
      [{ action: 'line_of_sight', from: [0, 0, 0] }, 'from'],
      [{ action: 'set_mesh_instances', meshId: 'm' }, 'meshId'],
    ] as Array<[Record<string, unknown>, string]>) {
      const r = World3DInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
  });
});
