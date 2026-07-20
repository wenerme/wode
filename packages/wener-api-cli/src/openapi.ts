/**
 * OpenAPI Spec Parsing and Normalization
 */

import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { debug, getTimeoutMs } from './config';
import type {
	ParameterInfo,
	ParameterLocation,
	ParsedOperation,
	ParsedSpec,
	RequestBodyInfo,
	RequestConfig,
	ResponseInfo,
	ServerConfig,
} from './schema';

/**
 * Spec cache for session
 */
const specCache = new Map<string, ParsedSpec>();

/**
 * Load and parse OpenAPI spec from URL or file path
 */
export async function loadSpec(serverConfig: ServerConfig): Promise<ParsedSpec> {
	const url = serverConfig.url;

	// Check cache
	if (specCache.has(url)) {
		debug(`Using cached spec for ${url}`);
		return specCache.get(url)!;
	}

	let content: string;

	if (url.startsWith('http://') || url.startsWith('https://')) {
		// Fetch from URL
		const timeoutMs = getTimeoutMs();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				signal: controller.signal,
				headers: serverConfig.headers ?? undefined,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			content = await response.text();
		} finally {
			clearTimeout(timeoutId);
		}
	} else {
		// Read from file
		content = readFileSync(url, 'utf-8');
	}

	const spec = parseOpenApiSpec(content, url);
	specCache.set(url, spec);

	return spec;
}

/**
 * Parse OpenAPI spec content (JSON or YAML)
 */
export function parseOpenApiSpec(content: string, sourceUrl?: string): ParsedSpec {
	let raw: Record<string, unknown>;

	// Try JSON first, then YAML
	try {
		raw = JSON.parse(content);
	} catch {
		try {
			raw = parseYaml(content) as Record<string, unknown>;
		} catch (e) {
			throw new Error(`Failed to parse OpenAPI spec as JSON or YAML: ${(e as Error).message}`);
		}
	}

	// Validate it's an OpenAPI spec
	if (!raw.openapi && !raw.swagger) {
		throw new Error('Invalid OpenAPI spec: missing "openapi" or "swagger" field');
	}

	// Extract info
	const rawInfo = raw.info as Record<string, unknown> | undefined;
	const info = {
		title: (rawInfo?.title as string) || 'Unknown API',
		version: (rawInfo?.version as string) || '0.0.0',
		description: rawInfo?.description as string | undefined,
	};

	// Extract servers
	const rawServers = (raw.servers as Array<{ url: string; description?: string }>) || [];
	const servers = rawServers.map((s) => ({
		url: s.url,
		description: s.description,
	}));

	// Handle Swagger 2.x basePath
	if (raw.swagger && raw.basePath) {
		const host = raw.host || 'localhost';
		const scheme = ((raw.schemes as string[]) || ['https'])[0];
		servers.push({ url: `${scheme}://${host}${raw.basePath}`, description: undefined });
	}

	// Parse operations from paths
	const operations = parseOperations(raw, sourceUrl);

	return { info, servers, operations };
}

/**
 * Parse operations from OpenAPI paths
 */
