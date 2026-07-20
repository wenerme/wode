/**
 * API Client - HTTP request execution
 */

import { debug, getTimeoutMs } from './config';
import { buildRequest, filterOperations, listOperations, loadSpec } from './openapi';
import type { ParsedOperation, ParsedSpec, ServerConfig } from './schema';

// Re-export
export { debug, getTimeoutMs };

/**
 * Loaded API client
 */
export interface ApiClient {
	spec: ParsedSpec;
	baseUrl: string;
	headers: Record<string, string>;
	include?: string[] | null;
	exclude?: string[] | null;
}

/**
 * Operation info for display
 */
export interface OperationInfo {
	operationId: string;
	method: string;
	path: string;
	summary?: string;
	description?: string;
	tags: string[];
}

/**
 * API response
 */
export interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: unknown;
}

/**
 * Load API client from server config
 */
export async function loadApiClient(serverConfig: ServerConfig): Promise<ApiClient> {
	const spec = await loadSpec(serverConfig);

	// Determine base URL
	let baseUrl = serverConfig.baseUrl;
	if (!baseUrl) {
		// Try to get from spec servers
		if (spec.servers.length > 0) {
			baseUrl = spec.servers[0].url;
		} else {
			throw new Error('No baseUrl specified and no servers found in OpenAPI spec');
		}
	}

	// Normalize base URL
	if (baseUrl.startsWith('/')) {
		// Relative URL - try to get host from spec URL
		const specUrl = serverConfig.url;
		if (specUrl.startsWith('http')) {
			const url = new URL(specUrl);
			baseUrl = `${url.protocol}//${url.host}${baseUrl}`;
		}
	}

	return {
		spec,
		baseUrl,
		headers: serverConfig.headers || {},
		include: serverConfig.include,
		exclude: serverConfig.exclude,
	};
}

/**
 * List operations from API client (filtered by include/exclude)
 */
export function getOperations(client: ApiClient): OperationInfo[] {
	const operations = getFilteredOperations(client);
	return operations.map((op) => ({
		operationId: op.operationId,
		method: op.method,
		path: op.path,
		summary: op.summary,
		description: op.description,
		tags: op.tags,
	}));
}

/**
 * Get filtered operations from client (internal helper)
 */
function getFilteredOperations(client: ApiClient): ParsedOperation[] {
	return filterOperations(listOperations(client.spec), client.include, client.exclude);
}

/**
 * Find operation by ID or method+path
 * @param client API client
 * @param target Operation target (operationId, METHOD/path, /path, or path when method is specified)
 * @param method Optional HTTP method - when specified, target is treated as path
 */
export function findOperation(
	client: ApiClient,
	target: string,
	method?: string,
): { operation: ParsedOperation; pathParams?: Record<string, string> } | undefined {
	const filteredOps = getFilteredOperations(client);

	// Helper to find operation by operationId in filtered list
	const findById = (opId: string) => filteredOps.find((op) => op.operationId === opId);

	// Helper to find operation by method and path in filtered list
	const findByMethodPath = (m: string, p: string) =>
		filteredOps.find((op) => op.method.toUpperCase() === m.toUpperCase() && op.path === p);

	// If method is specified, treat target as path
	if (method) {
		const methodUpper = method.toUpperCase();
		let path = target.startsWith('/') ? target : `/${target}`;

		// First try exact match
		const exact = findByMethodPath(methodUpper, path);
		if (exact) {
			return { operation: exact };
		}

		// Try matching with path parameters
		for (const op of filteredOps) {
			if (op.method.toUpperCase() !== methodUpper) continue;

			const pathParams = matchPathWithParams(op.path, path);
			if (pathParams) {
				return { operation: op, pathParams };
			}
		}

		// Try by operationId as fallback
		const byId = findById(target);
		if (byId && byId.method.toUpperCase() === methodUpper) {
			return { operation: byId };
		}

		return undefined;
	}

	// Try by operationId first
	const byId = findById(target);
	if (byId) {
		return { operation: byId };
	}

	// Try as METHOD/path (e.g., GET/pet/1)
	const methodMatch = target.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\/(.+)$/i);
	if (methodMatch) {
		const matchedMethod = methodMatch[1].toUpperCase();
		let path = `/${methodMatch[2]}`;

		// First try exact match
		const exact = findByMethodPath(matchedMethod, path);
		if (exact) {
			return { operation: exact };
		}

		// Try matching with path parameters
		// e.g., GET/pet/123 should match /pet/{petId}
		for (const op of filteredOps) {
			if (op.method.toUpperCase() !== matchedMethod) continue;

			const pathParams = matchPathWithParams(op.path, path);
			if (pathParams) {
				return { operation: op, pathParams };
			}
		}
	}

	// Try as path-only (starts with / or looks like a path)
	// This allows: info server/api/v1/users or info server/users
	if (target.includes('/') || !target.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
		let path = target.startsWith('/') ? target : `/${target}`;

		// Try exact path match (any method)
		for (const op of filteredOps) {
			if (op.path === path) {
				return { operation: op };
			}
		}

		// Try matching with path parameters (any method)
		for (const op of filteredOps) {
			const pathParams = matchPathWithParams(op.path, path);
			if (pathParams) {
				return { operation: op, pathParams };
			}
		}
	}

	return undefined;
}

