/**
 * Iconify Asset Repository Adapter
 *
 * Fetches SVG icons from iconify.design
 * Repository info: 200,000+ icons from various icon sets with different licenses
 */

import { AssetRepository, AssetResult, AssetMetadata, AssetLicense } from '../types.js';

/**
 * Iconify API response format
 */
interface IconifySearchResponse {
  icons?: string[];
  total?: number;
  limit?: number;
  start?: number;
  collections?: Record<string, {
    name: string;
    total: number;
    author?: string;
    license?: {
      title?: string;
      spdx?: string;
      url?: string;
    };
  }>;
}

/**
 * Iconify adapter
 *
 * Uses the Iconify API to search and download icons from multiple icon sets
 */
export class IconifyAdapter implements AssetRepository {
  name = 'iconify';

  private apiUrl = 'https://api.iconify.design';

  /**
   * Search for icons on Iconify
   *
   * @param query Search term
   * @param limit Maximum results to return
   */
  async search(query: string, limit: number): Promise<AssetResult[]> {
    try {
      // Iconify search endpoint
      const searchUrl = `${this.apiUrl}/search?query=${encodeURIComponent(query)}&limit=${limit}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!response.ok) {
        throw new Error(`Iconify search failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as IconifySearchResponse;

      if (!data.icons || !Array.isArray(data.icons)) {
        return [];
      }

      // Convert to AssetResult format
      const results: AssetResult[] = [];

      for (const iconName of data.icons.slice(0, limit)) {
        // Icon name format: "collection:icon-name"
        const [collection, name] = iconName.split(':');

        // Get collection info for license
        const collectionInfo = data.collections?.[collection];
        const license = this.parseLicense(collectionInfo);

        results.push({
          id: `iconify_${iconName.replace(':', '_')}`,
          repository: 'iconify',
          title: name?.replace(/-/g, ' ') || iconName,
          description: `${name} icon from ${collectionInfo?.name || collection}`,
          previewUrl: `https://api.iconify.design/${iconName}.svg`,
          downloadUrl: `https://api.iconify.design/${iconName}.svg`,
          license,
          tags: [query, collection],
          author: collectionInfo?.author,
        });
      }

      return results;
    } catch (error) {
      console.error('[IconifyAdapter] Search error:', error);
      return [];
    }
  }

  /**
   * Download SVG content
   *
   * @param assetId Asset ID from search results (format: iconify_collection_icon-name)
   */
  async download(assetId: string): Promise<string> {
    try {
      // Convert asset ID back to icon name
      const iconName = assetId
        .replace('iconify_', '')
        .replace('_', ':'); // Replace first underscore with colon

      // Download SVG from Iconify API
      const svgUrl = `${this.apiUrl}/${iconName}.svg`;

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
      console.error('[IconifyAdapter] Download error:', error);
      throw error;
    }
  }

  /**
   * Get asset metadata
   *
   * @param assetId Asset ID
   */
  async getMetadata(assetId: string): Promise<AssetMetadata> {
    try {
      const iconName = assetId.replace('iconify_', '').replace('_', ':');
      const [collection] = iconName.split(':');

      // Fetch collection info
      const collectionUrl = `${this.apiUrl}/collection?prefix=${collection}`;

      const response = await fetch(collectionUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const license = this.parseLicense(data);

        return {
          id: assetId,
          repository: this.name,
          title: iconName,
          license,
          downloadedAt: Date.now(),
        };
      }
    } catch (error) {
      console.error('[IconifyAdapter] Metadata error:', error);
    }

    // Fallback metadata
    return {
      id: assetId,
      repository: this.name,
      title: assetId.replace('iconify_', ''),
      license: {
        type: 'Mixed',
        name: 'Various Licenses (check collection)',
        requiresAttribution: true,
        allowsCommercial: false,
      },
      downloadedAt: Date.now(),
    };
  }

  /**
   * Parse license from collection info
   */
  private parseLicense(collectionInfo?: any): AssetLicense {
    if (!collectionInfo?.license) {
      return {
        type: 'Mixed',
        name: 'Various Licenses',
        requiresAttribution: true,
        allowsCommercial: false,
      };
    }

    const license = collectionInfo.license;
    const spdx = license.spdx || license.title || '';

    // Map common licenses
    if (spdx.includes('MIT')) {
      return {
        type: 'MIT',
        name: 'MIT License',
        requiresAttribution: true,
        allowsCommercial: true,
        url: license.url || 'https://opensource.org/licenses/MIT',
      };
    }

    if (spdx.includes('Apache')) {
      return {
        type: 'Apache-2.0',
        name: 'Apache License 2.0',
        requiresAttribution: true,
        allowsCommercial: true,
        url: license.url || 'https://www.apache.org/licenses/LICENSE-2.0',
      };
    }

    if (spdx.includes('CC0')) {
      return {
        type: 'CC0',
        name: 'Public Domain (CC0)',
        requiresAttribution: false,
        allowsCommercial: true,
        url: license.url || 'https://creativecommons.org/publicdomain/zero/1.0/',
      };
    }

    if (spdx.includes('CC-BY')) {
      return {
        type: 'CC-BY-4.0',
        name: 'Creative Commons Attribution',
        requiresAttribution: true,
        allowsCommercial: true,
        url: license.url || 'https://creativecommons.org/licenses/by/4.0/',
      };
    }

    // Generic license
    return {
      type: spdx || 'Unknown',
      name: license.title || 'Check Collection License',
      requiresAttribution: true,
      allowsCommercial: false,
      url: license.url,
    };
  }
}

/**
 * Create Iconify adapter instance
 */
export function createIconifyAdapter(): AssetRepository {
  return new IconifyAdapter();
}
