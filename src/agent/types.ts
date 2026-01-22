/**
 * PinePaper Agent Flow Mode - Type Definitions
 *
 * Types for job/session management, batch execution, smart exports,
 * and platform presets for content automation pipelines.
 */

import { z } from 'zod';

// =============================================================================
// PLATFORM PRESETS
// =============================================================================

/**
 * Supported export platforms
 */
export type Platform =
  | 'instagram'
  | 'instagram-story'
  | 'tiktok'
  | 'youtube'
  | 'youtube-thumbnail'
  | 'twitter'
  | 'linkedin'
  | 'web'
  | 'print-a4'
  | 'print-letter';

/**
 * Export format types
 */
export type ExportFormat = 'svg' | 'png' | 'gif' | 'mp4' | 'webm' | 'pdf';

/**
 * Platform preset configuration
 */
export interface PlatformPreset {
  platform: Platform;
  dimensions: { width: number; height: number };
  formats: {
    static: ExportFormat;
    animated: ExportFormat;
  };
  quality: {
    static: { dpi: number; compression: number };
    animated: { fps: number; bitrate?: number };
  };
  metadata: {
    aspectRatio: string;
    maxFileSize?: number;
    colorProfile?: string;
  };
}

/**
 * Platform presets for social media and other targets
 */
export const PLATFORM_PRESETS: Record<Platform, PlatformPreset> = {
  'instagram': {
    platform: 'instagram',
    dimensions: { width: 1080, height: 1080 },
    formats: { static: 'png', animated: 'mp4' },
    quality: { static: { dpi: 72, compression: 0.9 }, animated: { fps: 30 } },
    metadata: { aspectRatio: '1:1', maxFileSize: 30_000_000 },
  },
  'instagram-story': {
    platform: 'instagram-story',
    dimensions: { width: 1080, height: 1920 },
    formats: { static: 'png', animated: 'mp4' },
    quality: { static: { dpi: 72, compression: 0.9 }, animated: { fps: 30 } },
    metadata: { aspectRatio: '9:16', maxFileSize: 30_000_000 },
  },
  'tiktok': {
    platform: 'tiktok',
    dimensions: { width: 1080, height: 1920 },
    formats: { static: 'png', animated: 'mp4' },
    quality: { static: { dpi: 72, compression: 0.85 }, animated: { fps: 60 } },
    metadata: { aspectRatio: '9:16', maxFileSize: 287_000_000 },
  },
  'youtube': {
    platform: 'youtube',
    dimensions: { width: 1920, height: 1080 },
    formats: { static: 'png', animated: 'mp4' },
    quality: { static: { dpi: 72, compression: 0.95 }, animated: { fps: 60, bitrate: 8_000_000 } },
    metadata: { aspectRatio: '16:9' },
  },
  'youtube-thumbnail': {
    platform: 'youtube-thumbnail',
    dimensions: { width: 1280, height: 720 },
    formats: { static: 'png', animated: 'png' },
    quality: { static: { dpi: 72, compression: 0.9 }, animated: { fps: 1 } },
    metadata: { aspectRatio: '16:9', maxFileSize: 2_000_000 },
  },
  'twitter': {
    platform: 'twitter',
    dimensions: { width: 1200, height: 675 },
    formats: { static: 'png', animated: 'gif' },
    quality: { static: { dpi: 72, compression: 0.85 }, animated: { fps: 15 } },
    metadata: { aspectRatio: '16:9', maxFileSize: 15_000_000 },
  },
  'linkedin': {
    platform: 'linkedin',
    dimensions: { width: 1200, height: 627 },
    formats: { static: 'png', animated: 'gif' },
    quality: { static: { dpi: 72, compression: 0.9 }, animated: { fps: 15 } },
    metadata: { aspectRatio: '1.91:1', maxFileSize: 10_000_000 },
  },
  'web': {
    platform: 'web',
    dimensions: { width: 800, height: 600 },
    formats: { static: 'svg', animated: 'svg' },
    quality: { static: { dpi: 72, compression: 1 }, animated: { fps: 60 } },
    metadata: { aspectRatio: '4:3' },
  },
  'print-a4': {
    platform: 'print-a4',
    dimensions: { width: 2480, height: 3508 },
    formats: { static: 'pdf', animated: 'pdf' },
    quality: { static: { dpi: 300, compression: 1 }, animated: { fps: 1 } },
    metadata: { aspectRatio: '1:1.414', colorProfile: 'CMYK' },
  },
  'print-letter': {
    platform: 'print-letter',
    dimensions: { width: 2550, height: 3300 },
    formats: { static: 'pdf', animated: 'pdf' },
    quality: { static: { dpi: 300, compression: 1 }, animated: { fps: 1 } },
    metadata: { aspectRatio: '8.5:11', colorProfile: 'CMYK' },
  },
};

