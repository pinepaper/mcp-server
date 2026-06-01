/**
 * Camera tool handlers.
 *
 * Two tools (down from seven, per the v1.5.4 critical-review consolidation):
 *
 *   pinepaper_camera_animate  — heavy: keyframes, easings, 3D pitch/yaw,
 *                                curved paths, polymorphic focus. Justifies
 *                                its own tool slot.
 *
 *   pinepaper_camera          — light: zoom / pan / move_to / reset / stop /
 *                                state. One action-dispatched tool, replacing
 *                                six thin wrappers that did barely more than
 *                                interpolate args into a single browser call.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { errorResult, executeOrGenerate, type HandlerOptions } from '../handlers.js';
import { ErrorCodes } from '../../types/schemas.js';

export type CameraHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

const PAN_METHOD_MAP = {
  left: 'panLeft',
  right: 'panRight',
  up: 'panUp',
  down: 'panDown',
} as const;

async function dispatchCameraAction(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  const duration = (args.duration as number) ?? 0.5;

  switch (action) {
    case 'zoom': {
      const direction = args.direction as 'in' | 'out';
      if (direction !== 'in' && direction !== 'out') {
        return errorResult(ErrorCodes.INVALID_INPUT, 'camera zoom requires direction: "in" | "out"');
      }
      const level = (args.level as number) ?? (direction === 'in' ? 2 : 0.5);
      const method = direction === 'in' ? 'zoomIn' : 'zoomOut';
      const code = `app.camera && app.camera.${method} ? app.camera.${method}(${level}, ${duration}) : null;`;
      return executeOrGenerate(code, `Camera zoom ${direction} to ${level}x`, options, 'pinepaper_camera');
    }

    case 'pan': {
      const direction = args.direction as 'left' | 'right' | 'up' | 'down' | undefined;
      const amount = (args.amount as number) ?? 100;
      const x = args.x as number | undefined;
      const y = args.y as number | undefined;

      if (x !== undefined && y !== undefined) {
        const code = `app.camera && app.camera.panTo ? app.camera.panTo(${x}, ${y}, ${duration}) : null;`;
        return executeOrGenerate(code, `Camera pan to (${x}, ${y})`, options, 'pinepaper_camera');
      }
      if (direction && direction in PAN_METHOD_MAP) {
        const method = PAN_METHOD_MAP[direction];
        const code = `app.camera && app.camera.${method} ? app.camera.${method}(${amount}, ${duration}) : null;`;
        return executeOrGenerate(code, `Camera pan ${direction} by ${amount}px`, options, 'pinepaper_camera');
      }
      return errorResult(ErrorCodes.INVALID_INPUT, 'camera pan requires either direction (left|right|up|down) or {x, y} coordinates');
    }

    case 'move_to': {
      const x = args.x as number;
      const y = args.y as number;
      const zoom = args.zoom as number;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof zoom !== 'number') {
        return errorResult(ErrorCodes.INVALID_INPUT, 'camera move_to requires {x, y, zoom}');
      }
      const code = `app.camera && app.camera.moveTo ? app.camera.moveTo(${x}, ${y}, ${zoom}, ${duration}) : null;`;
      return executeOrGenerate(code, `Camera move to (${x}, ${y}) at ${zoom}x zoom`, options, 'pinepaper_camera');
    }

    case 'reset': {
      const code = `app.camera && app.camera.reset ? app.camera.reset(${duration}) : null;`;
      return executeOrGenerate(code, 'Reset camera to default state', options, 'pinepaper_camera');
    }

    case 'stop': {
      const code = `app.camera && app.camera.stop ? app.camera.stop() : null;`;
      return executeOrGenerate(code, 'Stop camera animation', options, 'pinepaper_camera');
    }

    case 'state': {
      const code = `app.camera && app.camera.getState ? app.camera.getState() : { zoom: 1, center: [400, 300], isAnimating: false };`;
      return executeOrGenerate(code, 'Get current camera state', options, 'pinepaper_camera');
    }

    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown camera action "${action}". Valid: zoom, pan, move_to, reset, stop, state. For keyframe walkthroughs use pinepaper_camera_animate.`,
      );
  }
}

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

    const keyframesStr = JSON.stringify(keyframes);
    const relParams: Record<string, unknown> = { keyframes: JSON.parse(keyframesStr), duration, loop, delay, fov };
    const relParamsStr = JSON.stringify(relParams);
    const code = `app.camera && app.camera.animate ? app.camera.animate(${keyframesStr}, ${duration}, ${loop}, ${delay}, { fov: ${fov} }) : app.addRelation('camera', 'camera', 'camera_animates', ${relParamsStr});`;
    return executeOrGenerate(code, `Animates camera with ${keyframes.length} keyframes over ${duration}s`, options, 'pinepaper_camera_animate');
  },

  pinepaper_camera: dispatchCameraAction,
};
