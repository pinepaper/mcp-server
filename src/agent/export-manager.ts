/**
 * PinePaper Smart Export Manager
 *
 * Provides intelligent export recommendations and platform presets.
 * Analyzes content to suggest optimal export formats.
 */

import {
  Platform,
  ExportFormat,
  PlatformPreset,
  PLATFORM_PRESETS,
  ContentAnalysis,
  ExportRecommendation,
  SmartExportOptions,
  SmartExportResult,
  ColorComplexity,
} from './types.js';

// =============================================================================
// EXPORT MANAGER CLASS
// =============================================================================

/**
 * Manages smart exports with content analysis and platform presets.
 *
 * Features:
 * - Content analysis (animations, colors, complexity)
 * - Platform preset management
 * - Optimal format recommendations
 * - Export code generation
 */
export class SmartExportManager {
  /**
   * Get platform preset configuration
   */
  getPreset(platform: Platform): PlatformPreset {
    return PLATFORM_PRESETS[platform];
  }

  /**
   * List all available platforms
   */
  listPlatforms(): Platform[] {
    return Object.keys(PLATFORM_PRESETS) as Platform[];
  }

  /**
   * Generate code to analyze canvas content
   */
  generateAnalysisCode(): string {
    return `
(function() {
  const analysis = {
    hasAnimations: false,
    animationTypes: [],
    colorComplexity: 'simple',
    itemCount: 0,
    canvasSize: { width: 0, height: 0 },
    hasRelations: false,
    relationTypes: [],
    hasGradients: false,
    hasShadows: false,
    hasText: false,
    hasImages: false,
  };

  // Get canvas size
  if (app.canvasEl) {
    analysis.canvasSize = {
      width: app.canvasEl.width,
      height: app.canvasEl.height
    };
  } else if (paper.view) {
    analysis.canvasSize = {
      width: paper.view.size.width,
      height: paper.view.size.height
    };
  }

  // Count items and analyze types
  const items = app.itemRegistry ? app.itemRegistry.getAll() : [];
  analysis.itemCount = items.length;

  const animationSet = new Set();
  const relationSet = new Set();
  let hasGradient = false;
  let hasShadow = false;

  items.forEach(entry => {
    const item = entry.item;
    const data = item.data || {};

    // Check for text
    if (entry.type === 'text' || item.className === 'PointText') {
      analysis.hasText = true;
    }

    // Check for images (raster items)
    if (item.className === 'Raster') {
      analysis.hasImages = true;
    }

    // Check for animations
    if (data.animationType) {
      analysis.hasAnimations = true;
      animationSet.add(data.animationType);
    }

    // Check for gradients
    if (item.fillColor && item.fillColor.gradient) {
      hasGradient = true;
    }
    if (item.strokeColor && item.strokeColor.gradient) {
      hasGradient = true;
    }

    // Check for shadows
    if (item.shadowColor || item.shadowBlur) {
      hasShadow = true;
    }
  });

  analysis.animationTypes = Array.from(animationSet);
  analysis.hasGradients = hasGradient;
  analysis.hasShadows = hasShadow;

  // Check for relations
  if (app.relationRegistry) {
    const relations = app.relationRegistry.getAll ? app.relationRegistry.getAll() : [];
    analysis.hasRelations = relations.length > 0;
    relations.forEach(rel => {
      if (rel.relationType) {
        relationSet.add(rel.relationType);
      }
    });
    analysis.relationTypes = Array.from(relationSet);

    // Relations imply animations
    if (analysis.hasRelations) {
      analysis.hasAnimations = true;
    }
  }

  // Determine color complexity
  if (hasGradient) {
    analysis.colorComplexity = 'gradient';
  } else if (analysis.itemCount > 20 || hasShadow) {
    analysis.colorComplexity = 'complex';
  } else {
    analysis.colorComplexity = 'simple';
  }

  return analysis;
})();
    `.trim();
  }

