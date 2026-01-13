/**
 * API-CLI Schema Definitions
 * Zod schemas for configuration and OpenAPI types
 */

import { z } from 'zod';

/**
 * Server configuration for OpenAPI
 */
export const ServerConfigSchema = z.object({
	url: z.string(), // OpenAPI spec URL (JSON or YAML)
	baseUrl: z.string().nullish(), // API base URL (auto-detected from spec if not provided)
	headers: z.record(z.string()).nullish(), // Default headers for all requests
	type: z.literal('openapi').default('openapi'),
	include: z.array(z.string()).nullish(), // Glob patterns to include operations (matches operationId, path, tags)
	exclude: z.array(z.string()).nullish(), // Glob patterns to exclude operations
});
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * API-CLI config format
 */
export const ApiCliConfigSchema = z.object({
	env: z.record(z.string()).nullish(), // Environment variables to set before substitution
	servers: z.record(ServerConfigSchema).nullish(),
});
export type ApiCliConfig = z.infer<typeof ApiCliConfigSchema>;

/**
 * Config source information
 */
export interface ConfigSource {
	path: string;
	label: string;
}

/**
 * Server with source tracking
 */
export interface ServerWithSource {
	name: string;
	config: ServerConfig;
	source: ConfigSource;
}

/**
 * Merged configuration from all sources
 */
export interface MergedConfig {
	servers: Map<string, ServerWithSource>;
	sources: ConfigSource[];
	duplicates: Array<{ name: string; sources: ConfigSource[] }>;
}

/**
 * OpenAPI parameter types
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';

/**
 * Parsed parameter info
 */
export interface ParameterInfo {
	name: string;
	in: ParameterLocation;
	required: boolean;
	schema: Record<string, unknown>;
	description?: string;
}

/**
 * Request body info
 */
export interface RequestBodyInfo {
	required: boolean;
	contentType: string;
	schema: Record<string, unknown>;
	description?: string;
}

/**
 * Response info
 */
export interface ResponseInfo {
	statusCode: string;
	description?: string;
	schema?: Record<string, unknown>;
}

/**
 * Parsed operation from OpenAPI spec
 */
export interface ParsedOperation {
	operationId: string;
	method: string;
	path: string;
	summary?: string;
	description?: string;
	tags: string[];
	parameters: ParameterInfo[];
	requestBody?: RequestBodyInfo;
	responses: Record<string, ResponseInfo>;
}

/**
 * OpenAPI spec info
 */
export interface OpenApiInfo {
	title: string;
	version: string;
	description?: string;
}

/**
 * Parsed OpenAPI spec
 */
export interface ParsedSpec {
	info: OpenApiInfo;
	servers: Array<{ url: string; description?: string }>;
	operations: ParsedOperation[];
}

/**
 * HTTP request config for API calls
 */
export interface RequestConfig {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: unknown;
}
