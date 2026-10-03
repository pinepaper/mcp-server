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
 * How one repository's search ended. 'timeout' and 'error' sources are
 * reported by name rather than silently contributing zero results.
 */
export type AssetSourceStatus = 'ok' | 'timeout' | 'error';

/**
 * Upper bound on one repository's search. The adapters' fetch() calls carry no
 * timeout of their own, so one stalled connection used to hold the whole
 * aggregated search open for tens of seconds.
 */
const SOURCE_TIMEOUT_MS = 4000;

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
    return (await this.searchWithStatus(query, repository, limit)).results;
  }

  /**
   * Search, and say how each queried repository ended.
   *
   * Repositories are queried in parallel, each bounded by SOURCE_TIMEOUT_MS;
   * the results of the ones that answered in time are returned. A single
   * named repository that times out or fails throws, as before.
   */
  async searchWithStatus(
    query: string,
    repository: string = 'all',
    limit: number = 10
  ): Promise<{ results: AssetResult[]; sources: Record<string, AssetSourceStatus> }> {
    let repos: AssetRepository[];
    if (repository === 'all') {
      repos = Array.from(this.repositories.values());
    } else {
      const repo = this.repositories.get(repository);
      if (!repo) {
        throw new Error(`Repository '${repository}' not found`);
      }
      repos = [repo];
    }

    const outcomes = await Promise.all(repos.map((repo) => this.searchOne(repo, query, limit)));

    const results: AssetResult[] = [];
    const sources: Record<string, AssetSourceStatus> = {};
    for (const outcome of outcomes) {
      sources[outcome.name] = outcome.status;
      results.push(...outcome.results);
    }

    if (repository !== 'all' && sources[repository] !== 'ok') {
      throw new Error(`Repository '${repository}' search ${sources[repository] === 'timeout' ? `timed out after ${SOURCE_TIMEOUT_MS}ms` : 'failed'}`);
    }

    // Sort by relevance (for now, just return as-is)
    // In production, implement relevance scoring
    return { results: results.slice(0, limit), sources };
  }

  /**
   * One repository's search, bounded by SOURCE_TIMEOUT_MS. Never throws.
   */
  private async searchOne(
    repo: AssetRepository,
    query: string,
    limit: number
  ): Promise<{ name: string; status: AssetSourceStatus; results: AssetResult[] }> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), SOURCE_TIMEOUT_MS);
    });

    try {
      const outcome = await Promise.race([repo.search(query, limit), timeout]);
      if (outcome === 'timeout') {
        console.error(`[AssetManager] ${repo.name} did not answer within ${SOURCE_TIMEOUT_MS}ms`);
        return { name: repo.name, status: 'timeout', results: [] };
      }
      return { name: repo.name, status: 'ok', results: outcome };
    } catch (error) {
      console.error(`[AssetManager] Error searching ${repo.name}:`, error);
      return { name: repo.name, status: 'error', results: [] };
    } finally {
      clearTimeout(timer);
    }
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