  /**
   * Recommend export format based on content analysis
   */
  recommendFormat(analysis: ContentAnalysis): ExportRecommendation[] {
    const recommendations: ExportRecommendation[] = [];

    // Primary recommendation logic
    if (analysis.hasAnimations) {
      // Animated content
      if (analysis.hasGradients || analysis.colorComplexity === 'complex') {
        // Complex animations → WebM/MP4 for best quality
        recommendations.push({
          platform: 'web',
          format: 'webm',
          confidence: 0.9,
          reason: 'Animated content with gradients renders best as WebM video',
          warnings: analysis.hasImages ? ['Images may increase file size'] : undefined,
        });
        recommendations.push({
          platform: 'instagram',
          format: 'mp4',
          confidence: 0.85,
          reason: 'MP4 for social media compatibility with complex animations',
        });
      } else {
        // Simple animations → SVG for web, GIF for social
        recommendations.push({
          platform: 'web',
          format: 'svg',
          confidence: 0.95,
          reason: 'Simple animations export well as animated SVG',
        });
        recommendations.push({
          platform: 'twitter',
          format: 'gif',
          confidence: 0.8,
          reason: 'GIF for social media with simple animations',
          warnings: ['GIF limited to 256 colors'],
        });
      }
    } else {
      // Static content
      if (analysis.colorComplexity === 'simple' && !analysis.hasImages) {
        recommendations.push({
          platform: 'web',
          format: 'svg',
          confidence: 0.95,
          reason: 'Vector graphics best as SVG for scalability',
        });
      } else {
        recommendations.push({
          platform: 'instagram',
          format: 'png',
          confidence: 0.9,
          reason: 'High quality static export as PNG',
        });
      }
    }

    // Add print recommendation if applicable
    if (!analysis.hasAnimations && analysis.canvasSize.width > 1000) {
      recommendations.push({
        platform: 'print-a4',
        format: 'pdf',
        confidence: 0.7,
        reason: 'High resolution suitable for print',
      });
    }

    return recommendations;
  }

  /**
   * Recommend platforms based on content analysis
   */
  recommendPlatforms(analysis: ContentAnalysis): Platform[] {
    const platforms: Platform[] = [];
    const { width, height } = analysis.canvasSize;
    const aspectRatio = width / height;

    // Square content
    if (Math.abs(aspectRatio - 1) < 0.1) {
      platforms.push('instagram');
    }

    // Vertical content (9:16)
    if (aspectRatio < 0.7) {
      platforms.push('instagram-story', 'tiktok');
    }

    // Horizontal content (16:9)
    if (aspectRatio > 1.5) {
      platforms.push('youtube', 'youtube-thumbnail', 'twitter', 'linkedin');
    }

    // Web is always an option
    platforms.push('web');

    return platforms;
  }

  /**
   * Get optimal format for a specific platform based on content
   */
  getOptimalFormat(platform: Platform, analysis: ContentAnalysis): ExportFormat {
    const preset = PLATFORM_PRESETS[platform];

    if (analysis.hasAnimations) {
      return preset.formats.animated as ExportFormat;
    } else {
      return preset.formats.static as ExportFormat;
    }
  }

  /**
   * Generate export code for a specific platform
   */
  generateExportCode(
    platform: Platform,
    format: ExportFormat,
    options: { quality?: 'draft' | 'standard' | 'high' } = {}
  ): string {
    const preset = PLATFORM_PRESETS[platform];
    const quality = options.quality || 'standard';

    // Get quality settings
    const qualitySettings = {
      draft: { compression: 0.6, fps: 15, dpi: 72 },
      standard: { compression: 0.85, fps: 30, dpi: 150 },
      high: { compression: 0.95, fps: 60, dpi: 300 },
    }[quality];

    switch (format) {
      case 'svg':
        return this.generateSVGExportCode();
      case 'png':
        return this.generatePNGExportCode(qualitySettings.dpi);
      case 'gif':
        return this.generateGIFExportCode(qualitySettings.fps, qualitySettings.compression);
      case 'mp4':
      case 'webm':
        return this.generateVideoExportCode(format, qualitySettings.fps, preset.dimensions);
      case 'pdf':
        return this.generatePDFExportCode(qualitySettings.dpi);
      default:
        return this.generateSVGExportCode();
    }
  }

  /**
   * Generate SVG export code
   */
  private generateSVGExportCode(): string {
    return `
(async function() {
  const svgString = app.exportAnimatedSVG();
  const hasAnimations = svgString.includes('<animate') || svgString.includes('@keyframes');

  return {
    success: true,
    format: 'svg',
    data: svgString,
    mimeType: 'image/svg+xml',
    size: new Blob([svgString]).size,
    hasAnimations
  };
})();
    `.trim();
  }

