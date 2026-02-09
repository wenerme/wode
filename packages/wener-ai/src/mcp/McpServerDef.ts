import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface McpServerInstance {
	server: McpServer;
	close: () => Promise<void>;
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Pure MCP Server Definition - no HTTP/header handling
 */
export interface McpServerDef<TOptions = any> {
	/** Unique server type name (e.g., 'prometheus', 'tencent-cls') */
	name: string;
	/** Display name */
	title: string;
	/** Server description */
	description: string;
	/** Server version */
	version: string;
	/** Tags for categorization */
	tags: string[];
	/** Additional metadata */
	metadata: Record<string, any>;

	/** Validate resolved options */
	validateOptions: (options: Partial<TOptions>) => ValidationResult;

	/** Generate cache key for server instance caching */
	getCacheKey: (options: TOptions) => string;

	/** Factory function to create the server instance */
	create: (options: TOptions) => McpServerInstance;
}

export type DefineMcpServerOptions<TOptions = any> = Omit<McpServerDef<TOptions>, 'metadata' | 'tags'> & {
	tags?: string[];
	metadata?: Record<string, any>;
};

export function defineMcpServer<TOptions = any>(options: DefineMcpServerOptions<TOptions>): McpServerDef<TOptions> {
	return {
		tags: [],
		metadata: {},
		...options,
	};
}