// =============================================================================
// JOB / SESSION TYPES
// =============================================================================

/**
 * Screenshot policy for agent jobs
 */
export type ScreenshotPolicy = 'none' | 'on_error' | 'on_complete' | 'on_request';

/**
 * Options for starting a new agent job
 */
export interface JobOptions {
  /** Optional job name for tracking */
  name?: string;
  /** Run browser in headless mode (default: true for agent workflows) */
  headless?: boolean;
  /** When to take screenshots (default: on_complete) */
  screenshotPolicy?: ScreenshotPolicy;
  /** Optional canvas size preset to apply on start */
  canvasPreset?: Platform;
  /** Custom canvas dimensions */
  canvasSize?: { width: number; height: number };
  /** Background color to set */
  backgroundColor?: string;
}

/**
 * Current job context
 */
export interface JobContext {
  /** Unique job identifier */
  jobId: string;
  /** Optional job name */
  name?: string;
  /** Job start timestamp */
  startTime: number;
  /** Items created during this job */
  itemsCreated: string[];
  /** Relations added during this job */
  relationsCreated: string[];
  /** Code queued for batch execution */
  codeQueue: string[];
  /** Screenshot policy */
  screenshotPolicy: ScreenshotPolicy;
  /** Canvas preset if set */
  canvasPreset?: Platform;
  /** Whether agent mode is active */
  agentMode: boolean;
}

/**
 * Result returned when job ends
 */
export interface JobResult {
  /** Job identifier */
  jobId: string;
  /** Job name if provided */
  name?: string;
  /** Total job duration in milliseconds */
  duration: number;
  /** Items created during job */
  itemsCreated: string[];
  /** Relations created during job */
  relationsCreated: string[];
  /** Final screenshot (base64) if taken */
  screenshot?: string;
  /** Export recommendations based on content */
  exportRecommendations?: ExportRecommendation[];
  /** Content analysis results */
  contentAnalysis?: ContentAnalysis;
}

// =============================================================================
// BATCH EXECUTION TYPES
// =============================================================================

/**
 * Batch operation types
 */
export type BatchOperationType =
  | 'create'
  | 'modify'
  | 'delete'
  | 'animate'
  | 'relation'
  | 'canvas'
  | 'generator';

/**
 * Single batch operation
 */
export interface BatchOperation {
  /** Operation type */
  type: BatchOperationType;
  /** For create operations */
  itemType?: string;
  /** Operation parameters */
  params: Record<string, unknown>;
  /** Reference to previous items in batch ($0, $1, etc.) */
  sourceRef?: string;
  targetRef?: string;
}

/**
 * Result of batch execution
 */
export interface BatchExecuteResult {
  success: boolean;
  /** IDs of items created (in order) */
  itemIds: string[];
  /** Total execution time */
  executionTime: number;
  /** Per-operation results */
  results: Array<{
    index: number;
    success: boolean;
    itemId?: string;
    error?: string;
  }>;
  /** Error if batch failed */
  error?: string;
}

// =============================================================================
// CONTENT ANALYSIS & EXPORT TYPES
// =============================================================================

/**
 * Color complexity levels
 */
export type ColorComplexity = 'simple' | 'gradient' | 'complex';

/**
 * Content analysis result
 */
export interface ContentAnalysis {
  /** Whether the scene has animations */
  hasAnimations: boolean;
  /** Types of animations used */
  animationTypes: string[];
  /** Color complexity assessment */
  colorComplexity: ColorComplexity;
  /** Total number of items */
  itemCount: number;
  /** Canvas dimensions */
  canvasSize: { width: number; height: number };
  /** Whether scene has relations */
  hasRelations: boolean;
  /** Types of relations used */
  relationTypes: string[];
  /** Whether scene has gradients */
  hasGradients: boolean;
  /** Whether scene has shadows */
  hasShadows: boolean;
  /** Whether scene has text */
  hasText: boolean;
  /** Whether scene has images */
  hasImages: boolean;
}

/**
 * Export recommendation
 */