  /**
   * Generate PNG export code
   */
  private generatePNGExportCode(dpi: number): string {
    return `
(async function() {
  // Use exportPrintPNG if available for high DPI
  if (app.exportPrintPNG && ${dpi} >= 150) {
    const dataUrl = await app.exportPrintPNG(${dpi});
    return {
      success: true,
      format: 'png',
      data: dataUrl,
      mimeType: 'image/png',
      dpi: ${dpi}
    };
  }

  // Fallback to canvas export
  const canvas = document.querySelector('canvas');
  const dataUrl = canvas.toDataURL('image/png');
  return {
    success: true,
    format: 'png',
    data: dataUrl,
    mimeType: 'image/png',
    size: Math.round(dataUrl.length * 0.75)
  };
})();
    `.trim();
  }

  /**
   * Generate GIF export code
   */
  private generateGIFExportCode(fps: number, quality: number): string {
    return `
(async function() {
  if (!app.exportEngine) {
    return { success: false, error: 'GIF export not available' };
  }

  let blob;
  if (app.exportEngine._quickExportVideo) {
    const result = await app.exportEngine._quickExportVideo('gif', { fps: ${fps}, duration: 5 }, false);
    blob = result && result.blob ? result.blob : null;
  } else if (app.exportEngine.videoExporter) {
    blob = await app.exportEngine.videoExporter.export({ format: 'gif', fps: ${fps}, duration: 5 });
  }

  if (!blob) {
    return { success: false, error: 'GIF export returned no data' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        success: true,
        format: 'gif',
        data: reader.result,
        mimeType: 'image/gif',
        size: blob.size
      });
    };
    reader.readAsDataURL(blob);
  });
})();
    `.trim();
  }

  /**
   * Generate video export code (MP4/WebM)
   */
  private generateVideoExportCode(
    format: 'mp4' | 'webm',
    fps: number,
    dimensions: { width: number; height: number }
  ): string {
    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';

    return `
(async function() {
  if (!app.exportEngine) {
    return { success: false, error: '${format.toUpperCase()} export not available' };
  }

  let blob;
  if (app.exportEngine._quickExportVideo) {
    const result = await app.exportEngine._quickExportVideo('${format}', { fps: ${fps}, duration: 5 }, false);
    blob = result && result.blob ? result.blob : null;
  } else if (app.exportEngine.videoExporter) {
    blob = await app.exportEngine.videoExporter.export({ format: '${format}', fps: ${fps}, duration: 5 });
  }

  if (!blob) {
    return { success: false, error: '${format.toUpperCase()} export returned no data' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        success: true,
        format: '${format}',
        data: reader.result,
        mimeType: '${mimeType}',
        size: blob.size
      });
    };
    reader.readAsDataURL(blob);
  });
})();
    `.trim();
  }

  /**
   * Generate PDF export code
   */
  private generatePDFExportCode(dpi: number): string {
    return `
(async function() {
  if (!app.exportEngine || !app.exportEngine.exportPDF) {
    return { success: false, error: 'PDF export not available' };
  }

  const blob = await app.exportEngine.exportPDF({
    dpi: ${dpi},
    includeBleed: false
  });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        success: true,
        format: 'pdf',
        data: reader.result,
        mimeType: 'application/pdf',
        size: blob.size,
        dpi: ${dpi}
      });
    };
    reader.readAsDataURL(blob);
  });
})();
    `.trim();
  }

  /**
   * Generate code to set canvas size from preset
   */
  generateSetCanvasSizeCode(platform: Platform): string {
    const preset = PLATFORM_PRESETS[platform];
    return `
// Set canvas size for ${platform}
app.setCanvasSize({
  width: ${preset.dimensions.width},
  height: ${preset.dimensions.height}
});
({ success: true, platform: '${platform}', dimensions: ${JSON.stringify(preset.dimensions)} });
    `.trim();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let exportManagerInstance: SmartExportManager | null = null;

/**
 * Get the singleton export manager instance
 */
export function getExportManager(): SmartExportManager {
  if (!exportManagerInstance) {
    exportManagerInstance = new SmartExportManager();
  }
  return exportManagerInstance;
}
