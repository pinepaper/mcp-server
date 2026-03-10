/**
 * Scene Manager MCP Tools Tests
 *
 * Tests for ManageScenesInputSchema, ScenePlaybackInputSchema,
 * and their corresponding code generators.
 */

import { describe, it, expect } from 'bun:test';
import {
  ManageScenesInputSchema,
  ScenePlaybackInputSchema,
} from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { TOOL_TAGS } from '../../tools/toolkits.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';

// =============================================================================
// SCHEMA VALIDATION — ManageScenesInputSchema
// =============================================================================

describe('ManageScenesInputSchema', () => {
  it('accepts save with name', () => {
    const result = ManageScenesInputSchema.parse({ action: 'save', name: 'Intro' });
    expect(result.action).toBe('save');
    expect(result.name).toBe('Intro');
  });

  it('accepts load with sceneId and transition', () => {
    const result = ManageScenesInputSchema.parse({ action: 'load', sceneId: 'scene_1', transition: 'fade' });
    expect(result.action).toBe('load');
    expect(result.sceneId).toBe('scene_1');
    expect(result.transition).toBe('fade');
  });

  it('accepts list with no extra params', () => {
    const result = ManageScenesInputSchema.parse({ action: 'list' });
    expect(result.action).toBe('list');
  });

  it('accepts delete with sceneId', () => {
    const result = ManageScenesInputSchema.parse({ action: 'delete', sceneId: 'scene_1' });
    expect(result.action).toBe('delete');
  });

  it('accepts rename with sceneId and name', () => {
    const result = ManageScenesInputSchema.parse({ action: 'rename', sceneId: 'scene_1', name: 'New Name' });
    expect(result.action).toBe('rename');
  });

  it('accepts reorder with sceneIds', () => {
    const result = ManageScenesInputSchema.parse({ action: 'reorder', sceneIds: ['s3', 's1', 's2'] });
    expect(result.action).toBe('reorder');
    expect(result.sceneIds).toEqual(['s3', 's1', 's2']);
  });

  it('accepts import with scenesJson and merge', () => {
    const result = ManageScenesInputSchema.parse({ action: 'import', scenesJson: '{}', merge: true });
    expect(result.action).toBe('import');
    expect(result.merge).toBe(true);
  });

  it('accepts all 10 valid actions', () => {
    const actions = ['save', 'load', 'list', 'delete', 'rename', 'duplicate', 'reorder', 'info', 'export', 'import'] as const;
    for (const action of actions) {
      expect(() => ManageScenesInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('rejects invalid action', () => {
    expect(() => ManageScenesInputSchema.parse({ action: 'destroy' })).toThrow();
  });

  it('rejects invalid transition', () => {
    expect(() => ManageScenesInputSchema.parse({ action: 'load', sceneId: 's1', transition: 'slide' })).toThrow();
  });
});

// =============================================================================
// SCHEMA VALIDATION — ScenePlaybackInputSchema
// =============================================================================

describe('ScenePlaybackInputSchema', () => {
  it('accepts create_chain with all options', () => {
    const result = ScenePlaybackInputSchema.parse({
      action: 'create_chain',
      sceneIds: ['s1', 's2', 's3'],
      loop: true,
      autoPlay: false,
      defaultDuration: 5,
      defaultTransition: 'fade',
      transitionDuration: 1.5,
    });
    expect(result.action).toBe('create_chain');
    expect(result.sceneIds).toEqual(['s1', 's2', 's3']);
    expect(result.loop).toBe(true);
    expect(result.defaultDuration).toBe(5);
  });

  it('accepts simple play/pause/stop/resume', () => {
    for (const action of ['play', 'pause', 'stop', 'resume'] as const) {
      const result = ScenePlaybackInputSchema.parse({ action });
      expect(result.action).toBe(action);
    }
  });

  it('accepts jump with index', () => {
    const result = ScenePlaybackInputSchema.parse({ action: 'jump', index: 2 });
    expect(result.action).toBe('jump');
    expect(result.index).toBe(2);
  });

  it('accepts toggle_loop with enabled', () => {
    const result = ScenePlaybackInputSchema.parse({ action: 'toggle_loop', enabled: false });
    expect(result.action).toBe('toggle_loop');
    expect(result.enabled).toBe(false);
  });

  it('accepts all 7 valid actions', () => {
    const actions = ['create_chain', 'play', 'pause', 'resume', 'stop', 'toggle_loop', 'jump'] as const;
    for (const action of actions) {
      expect(() => ScenePlaybackInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('rejects invalid action', () => {
    expect(() => ScenePlaybackInputSchema.parse({ action: 'rewind' })).toThrow();
  });
});

// =============================================================================
// CODE GENERATOR — generateManageScenes
// =============================================================================

describe('generateManageScenes', () => {
  it('save produces async IIFE with saveCurrentAsScene', () => {
    const code = codeGenerator.generateManageScenes({ action: 'save', name: 'My Scene' });
    expect(code).toContain('async function');
    expect(code).toContain("app.sceneManager.saveCurrentAsScene");
    expect(code).toContain('My Scene');
  });

  it('load produces async IIFE with loadScene and transition', () => {
    const code = codeGenerator.generateManageScenes({ action: 'load', sceneId: 's1', transition: 'fade' });
    expect(code).toContain('async function');
    expect(code).toContain("app.sceneManager.loadScene");
    expect(code).toContain('s1');
    expect(code).toContain('fade');
  });

  it('list produces sync IIFE with listScenes', () => {
    const code = codeGenerator.generateManageScenes({ action: 'list' });
    expect(code).not.toContain('async function');
    expect(code).toContain('app.sceneManager.listScenes()');
  });

  it('delete produces sync IIFE with deleteScene', () => {
    const code = codeGenerator.generateManageScenes({ action: 'delete', sceneId: 'scene_x' });
    expect(code).toContain('app.sceneManager.deleteScene');
    expect(code).toContain('scene_x');
  });

  it('rename produces sync IIFE with renameScene', () => {
    const code = codeGenerator.generateManageScenes({ action: 'rename', sceneId: 's1', name: 'Updated' });
    expect(code).toContain('app.sceneManager.renameScene');
    expect(code).toContain('Updated');
  });

  it('duplicate produces sync IIFE with duplicateScene', () => {
    const code = codeGenerator.generateManageScenes({ action: 'duplicate', sceneId: 's1' });
    expect(code).toContain('app.sceneManager.duplicateScene');
  });

  it('reorder produces sync IIFE with reorderScenes', () => {
    const code = codeGenerator.generateManageScenes({ action: 'reorder', sceneIds: ['s3', 's1', 's2'] });
    expect(code).toContain('app.sceneManager.reorderScenes');
    expect(code).toContain('s3');
  });

  it('info produces sync IIFE with getScene', () => {
    const code = codeGenerator.generateManageScenes({ action: 'info', sceneId: 's1' });
    expect(code).toContain('app.sceneManager.getScene');
  });

  it('export produces sync IIFE with exportScenes', () => {
    const code = codeGenerator.generateManageScenes({ action: 'export' });
    expect(code).toContain('app.sceneManager.exportScenes()');
  });

  it('import produces sync IIFE with importScenes and merge option', () => {
    const code = codeGenerator.generateManageScenes({ action: 'import', scenesJson: '{"scenes":[]}', merge: true });
    expect(code).toContain('app.sceneManager.importScenes');
    expect(code).toContain('merge: true');
  });

  it('all actions include SceneManager guard', () => {
    const actions = ['save', 'load', 'list', 'delete', 'rename', 'duplicate', 'reorder', 'info', 'export', 'import'] as const;
    for (const action of actions) {
      const code = codeGenerator.generateManageScenes({ action, name: 'test', sceneId: 'test', sceneIds: ['a'], scenesJson: '{}' });
      expect(code).toContain("if (!app.sceneManager)");
    }
  });
});

// =============================================================================
// CODE GENERATOR — generateScenePlayback
// =============================================================================

describe('generateScenePlayback', () => {
  it('create_chain produces sync IIFE with createChain', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'create_chain', sceneIds: ['s1', 's2'] });
    expect(code).not.toContain('async function');
    expect(code).toContain('app.sceneManager.createChain');
    expect(code).toContain('s1');
  });

  it('create_chain converts defaultDuration from seconds to ms', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'create_chain', sceneIds: ['s1'], defaultDuration: 5 });
    expect(code).toContain('defaultDuration: 5000');
  });

  it('create_chain converts transitionDuration from seconds to ms', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'create_chain', sceneIds: ['s1'], transitionDuration: 1.5 });
    expect(code).toContain('transitionDuration: 1500');
  });

  it('create_chain includes loop and autoPlay options', () => {
    const code = codeGenerator.generateScenePlayback({
      action: 'create_chain', sceneIds: ['s1'], loop: true, autoPlay: false,
    });
    expect(code).toContain('loop: true');
    expect(code).toContain('autoPlay: false');
  });

  it('play produces async IIFE with playChain', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'play' });
    expect(code).toContain('async function');
    expect(code).toContain('app.sceneManager.playChain()');
  });

  it('pause produces sync IIFE with pauseChain', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'pause' });
    expect(code).not.toContain('async function');
    expect(code).toContain('app.sceneManager.pauseChain()');
  });

  it('resume produces sync IIFE with resumeChain', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'resume' });
    expect(code).toContain('app.sceneManager.resumeChain()');
  });

  it('stop produces sync IIFE with stopChain', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'stop' });
    expect(code).toContain('app.sceneManager.stopChain()');
  });

  it('toggle_loop produces sync IIFE with setLoop', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'toggle_loop', enabled: false });
    expect(code).toContain('app.sceneManager.setLoop(false)');
  });

  it('toggle_loop defaults to enabled true', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'toggle_loop' });
    expect(code).toContain('app.sceneManager.setLoop(true)');
  });

  it('jump produces async IIFE with jumpToChainIndex', () => {
    const code = codeGenerator.generateScenePlayback({ action: 'jump', index: 3 });
    expect(code).toContain('async function');
    expect(code).toContain('app.sceneManager.jumpToChainIndex(3)');
  });

  it('all actions include SceneManager guard', () => {
    const actions = ['create_chain', 'play', 'pause', 'resume', 'stop', 'toggle_loop', 'jump'] as const;
    for (const action of actions) {
      const code = codeGenerator.generateScenePlayback({ action, sceneIds: ['s1'] });
      expect(code).toContain("if (!app.sceneManager)");
    }
  });
});

// =============================================================================
// TOOL INTEGRATION
// =============================================================================

describe('Scene Manager tool integration', () => {
  it('pinepaper_manage_scenes exists in PINEPAPER_TOOLS', () => {
    const tool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_manage_scenes');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('save');
    expect(tool!.description).toContain('load');
  });

  it('pinepaper_scene_playback exists in PINEPAPER_TOOLS', () => {
    const tool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_scene_playback');
    expect(tool).toBeDefined();
    expect(tool!.description).toContain('create_chain');
    expect(tool!.description).toContain('play');
  });

  it('both tools are in scene tag group', () => {
    expect(TOOL_TAGS.scene).toContain('pinepaper_manage_scenes');
    expect(TOOL_TAGS.scene).toContain('pinepaper_scene_playback');
  });

  it('both tools have minimal descriptions', () => {
    expect(MINIMAL_DESCRIPTIONS.pinepaper_manage_scenes).toBeDefined();
    expect(MINIMAL_DESCRIPTIONS.pinepaper_scene_playback).toBeDefined();
  });
});