export interface ExportRecommendation {
  /** Recommended platform */
  platform: Platform;
  /** Recommended format */
  format: ExportFormat;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for recommendation */
  reason: string;
  /** Warnings or notes */
  warnings?: string[];
}

/**
 * Smart export options
 */
export interface SmartExportOptions {
  /** Target platform (auto = detect best option) */
  platform?: Platform | 'auto';
  /** Export format (auto = select based on content) */
  format?: ExportFormat | 'auto';
  /** Export quality level */
  quality?: 'draft' | 'standard' | 'high';
  /** Include alternative format recommendations */
  includeRecommendations?: boolean;
}

/**
 * Smart export result
 */
export interface SmartExportResult {
  /** Actual platform used */
  platform: Platform;
  /** Actual format used */
  format: ExportFormat;
  /** Export data (base64 or SVG string) */
  data: string;
  /** MIME type of export */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Content analysis used for decisions */
  analysis?: ContentAnalysis;
  /** Alternative recommendations */
  recommendations?: ExportRecommendation[];
}

// =============================================================================
// RESET OPTIONS
// =============================================================================

/**
 * Options for resetting canvas between jobs
 */
export interface ResetOptions {
  /** Keep current canvas dimensions (default: true) */
  preserveCanvasSize?: boolean;
  /** Keep current background color (default: false) */
  preserveBackground?: boolean;
  /** New canvas preset to apply */
  canvasPreset?: Platform;
  /** New background color */
  backgroundColor?: string;
}

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

export const PlatformSchema = z.enum([
  'instagram',
  'instagram-story',
  'tiktok',
  'youtube',
  'youtube-thumbnail',
  'twitter',
  'linkedin',
  'web',
  'print-a4',
  'print-letter',
]).describe('Target platform for export');

export const ExportFormatSchema = z.enum([
  'svg', 'png', 'gif', 'mp4', 'webm', 'pdf',
]).describe('Export file format');

export const ScreenshotPolicySchema = z.enum([
  'none', 'on_error', 'on_complete', 'on_request',
]).describe('When to take screenshots during job');

export const JobOptionsSchema = z.object({
  name: z.string().optional().describe('Optional job name for tracking'),
  headless: z.boolean().optional().default(true).describe('Run browser in headless mode'),
  screenshotPolicy: ScreenshotPolicySchema.optional().default('on_complete'),
  canvasPreset: PlatformSchema.optional().describe('Canvas size preset'),
  canvasSize: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe('Custom canvas dimensions'),
  backgroundColor: z.string().optional().describe('Background color'),
}).describe('Options for starting an agent job');

export const BatchOperationTypeSchema = z.enum([
  'create', 'modify', 'delete', 'animate', 'relation', 'canvas', 'generator',
]).describe('Type of batch operation');

export const BatchOperationSchema = z.object({
  type: BatchOperationTypeSchema,
  itemType: z.string().optional().describe('Item type for create operations'),
  params: z.record(z.unknown()).describe('Operation parameters'),
  sourceRef: z.string().optional().describe('Reference to source item ($0, $1, etc.)'),
  targetRef: z.string().optional().describe('Reference to target item'),
}).describe('Single batch operation');

export const BatchExecuteInputSchema = z.object({
  operations: z.array(BatchOperationSchema).describe('Array of operations to execute'),
  atomic: z.boolean().optional().default(true).describe('Rollback all on any failure'),
}).describe('Batch execution input');

export const ResetOptionsSchema = z.object({
  preserveCanvasSize: z.boolean().optional().default(true),
  preserveBackground: z.boolean().optional().default(false),
  canvasPreset: PlatformSchema.optional(),
  backgroundColor: z.string().optional(),
}).describe('Reset options');

export const SmartExportOptionsSchema = z.object({
  platform: z.union([PlatformSchema, z.literal('auto')]).optional().default('auto'),
  format: z.union([ExportFormatSchema, z.literal('auto')]).optional().default('auto'),
  quality: z.enum(['draft', 'standard', 'high']).optional().default('standard'),
  includeRecommendations: z.boolean().optional().default(true),
}).describe('Smart export options');

// Type exports from schemas
export type JobOptionsInput = z.infer<typeof JobOptionsSchema>;
export type BatchOperationInput = z.infer<typeof BatchOperationSchema>;
export type BatchExecuteInput = z.infer<typeof BatchExecuteInputSchema>;
export type ResetOptionsInput = z.infer<typeof ResetOptionsSchema>;
export type SmartExportOptionsInput = z.infer<typeof SmartExportOptionsSchema>;