/**
 * Find all operations matching a path (for info command)
 * Returns all methods for a given path
 */
export function findOperationsByPath(
	client: ApiClient,
	target: string,
): Array<{ operation: ParsedOperation; pathParams?: Record<string, string> }> {
	const filteredOps = getFilteredOperations(client);
	const results: Array<{ operation: ParsedOperation; pathParams?: Record<string, string> }> = [];
	let path = target.startsWith('/') ? target : `/${target}`;

	// Try exact path match
	for (const op of filteredOps) {
		if (op.path === path) {
			results.push({ operation: op });
		}
	}

	if (results.length > 0) {
		return results;
	}

	// Try matching with path parameters
	for (const op of filteredOps) {
		const pathParams = matchPathWithParams(op.path, path);
		if (pathParams) {
			results.push({ operation: op, pathParams });
		}
	}

	return results;
}

/**
 * Match a concrete path against a path template
 * Returns extracted parameters or undefined if no match
 */
function matchPathWithParams(template: string, path: string): Record<string, string> | undefined {
	// Convert template to regex
	// /pet/{petId} -> /pet/([^/]+)
	const paramNames: string[] = [];
	const regexPattern = template.replace(/\{([^}]+)\}/g, (_, paramName) => {
		paramNames.push(paramName);
		return '([^/]+)';
	});

	const regex = new RegExp(`^${regexPattern}$`);
	const match = path.match(regex);

	if (!match) return undefined;

	const params: Record<string, string> = {};
	for (let i = 0; i < paramNames.length; i++) {
		params[paramNames[i]] = decodeURIComponent(match[i + 1]);
	}

	return params;
}

/**
 * Execute an API operation
 */
export async function executeOperation(
	client: ApiClient,
	operation: ParsedOperation,
	args: Record<string, unknown>,
): Promise<ApiResponse> {
	const request = buildRequest(operation, args, client.baseUrl, client.headers);

	debug(`Request: ${request.method} ${request.url}`);
	if (request.body) {
		debug(`Body: ${JSON.stringify(request.body)}`);
	}

	const timeoutMs = getTimeoutMs();
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const fetchOptions: RequestInit = {
			method: request.method,
			headers: request.headers,
			signal: controller.signal,
		};

		if (request.body !== undefined) {
			fetchOptions.body = JSON.stringify(request.body);
		}

		const response = await fetch(request.url, fetchOptions);

		// Parse response headers
		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		// Parse response body
		let body: unknown;
		const contentType = response.headers.get('content-type') || '';

		if (contentType.includes('json')) {
			try {
				body = await response.json();
			} catch {
				body = await response.text();
			}
		} else {
			body = await response.text();
		}

		debug(`Response: ${response.status} ${response.statusText}`);

		return {
			status: response.status,
			statusText: response.statusText,
			headers,
			body,
		};
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Get detailed operation info
 */
export function getOperationDetails(client: ApiClient, operationId: string): ParsedOperation | undefined {
	const filteredOps = getFilteredOperations(client);
	return filteredOps.find((op) => op.operationId === operationId);
}
