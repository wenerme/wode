import type { McpServerDef, McpServerInstance, ValidationResult } from '@wener/ai/mcp';

/**
 * Header to config property mapping
 */
export interface HeaderMapping {
	/** Header name (e.g., 'X-CLS-SECRET-ID') */
	header: string;
	/** Config property name (e.g., 'clientId') */
	property: string;
	/** Whether this header/property is required */
	required?: boolean;
	/** Default value if not provided */
	default?: string;
}

/**
 * MCP Server Handler Definition - wraps a McpServerDef with HTTP header handling
 */
export interface McpServerHandlerDef<TOptions = any, TConfig = any> {
	/** Reference to the base MCP server definition */
	base: McpServerDef<TOptions>;

	/** Unique server type name */
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

	/** Header mappings for dynamic endpoint */
	headerMappings?: HeaderMapping[];

	/** Resolve config from ServerConfig and optional Headers */
	resolveConfig: (config: TConfig, headers?: Headers) => TOptions | null;

	/** Validate resolved options */
	validateOptions: (options: Partial<TOptions>) => ValidationResult;

	/** Generate cache key for server instance caching */
	getCacheKey: (options: TOptions) => string;

	/** Factory function to create the server instance */
	create: (options: TOptions) => McpServerInstance;
}

export interface DefineMcpServerHandlerOptions<TOptions = any, TConfig = any> {
	/** Header mappings for dynamic endpoint */
	headerMappings?: HeaderMapping[];

	/** Resolve config from ServerConfig and optional Headers */
	resolveConfig: (config: TConfig, headers?: Headers) => TOptions | null;
}

/**
 * Define an MCP server handler by wrapping a base McpServerDef with HTTP header handling
 */
export function defineMcpServerHandler<TOptions = any, TConfig = any>(
	base: McpServerDef<TOptions>,
	options: DefineMcpServerHandlerOptions<TOptions, TConfig>,
): McpServerHandlerDef<TOptions, TConfig> {
	return {
		base,
		name: base.name,
		title: base.title,
		description: base.description,
		version: base.version,
		tags: [...base.tags],
		metadata: { ...base.metadata },
		headerMappings: options.headerMappings,
		resolveConfig: options.resolveConfig,
		validateOptions: base.validateOptions,
		getCacheKey: base.getCacheKey,
		create: base.create,
	};
}

const _all: McpServerHandlerDef[] = [];

/**
 * Register an MCP server handler definition
 */
export function registerMcpServerHandler(def: McpServerHandlerDef): void {
	_all.push(def);
}

/**
 * Get all registered MCP server handler definitions
 */
export function getAllMcpServerHandlerDefs(): McpServerHandlerDef[] {
	return _all;
}

/**
 * Find MCP server handler definition by name
 */
export function getMcpServerHandlerDef(name: string): McpServerHandlerDef | undefined {
	return _all.find((def) => def.name === name);
}
