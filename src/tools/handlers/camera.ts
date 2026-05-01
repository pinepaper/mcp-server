/**
 * Camera tool handlers — extracted from src/tools/handlers.ts as the first
 * module of the dispatch refactor. Each tool is a pure function over
 * (args, options) that emits browser-side JS via executeOrGenerate.
 *
 * Camera handlers were the cleanest extraction candidate: no Zod schemas,
 * no codeGenerator dependency, no shared mutable state — just string
 * interpolation against args + a delegation to executeOrGenerate.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeOrGenerate, type HandlerOptions } from '../handlers.js';

export type CameraHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const cameraHandlers: Record<string, CameraHandler> = {
  pinepaper_camera_animate: async (args, options) => {
    const keyframes = args.keyframes as Array<{
      time: number;
      zoom?: number;
      center?: [number, number];
      pitch?: number;
      yaw?: number;
      easing?: string;
    }>;
    const duration = args.duration as number;
    const loop = (args.loop as boolean) ?? false;
    const delay = (args.delay as number) ?? 0;
    const fov = (args.fov as number) ?? 60;
    const mode = (args.mode as string) ?? 'keyframes';
    const target = args.target as { x: number; y: number } | undefined;

    const keyframesStr = JSON.stringify(keyframes);
    const relParams: Record<string, unknown> = { keyframes: JSON.parse(keyframesStr), duration, loop, delay, fov, mode };
    if (target) relParams.target = target;
    const relParamsStr = JSON.stringify(relParams);
    const code = `app.camera && app.camera.animate ? app.camera.animate(${keyframesStr}, ${duration}, ${loop}, ${delay}, { fov: ${fov}, mode: '${mode}'${target ? `, target: ${JSON.stringify(target)}` : ''} }) : app.addRelation('camera', 'camera', 'camera_animates', ${relParamsStr});`;
    return executeOrGenerate(code, `Animates camera with ${keyframes.length} keyframes over ${duration}s`, options, 'pinepaper_camera_animate');
  },

  pinepaper_camera_zoom: async (args, options) => {
    const direction = args.direction as 'in' | 'out';
    const level = (args.level as number) ?? (direction === 'in' ? 2 : 0.5);
    const duration = (args.duration as number) ?? 0.5;

    const method = direction === 'in' ? 'zoomIn' : 'zoomOut';
    const code = `app.camera && app.camera.${method} ? app.camera.${method}(${level}, ${duration}) : null;`;
    return executeOrGenerate(code, `Camera zoom ${direction} to ${level}x`, options, 'pinepaper_camera_zoom');
  },

  pinepaper_camera_pan: async (args, options) => {
    const direction = args.direction as 'left' | 'right' | 'up' | 'down' | undefined;
    const amount = (args.amount as number) ?? 100;
    const x = args.x as number | undefined;
    const y = args.y as number | undefined;
    const duration = (args.duration as number) ?? 0.5;

    let code: string;
    let description: string;

    if (x !== undefined && y !== undefined) {
      code = `app.camera && app.camera.panTo ? app.camera.panTo(${x}, ${y}, ${duration}) : null;`;
      description = `Camera pan to (${x}, ${y})`;
    } else if (direction) {
      const methodMap = { left: 'panLeft', right: 'panRight', up: 'panUp', down: 'panDown' };
      const method = methodMap[direction];
      code = `app.camera && app.camera.${method} ? app.camera.${method}(${amount}, ${duration}) : null;`;
      description = `Camera pan ${direction} by ${amount}px`;
    } else {
      code = `// No direction or coordinates specified`;
      description = 'Camera pan (no parameters)';
    }

    return executeOrGenerate(code, description, options, 'pinepaper_camera_pan');
  },

  pinepaper_camera_move_to: async (args, options) => {
    const x = args.x as number;
    const y = args.y as number;
    const zoom = args.zoom as number;
    const duration = (args.duration as number) ?? 0.5;

    const code = `app.camera && app.camera.moveTo ? app.camera.moveTo(${x}, ${y}, ${zoom}, ${duration}) : null;`;
    return executeOrGenerate(code, `Camera move to (${x}, ${y}) at ${zoom}x zoom`, options, 'pinepaper_camera_move_to');
  },

  pinepaper_camera_reset: async (args, options) => {
    const duration = (args.duration as number) ?? 0.5;
    const code = `app.camera && app.camera.reset ? app.camera.reset(${duration}) : null;`;
    return executeOrGenerate(code, 'Reset camera to default state', options, 'pinepaper_camera_reset');
  },

  pinepaper_camera_stop: async (_args, options) => {
    const code = `app.camera && app.camera.stop ? app.camera.stop() : null;`;
    return executeOrGenerate(code, 'Stop camera animation', options, 'pinepaper_camera_stop');
  },

  pinepaper_camera_state: async (_args, options) => {
    const code = `app.camera && app.camera.getState ? app.camera.getState() : { zoom: 1, center: [400, 300], isAnimating: false };`;
    return executeOrGenerate(code, 'Get current camera state', options, 'pinepaper_camera_state');
  },
};
