/**
 * PinePaper MCP Server - Transport Factory
 *
 * This module provides a unified interface for creating server transports.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// =============================================================================
// TYPES
// =============================================================================

export type TransportType = 'stdio';

export interface TransportConfig {
  type: TransportType;
}

export interface TransportResult {
  transport: StdioServerTransport;
  type: TransportType;
  info: {
    description: string;
  };
}

// =============================================================================
// TRANSPORT FACTORY
// =============================================================================

/**
 * Create a transport based on configuration
 *
 * @param config - Transport configuration
 * @returns Transport instance
 */
export function createTransport(config: TransportConfig): TransportResult {
  if (config.type === 'stdio') {
    return {
      transport: new StdioServerTransport(),
      type: 'stdio',
      info: {
        description: 'Standard I/O transport for local use with Claude Desktop',
      },
    };
  }

  throw new Error(`Unknown transport type: ${config.type}`);
}

/**
 * Get available transport types
 */
export function getAvailableTransports(): TransportType[] {
  return ['stdio'];
}
