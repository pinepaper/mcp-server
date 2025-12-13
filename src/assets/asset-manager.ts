/**
 * Asset Manager
 *
 * Coordinates asset searching, downloading, and caching across multiple repositories.
 */

import { AssetRepository, AssetResult, AssetMetadata, AssetCacheEntry } from './types.js';
import { createSVGRepoAdapter } from './repositories/svgrepo.js';
import { createOpenClipartAdapter } from './repositories/openclipart.js';
import { createIconifyAdapter } from './repositories/iconify.js';
import { createFontAwesomeAdapter } from './repositories/fontawesome.js';

/**
 * Asset Manager configuration
 */
export interface AssetManagerConfig {
  /** Cache directory (default: .pinepaper-cache/assets) */
  cacheDir?: string;

  /** Enable caching (default: true) */
  enableCache?: boolean;

  /** Maximum cache size in MB (default: 100) */
  maxCacheSizeMB?: number;

  /** Repositories to enable (default: all) */
  repositories?: ('svgrepo' | 'openclipart' | 'iconify' | 'fontawesome')[];
}

/**
 * Asset Manager
 *
 * Provides unified interface for searching and downloading assets from multiple repositories.
 */
export class AssetManager {
  private repositories: Map<string, AssetRepository> = new Map();
  private cache: Map<string, AssetCacheEntry> = new Map();
  private config: AssetManagerConfig;

  constructor(config: AssetManagerConfig = {}) {
    this.config = {
      cacheDir: config.cacheDir || '.pinepaper-cache/assets',
      enableCache: config.enableCache ?? true,
      maxCacheSizeMB: config.maxCacheSizeMB || 100,
      repositories: config.repositories || ['svgrepo', 'openclipart', 'iconify', 'fontawesome'],
    };

    // Register default repositories based on config
    if (this.config.repositories?.includes('svgrepo')) {
      this.registerRepository(createSVGRepoAdapter());
    }
    if (this.config.repositories?.includes('openclipart')) {
      this.registerRepository(createOpenClipartAdapter());
    }
    if (this.config.repositories?.includes('iconify')) {
      this.registerRepository(createIconifyAdapter());
    }
    if (this.config.repositories?.includes('fontawesome')) {
      this.registerRepository(createFontAwesomeAdapter());
    }
  }

  /**
   * Register an asset repository
   */
  registerRepository(repository: AssetRepository): void {
    this.repositories.set(repository.name, repository);
  }

  /**
   * Search for assets across repositories
   *
   * @param query Search term
   * @param repository Specific repository to search (or 'all' for all repositories)
   * @param limit Maximum results per repository
   */
  async search(
    query: string,
    repository: string = 'all',
    limit: number = 10
  ): Promise<AssetResult[]> {
    const results: AssetResult[] = [];

    if (repository === 'all') {
      // Search all repositories
      for (const [_, repo] of this.repositories) {
        try {
          const repoResults = await repo.search(query, limit);
          results.push(...repoResults);
        } catch (error) {
          console.error(`[AssetManager] Error searching ${repo.name}:`, error);
          // Continue with other repositories
        }
      }
    } else {
      // Search specific repository
      const repo = this.repositories.get(repository);
      if (!repo) {
        throw new Error(`Repository '${repository}' not found`);
      }

      const repoResults = await repo.search(query, limit);
      results.push(...repoResults);
    }

    // Sort by relevance (for now, just return as-is)
    // In production, implement relevance scoring
    return results.slice(0, limit);
  }

  /**
   * Download asset SVG content
   *
   * @param assetId Asset ID from search results
   */
  async download(assetId: string): Promise<{ svg: string; metadata: AssetMetadata }> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(assetId);
      if (cached) {
        return {
          svg: cached.svg,
          metadata: cached.metadata,
        };
      }
    }

    // Extract repository from asset ID (format: "repository_id")
    const parts = assetId.split('_');
    const repositoryName = parts[0];

    const repository = this.repositories.get(repositoryName);
    if (!repository) {
      throw new Error(`Repository '${repositoryName}' not found in asset ID: ${assetId}`);
    }

    // Download asset
    const svg = await repository.download(assetId);
    const metadata = await repository.getMetadata(assetId);

    // Cache the result
    if (this.config.enableCache) {
      this.cache.set(assetId, {
        svg,
        metadata,
        cachedAt: Date.now(),
      });
    }

    return { svg, metadata };
  }

  /**
   * Get asset from cache
   */
  getCached(assetId: string): AssetCacheEntry | null {
    return this.cache.get(assetId) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global singleton instance
let globalAssetManager: AssetManager | null = null;

/**
 * Get or create the global asset manager instance
 */
export function getAssetManager(config?: AssetManagerConfig): AssetManager {
  if (!globalAssetManager) {
    globalAssetManager = new AssetManager(config);
  }
  return globalAssetManager;
}

/**
 * Reset the global asset manager (mainly for testing)
 */
export function resetAssetManager(): void {
  globalAssetManager = null;
}
