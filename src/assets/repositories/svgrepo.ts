/**
 * SVGRepo Asset Repository Adapter
 *
 * Fetches SVG assets from svgrepo.com
 * Repository info: 500,000+ free SVG icons with various licenses
 */

import { AssetRepository, AssetResult, AssetMetadata, AssetLicense } from '../types.js';

/**
 * SVGRepo Result from HTML parsing
 */
interface SVGRepoSearchResult {
  url: string;
  title: string;
  previewUrl: string;
}

/**
 * SVGRepo adapter - Real implementation
 *
 * Searches and downloads SVG assets from svgrepo.com
 */
export class SVGRepoAdapter implements AssetRepository {
  name = 'svgrepo';

  private baseUrl = 'https://www.svgrepo.com';
  private searchUrl = 'https://www.svgrepo.com/vectors';

  /**
   * Search for assets on SVGRepo
   *
   * @param query Search term (e.g., "rocket", "heart")
   * @param limit Maximum results to return
   */
  async search(query: string, limit: number): Promise<AssetResult[]> {
    try {
      // Encode query for URL
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `${this.searchUrl}/${encodedQuery}/1/`;

      // Fetch search results page
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!response.ok) {
        throw new Error(`SVGRepo search failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      // Parse HTML to extract results
      const results = this.parseSearchResults(html, limit);

      // Convert to AssetResult format
      return results.map((result) => ({
        id: this.urlToAssetId(result.url),
        repository: 'svgrepo',
        title: result.title,
        description: `${result.title} from SVGRepo`,
        previewUrl: result.previewUrl,
        downloadUrl: result.url,
        license: this.parseLicenseFromPage(html), // Default license
        tags: [query],
      }));
    } catch (error) {
      console.error('[SVGRepoAdapter] Search error:', error);
      // Return empty results on error rather than throwing
      return [];
    }
  }

  /**
   * Download SVG content
   *
   * @param assetId Asset ID from search results (format: svgrepo_12345_slug)
   */
  async download(assetId: string): Promise<string> {
    try {
      // Convert asset ID back to URL
      const url = this.assetIdToUrl(assetId);

      // Fetch the asset page to get download link
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch asset page: ${pageResponse.status}`);
      }

      const html = await pageResponse.text();

      // Extract download URL from page
      const downloadUrl = this.extractDownloadUrl(html, url);

      if (!downloadUrl) {
        throw new Error('Could not find download URL in page');
      }

      // Download the SVG file
      const svgResponse = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      if (!svgResponse.ok) {
        throw new Error(`Failed to download SVG: ${svgResponse.status}`);
      }

      const svg = await svgResponse.text();

      // Validate it's actually SVG
      if (!svg.trim().startsWith('<svg') && !svg.includes('<svg')) {
        throw new Error('Downloaded content is not valid SVG');
      }

      return svg;
    } catch (error) {
      console.error('[SVGRepoAdapter] Download error:', error);
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
      const url = this.assetIdToUrl(assetId);

      // Fetch page to extract metadata
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PinePaper-MCP-Server/1.2.2',
        },
      });

      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch
        ? titleMatch[1].replace(' SVG Vector', '').replace(' - SVG Repo', '').trim()
        : assetId;

      // Extract license info
      const license = this.parseLicenseFromPage(html);

      return {
        id: assetId,
        repository: this.name,
        title,
        license,
        downloadedAt: Date.now(),
      };
    } catch (error) {
      console.error('[SVGRepoAdapter] Metadata error:', error);
      // Return minimal metadata on error
      return {
        id: assetId,
        repository: this.name,
        title: assetId,
        license: {
          type: 'Unknown',
          name: 'Unknown License',
          requiresAttribution: true,
          allowsCommercial: false,
        },
        downloadedAt: Date.now(),
      };
    }
  }

  /**
   * Parse search results from HTML
   */
  private parseSearchResults(html: string, limit: number): SVGRepoSearchResult[] {
    const results: SVGRepoSearchResult[] = [];

    // Look for SVG result cards in the HTML
    // Pattern: <a href="/svg/123456/icon-name">
    const linkRegex = /<a[^>]+href="(\/svg\/[^"]+)"[^>]*>/gi;
    const titleRegex = /title="([^"]+)"/i;
    const imgRegex = /<img[^>]+src="([^"]+)"/i;

    let match;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null && results.length < limit) {
      const relativeUrl = match[1];
      const fullUrl = `${this.baseUrl}${relativeUrl}`;

      // Skip duplicates
      if (seenUrls.has(fullUrl)) continue;
      seenUrls.add(fullUrl);

      // Get the surrounding HTML to extract title and image
      const startIdx = match.index;
      const endIdx = Math.min(startIdx + 500, html.length);
      const surroundingHtml = html.substring(startIdx, endIdx);

      // Extract title
      const titleMatch = surroundingHtml.match(titleRegex);
      const title = titleMatch
        ? titleMatch[1].replace(' SVG Vector', '').replace(' SVG File', '').trim()
        : relativeUrl.split('/').pop() || 'Untitled';

      // Extract preview image
      const imgMatch = surroundingHtml.match(imgRegex);
      const previewUrl = imgMatch ? imgMatch[1] : '';

      results.push({
        url: fullUrl,
        title,
        previewUrl: previewUrl.startsWith('http') ? previewUrl : `${this.baseUrl}${previewUrl}`,
      });
    }

    return results;
  }

  /**
   * Parse license information from page HTML
   */
  private parseLicenseFromPage(html: string): AssetLicense {
    // Look for license information in the HTML
    if (html.includes('CC0') || html.includes('Public Domain')) {
      return {
        type: 'CC0',
        name: 'Public Domain (CC0)',
        requiresAttribution: false,
        allowsCommercial: true,
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      };
    }

    if (html.includes('CC-BY')) {
      return {
        type: 'CC-BY-4.0',
        name: 'Creative Commons Attribution 4.0',
        requiresAttribution: true,
        allowsCommercial: true,
        url: 'https://creativecommons.org/licenses/by/4.0/',
      };
    }

    // Default to requiring attribution to be safe
    return {
      type: 'Mixed',
      name: 'Mixed Licenses (check individual asset)',
      requiresAttribution: true,
      allowsCommercial: true,
      url: this.baseUrl,
    };
  }

  /**
   * Extract download URL from asset page
   */
  private extractDownloadUrl(html: string, assetUrl: string): string | null {
    // Try to find direct download link
    // SVGRepo typically has download buttons with specific patterns
    const downloadMatch = html.match(/href="([^"]*download[^"]*)"/i);
    if (downloadMatch) {
      const url = downloadMatch[1];
      return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    }

    // Alternative: look for .svg file links
    const svgMatch = html.match(/href="([^"]*\.svg)"/i);
    if (svgMatch) {
      const url = svgMatch[1];
      return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    }

    // Fallback: try to construct download URL from asset URL
    // Pattern: /svg/123456/name -> /download/123456/name.svg
    const idMatch = assetUrl.match(/\/svg\/(\d+)\/([^/]+)/);
    if (idMatch) {
      return `${this.baseUrl}/download/${idMatch[1]}/${idMatch[2]}.svg`;
    }

    return null;
  }

  /**
   * Convert asset URL to asset ID
   */
  private urlToAssetId(url: string): string {
    // Extract ID and slug from URL
    // Format: https://www.svgrepo.com/svg/123456/icon-name
    const match = url.match(/\/svg\/(\d+)\/([^/]+)/);
    if (match) {
      return `svgrepo_${match[1]}_${match[2]}`;
    }
    // Fallback
    return `svgrepo_${Date.now()}`;
  }

  /**
   * Convert asset ID back to URL
   */
  private assetIdToUrl(assetId: string): string {
    // Format: svgrepo_123456_icon-name -> https://www.svgrepo.com/svg/123456/icon-name
    const match = assetId.match(/svgrepo_(\d+)_(.+)/);
    if (match) {
      return `${this.baseUrl}/svg/${match[1]}/${match[2]}`;
    }
    throw new Error(`Invalid SVGRepo asset ID format: ${assetId}`);
  }
}

/**
 * Create SVGRepo adapter instance
 */
export function createSVGRepoAdapter(): AssetRepository {
  return new SVGRepoAdapter();
}