function parseOperations(spec: Record<string, unknown>, _sourceUrl?: string): ParsedOperation[] {
	const operations: ParsedOperation[] = [];
	const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;

	if (!paths) return operations;

	const components = spec.components as Record<string, unknown> | undefined;

	for (const [path, pathItem] of Object.entries(paths)) {
		if (!pathItem || typeof pathItem !== 'object') continue;

		// Get path-level parameters
		const pathParams = (pathItem.parameters as unknown[]) || [];

		const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

		for (const method of methods) {
			const operation = pathItem[method] as Record<string, unknown> | undefined;
			if (!operation) continue;

			// Generate operationId if not present
			const operationId =
				(operation.operationId as string) || `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;

			// Merge path and operation parameters
			const operationParams = (operation.parameters as unknown[]) || [];
			const allParams = [...pathParams, ...operationParams];

			// Parse parameters
			const parameters = parseParameters(allParams, components);

			// Parse request body
			const requestBody = parseRequestBody(operation.requestBody, components);

			// Parse responses
			const responses = parseResponses(operation.responses as Record<string, unknown> | undefined, components);

			operations.push({
				operationId,
				method: method.toUpperCase(),
				path,
				summary: operation.summary as string | undefined,
				description: operation.description as string | undefined,
				tags: (operation.tags as string[]) || [],
				parameters,
				requestBody,
				responses,
			});
		}
	}

	return operations;
}

/**
 * Parse parameters array
 */
function parseParameters(params: unknown[], components?: Record<string, unknown>): ParameterInfo[] {
	const result: ParameterInfo[] = [];

	for (const param of params) {
		const resolved = resolveRef(param, components);
		if (!resolved || typeof resolved !== 'object') continue;

		const p = resolved as Record<string, unknown>;

		result.push({
			name: p.name as string,
			in: p.in as ParameterLocation,
			required: (p.required as boolean) || p.in === 'path',
			schema: (p.schema as Record<string, unknown>) || { type: 'string' },
			description: p.description as string | undefined,
		});
	}

	return result;
}

/**
 * Parse request body
 */
function parseRequestBody(body: unknown, components?: Record<string, unknown>): RequestBodyInfo | undefined {
	if (!body) return undefined;

	const resolved = resolveRef(body, components);
	if (!resolved || typeof resolved !== 'object') return undefined;

	const b = resolved as Record<string, unknown>;
	const content = b.content as Record<string, unknown> | undefined;

	if (!content) return undefined;

	// Prefer JSON content type
	const contentType = Object.keys(content).find((ct) => ct.includes('json')) || Object.keys(content)[0];

	if (!contentType) return undefined;

	const contentSpec = content[contentType] as Record<string, unknown>;
	const schema = resolveRef(contentSpec?.schema, components) as Record<string, unknown> | undefined;

	return {
		required: (b.required as boolean) || false,
		contentType,
		schema: schema || {},
		description: b.description as string | undefined,
	};
}

/**
 * Parse responses
 */
function parseResponses(
	responses: Record<string, unknown> | undefined,
	components?: Record<string, unknown>,
): Record<string, ResponseInfo> {
	const result: Record<string, ResponseInfo> = {};

	if (!responses) return result;

	for (const [statusCode, response] of Object.entries(responses)) {
		const resolved = resolveRef(response, components);
		if (!resolved || typeof resolved !== 'object') continue;

		const r = resolved as Record<string, unknown>;
		const content = r.content as Record<string, unknown> | undefined;

		let schema: Record<string, unknown> | undefined;
		if (content) {
			const contentType = Object.keys(content).find((ct) => ct.includes('json')) || Object.keys(content)[0];
			if (contentType) {
				const contentSpec = content[contentType] as Record<string, unknown>;
				schema = resolveRef(contentSpec?.schema, components) as Record<string, unknown> | undefined;
			}
		}

		result[statusCode] = {
			statusCode,
			description: r.description as string | undefined,
			schema,
		};
	}

	return result;
}

/**
 * Resolve $ref references
 */
function resolveRef(obj: unknown, components?: Record<string, unknown>): unknown {
	if (!obj || typeof obj !== 'object') return obj;

	const o = obj as Record<string, unknown>;
	if (!o.$ref || typeof o.$ref !== 'string') return obj;

	const ref = o.$ref;

	// Handle local references: #/components/...
	if (ref.startsWith('#/')) {
		const path = ref.slice(2).split('/');
		let current: unknown = { components };

		for (const segment of path) {
			if (!current || typeof current !== 'object') return obj;
			current = (current as Record<string, unknown>)[segment];
		}

		// Recursively resolve nested refs
		return resolveRef(current, components);
	}

	return obj;
}

/**
 * List all operations from a spec
 */
export function listOperations(spec: ParsedSpec): ParsedOperation[] {
	return spec.operations;
}

/**
 * Get operation by operationId
 */
export function getOperation(spec: ParsedSpec, operationId: string): ParsedOperation | undefined {
	return spec.operations.find((op) => op.operationId === operationId);
}

/**
 * Get operation by method and path
 */
export function getOperationByPath(spec: ParsedSpec, method: string, path: string): ParsedOperation | undefined {
	return spec.operations.find((op) => op.method.toUpperCase() === method.toUpperCase() && op.path === path);
}

/**
 * Build HTTP request from operation and arguments
 */
export function buildRequest(
	operation: ParsedOperation,
	args: Record<string, unknown>,
	baseUrl: string,
	defaultHeaders: Record<string, string> = {},
): RequestConfig {
	const headers: Record<string, string> = { ...defaultHeaders };
	const queryParams: Record<string, string> = {};
	let path = operation.path;
	let body: unknown;

	// Separate args by parameter location
	const usedArgs = new Set<string>();

	for (const param of operation.parameters) {
		const value = args[param.name];
		if (value === undefined) continue;

		usedArgs.add(param.name);
		const stringValue = String(value);

		switch (param.in) {
			case 'path':
				path = path.replace(`{${param.name}}`, encodeURIComponent(stringValue));
				break;
			case 'query':
				queryParams[param.name] = stringValue;
				break;
			case 'header':
				headers[param.name] = stringValue;
				break;
		}
	}

	// Remaining args go to request body
	if (operation.requestBody) {
		const bodyArgs: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(args)) {
			if (!usedArgs.has(key)) {
				bodyArgs[key] = value;
			}
		}
		if (Object.keys(bodyArgs).length > 0) {
			body = bodyArgs;
		}

		// Set content type
		if (operation.requestBody.contentType && !headers['Content-Type']) {
			headers['Content-Type'] = operation.requestBody.contentType;
		}
	} else if (Object.keys(args).length > usedArgs.size) {
		// No request body defined but we have extra args - send as body anyway
		const bodyArgs: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(args)) {
			if (!usedArgs.has(key)) {
				bodyArgs[key] = value;
			}
		}
		if (Object.keys(bodyArgs).length > 0) {
			body = bodyArgs;
			if (!headers['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}
		}
	}

	// Build URL
	let url = baseUrl.replace(/\/$/, '') + path;
	const queryString = new URLSearchParams(queryParams).toString();
	if (queryString) {
		url += `?${queryString}`;
	}

	return {
		method: operation.method,
		url,
		headers,
		body,
	};
}

/**
 * Clear the spec cache
 */
export function clearSpecCache(): void {
	specCache.clear();
}

/**
 * Convert glob pattern to regex
 * Supports: * (any chars except /), ? (single char), ** (any path including /)
 */
function globToRegex(pattern: string): RegExp {
	let p: string;

	// Handle trailing /** (should match zero or more path segments)
	if (pattern.endsWith('/**')) {
		const prefix = pattern.slice(0, -3);
		const escapedPrefix = prefix
			.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			.replace(/\*\*/g, '.*')
			.replace(/\*/g, '[^/]*')
			.replace(/\?/g, '.');
		p = `${escapedPrefix}(?:/.*)?`;
	} else {
		p = pattern
			.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			.replace(/\*\*/g, '.*')
			.replace(/\*/g, '[^/]*')
			.replace(/\?/g, '.');
	}

	return new RegExp(`^${p}$`, 'i');
}

/**
 * Check if an operation matches a glob pattern
 * Matches against: operationId, path, METHOD path, tags
 */
function operationMatchesPattern(op: ParsedOperation, pattern: string): boolean {
	const regex = globToRegex(pattern);

	// Match operationId
	if (regex.test(op.operationId)) return true;

	// Match path (e.g., /pet/*, /api/**/users)
	if (regex.test(op.path)) return true;

	// Match METHOD path (e.g., GET /pet/*, POST /api/**)
	if (regex.test(`${op.method} ${op.path}`)) return true;
	if (regex.test(`${op.method.toLowerCase()} ${op.path}`)) return true;

	// Match tags (e.g., pet, store)
	for (const tag of op.tags) {
		if (regex.test(tag)) return true;
	}

	return false;
}

/**
 * Filter operations based on include/exclude patterns
 * - If include is specified, only operations matching at least one pattern are included
 * - If exclude is specified, operations matching any pattern are excluded
 * - Exclude takes precedence over include
 */
export function filterOperations(
	operations: ParsedOperation[],
	include?: string[] | null,
	exclude?: string[] | null,
): ParsedOperation[] {
	let filtered = operations;

	// Apply include filter (whitelist)
	if (include && include.length > 0) {
		filtered = filtered.filter((op) => include.some((pattern) => operationMatchesPattern(op, pattern)));
	}

	// Apply exclude filter (blacklist) - takes precedence
	if (exclude && exclude.length > 0) {
		filtered = filtered.filter((op) => !exclude.some((pattern) => operationMatchesPattern(op, pattern)));
	}

	return filtered;
}
