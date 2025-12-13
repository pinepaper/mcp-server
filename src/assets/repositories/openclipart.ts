/**
 * OpenClipart Asset Repository Adapter
 *
 * Fetches SVG assets from openclipart.org
 * Repository info: 150,000+ public domain clipart (CC0 license)
 */

import { AssetRepository, AssetResult, AssetMetadata, AssetLicense } from '../types.js';

/**
 * OpenClipart JSON API response format
 */
interface OpenClipartSearchResponse {
  payload?: Array<{
    id: string;
    title: string;
    description?: string;
    svg?: {
      url: string;
    };
    png_thumb?: {
      url: string;
    };
    detail_link?: string;
    uploader?: {
      name?: string;
    };
    tags?: string[];
  }>;
}

/**
 * OpenClipart adapter
 *
 * Uses the OpenClipart API to search and download public domain SVG clipart
 */
export class OpenClipartAdapter implements AssetRepository {
  name = 'openclipart';

  private baseUrl = 'https://openclipart.org';
  private apiUrl = 'https://openclipart.org/search/json';

  /**
   * Search for assets on OpenClipart
   *
   * @param query Search term
   * @param limit Maximum results to return
   */
  async search(query: string, limit: number): Promise<AssetResult[]> {
    try {
      // OpenClipart API endpoint
      const searchUrl = `${this.apiUrl}?query=${encodeURIComponent(query)}&amount=${limit}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenClipart search failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OpenClipartSearchResponse;

      if (!data.payload || !Array.isArray(data.payload)) {
        return [];
      }

      // Convert to AssetResult format
      return data.payload.slice(0, limit).map((item) => ({
        id: `openclipart_${item.id}`,
        repository: 'openclipart',
        title: item.title || 'Untitled',
        description: item.description || `${item.title} from OpenClipart`,
        previewUrl: item.png_thumb?.url || item.svg?.url || '',
        downloadUrl: item.svg?.url || '',
        license: {
          type: 'CC0',
          name: 'Public Domain (CC0)',
          requiresAttribution: false,
          allowsCommercial: true,
          url: 'https://creativecommons.org/publicdomain/zero/1.0/',
        },
        tags: item.tags || [query],
      }));
    } catch (error) {
      console.error('[OpenClipartAdapter] Search error:', error);
      return [];
    }
  }

  /**
   * Download SVG content
   *
   * @param assetId Asset ID from search results
   */
  async download(assetId: string): Promise<string> {
    try {
      // For OpenClipart, the download URL should be stored with the asset
      // If we need to fetch it, we'd query the API again
      const clipartId = assetId.replace('openclipart_', '');

      // Fetch the detail page to get download URL
      const detailUrl = `${this.baseUrl}/detail/${clipartId}`;

      const response = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch detail page: ${response.status}`);
      }

      const html = await response.text();

      // Extract SVG download URL from page
      const svgUrlMatch = html.match(/href="([^"]*\.svg)"/i);
      if (!svgUrlMatch) {
        throw new Error('Could not find SVG download URL');
      }

      const svgUrl = svgUrlMatch[1].startsWith('http')
        ? svgUrlMatch[1]
        : `${this.baseUrl}${svgUrlMatch[1]}`;

      // Download the SVG
      const svgResponse = await fetch(svgUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!svgResponse.ok) {
        throw new Error(`Failed to download SVG: ${svgResponse.status}`);
      }

      const svg = await svgResponse.text();

      // Validate SVG
      if (!svg.trim().startsWith('<svg') && !svg.includes('<svg')) {
        throw new Error('Downloaded content is not valid SVG');
      }

      return svg;
    } catch (error) {
      console.error('[OpenClipartAdapter] Download error:', error);
      throw error;
    }
  }

  /**
   * Get asset metadata
   *
   * @param assetId Asset ID
   */
  async getMetadata(assetId: string): Promise<AssetMetadata> {
    return {
      id: assetId,
      repository: this.name,
      title: assetId.replace('openclipart_', ''),
      license: {
        type: 'CC0',
        name: 'Public Domain (CC0)',
        requiresAttribution: false,
        allowsCommercial: true,
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      },
      downloadedAt: Date.now(),
    };
  }
}

/**
 * Create OpenClipart adapter instance
 */
export function createOpenClipartAdapter(): AssetRepository {
  return new OpenClipartAdapter();
}
