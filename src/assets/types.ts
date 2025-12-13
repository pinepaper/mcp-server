/**
 * Asset Fetching Types
 *
 * Type definitions for fetching SVG assets from open repositories.
 */

/**
 * Asset license information
 */
export interface AssetLicense {
  /** License type (e.g., 'CC0', 'MIT', 'Apache-2.0', 'CC-BY-4.0') */
  type: string;

  /** License name (human-readable) */
  name: string;

  /** Whether attribution is required */
  requiresAttribution: boolean;

  /** Whether commercial use is allowed */
  allowsCommercial: boolean;

  /** License URL for more information */
  url?: string;
}

/**
 * Single asset search result
 */
export interface AssetResult {
  /** Unique asset ID (e.g., 'svgrepo_12345', 'openclipart_67890') */
  id: string;

  /** Repository name */
  repository: 'svgrepo' | 'openclipart' | 'iconify' | 'fontawesome';

  /** Asset title/name */
  title: string;

  /** Asset description (if available) */
  description?: string;

  /** Preview URL (if available) */
  previewUrl?: string;

  /** Download URL for the SVG */
  downloadUrl: string;

  /** License information */
  license: AssetLicense;

  /** Tags/categories */
  tags?: string[];

  /** Author/creator (if available) */
  author?: string;
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** Asset ID */
  id: string;

  /** Repository */
  repository: string;

  /** Title */
  title: string;

  /** License */
  license: AssetLicense;

  /** Downloaded timestamp */
  downloadedAt: number;

  /** SVG content hash (for cache invalidation) */
  contentHash?: string;
}

/**
 * Asset repository interface
 */
export interface AssetRepository {
  /** Repository name */
  name: string;

  /** Search for assets */
  search(query: string, limit: number): Promise<AssetResult[]>;

  /** Download asset SVG content */
  download(assetId: string): Promise<string>;

  /** Get asset metadata */
  getMetadata(assetId: string): Promise<AssetMetadata>;
}

/**
 * Asset cache entry
 */
export interface AssetCacheEntry {
  /** SVG content */
  svg: string;

  /** Metadata */
  metadata: AssetMetadata;

  /** Cached timestamp */
  cachedAt: number;
}
