/**
 * Font Awesome Asset Repository Adapter
 *
 * Fetches free SVG icons from Font Awesome
 * Repository info: 2,000+ free icons (CC BY 4.0 license)
 */

import { AssetRepository, AssetResult, AssetMetadata, AssetLicense } from '../types.js';

/**
 * Font Awesome icon metadata
 */
interface FontAwesomeIcon {
  id: string;
  label: string;
  styles: string[]; // ['solid', 'regular', 'brands']
  unicode: string;
  familyStylesByLicense: {
    free: Array<{
      family: string;
      style: string;
    }>;
  };
}

/**
 * Font Awesome adapter
 *
 * Provides access to Font Awesome free icons
 * Note: This uses the CDN for SVG delivery since Font Awesome doesn't have a public search API
 */
export class FontAwesomeAdapter implements AssetRepository {
  name = 'fontawesome';

  private cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/svgs';

  /**
   * Font Awesome Free icon categories and common icons
   * Since FA doesn't have a public search API, we maintain a curated list
   */
  private iconDatabase: Record<string, string[]> = {
    'user': ['user', 'user-circle', 'user-plus', 'user-minus', 'user-check', 'users'],
    'arrow': ['arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'arrows'],
    'heart': ['heart', 'heart-circle-check', 'heart-pulse'],
    'star': ['star', 'star-half'],
    'home': ['home', 'house'],
    'search': ['search', 'magnifying-glass'],
    'settings': ['gear', 'cog', 'sliders'],
    'mail': ['envelope', 'envelope-open', 'at'],
    'phone': ['phone', 'mobile'],
    'calendar': ['calendar', 'calendar-days'],
    'clock': ['clock', 'hourglass'],
    'check': ['check', 'check-circle', 'circle-check'],
    'cross': ['xmark', 'times', 'circle-xmark'],
    'plus': ['plus', 'circle-plus'],
    'minus': ['minus', 'circle-minus'],
    'trash': ['trash', 'trash-can'],
    'edit': ['pen', 'pencil', 'pen-to-square'],
    'file': ['file', 'file-lines', 'folder'],
    'image': ['image', 'images', 'photo'],
    'music': ['music', 'volume-high'],
    'video': ['video', 'film'],
    'download': ['download', 'cloud-arrow-down'],
    'upload': ['upload', 'cloud-arrow-up'],
    'link': ['link', 'chain'],
    'lock': ['lock', 'unlock'],
    'eye': ['eye', 'eye-slash'],
    'location': ['location-dot', 'map-marker', 'map'],
    'comment': ['comment', 'comments', 'message'],
    'share': ['share', 'share-nodes'],
    'print': ['print'],
    'save': ['floppy-disk', 'save'],
  };

  /**
   * Search for icons
   */
  async search(query: string, limit: number): Promise<AssetResult[]> {
    const results: AssetResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search through our icon database
    for (const [category, icons] of Object.entries(this.iconDatabase)) {
      // Match category or icon names
      if (category.includes(lowerQuery)) {
        // Add all icons from matching category
        for (const iconName of icons) {
          if (results.length >= limit) break;
          results.push(this.createResult(iconName, 'solid'));
        }
      } else {
        // Search individual icon names
        for (const iconName of icons) {
          if (results.length >= limit) break;
          if (iconName.includes(lowerQuery)) {
            results.push(this.createResult(iconName, 'solid'));
          }
        }
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  /**
   * Create asset result for an icon
   */
  private createResult(iconName: string, style: 'solid' | 'regular' | 'brands'): AssetResult {
    return {
      id: `fontawesome_${style}_${iconName}`,
      repository: 'fontawesome',
      title: iconName.replace(/-/g, ' '),
      description: `Font Awesome ${style} ${iconName} icon`,
      previewUrl: `${this.cdnBase}/${style}/${iconName}.svg`,
      downloadUrl: `${this.cdnBase}/${style}/${iconName}.svg`,
      license: {
        type: 'CC-BY-4.0',
        name: 'Creative Commons Attribution 4.0',
        requiresAttribution: true,
        allowsCommercial: true,
        url: 'https://fontawesome.com/license/free',
      },
      tags: [iconName, style],
    };
  }

  /**
   * Download SVG content
   */
  async download(assetId: string): Promise<string> {
    try {
      // Parse asset ID: fontawesome_solid_icon-name
      const match = assetId.match(/fontawesome_([^_]+)_(.+)/);
      if (!match) {
        throw new Error(`Invalid FontAwesome asset ID: ${assetId}`);
      }

      const [, style, iconName] = match;
      const svgUrl = `${this.cdnBase}/${style}/${iconName}.svg`;

      const response = await fetch(svgUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download icon: ${response.status}`);
      }

      const svg = await response.text();

      // Validate SVG
      if (!svg.trim().startsWith('<svg') && !svg.includes('<svg')) {
        throw new Error('Downloaded content is not valid SVG');
      }

      return svg;
    } catch (error) {
      console.error('[FontAwesomeAdapter] Download error:', error);
      throw error;
    }
  }

  /**
   * Get asset metadata
   */
  async getMetadata(assetId: string): Promise<AssetMetadata> {
    return {
      id: assetId,
      repository: this.name,
      title: assetId.replace('fontawesome_', '').replace(/_/g, ' '),
      license: {
        type: 'CC-BY-4.0',
        name: 'Creative Commons Attribution 4.0',
        requiresAttribution: true,
        allowsCommercial: true,
        url: 'https://fontawesome.com/license/free',
      },
      downloadedAt: Date.now(),
    };
  }
}

/**
 * Create Font Awesome adapter instance
 */
export function createFontAwesomeAdapter(): AssetRepository {
  return new FontAwesomeAdapter();
}
