/**
 * MCP Client - Connection management for MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Resource, Tool } from '@modelcontextprotocol/sdk/types.js';
import { debug, getConcurrencyLimit, getMaxRetries, getRetryDelayMs, getTimeoutMs } from './config';
import { getServerUrl, isHttpServer, type HttpServerConfig, type ServerConfig, type StdioServerConfig } from './schema';

// Re-export for convenience
export { debug, getTimeoutMs, getConcurrencyLimit };

export interface ConnectedClient {
	client: Client;
	close: () => Promise<void>;
}

export interface ServerInfo {
	name: string;
	version?: string;
	protocolVersion?: string;
}

export interface ToolInfo {
	name: string;
	description?: string;
	inputSchema: Record<string, unknown>;
}

export interface ResourceInfo {
	name: string;
	uri: string;
	description?: string;
	mimeType?: string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
	maxRetries: number;
	baseDelayMs: number;
	maxDelayMs: number;
	totalBudgetMs: number;
}

/**
 * Get retry config respecting MCP_TIMEOUT budget
 */
function getRetryConfig(): RetryConfig {
	const totalBudgetMs = getTimeoutMs();
	const maxRetries = getMaxRetries();
	const baseDelayMs = getRetryDelayMs();

	const retryBudgetMs = Math.max(0, totalBudgetMs - 5000);

	return {
		maxRetries,
		baseDelayMs,
		maxDelayMs: Math.min(10000, retryBudgetMs / 2),
		totalBudgetMs,
	};
}

/**
 * Check if an error is transient and worth retrying
 */
export function isTransientError(error: Error): boolean {
	const nodeError = error as NodeJS.ErrnoException;
	if (nodeError.code) {
		const transientCodes = [
			'ECONNREFUSED',
			'ECONNRESET',
			'ETIMEDOUT',
			'ENOTFOUND',
			'EPIPE',
			'ENETUNREACH',
			'EHOSTUNREACH',
			'EAI_AGAIN',
		];
		if (transientCodes.includes(nodeError.code)) {
			return true;
		}
	}

	const message = error.message;
	if (/^(502|503|504|429)\b/.test(message)) return true;
	if (/\b(http|status(\s+code)?)\s*(502|503|504|429)\b/i.test(message)) return true;
	if (/network\s*(error|fail|unavailable|timeout)/i.test(message)) return true;
	if (/connection\s*(reset|refused|timeout)/i.test(message)) return true;
	if (/\btimeout\b/i.test(message)) return true;

	return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
	const exponentialDelay = config.baseDelayMs * 2 ** attempt;
	const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
	const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
	return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	operationName: string,
	config: RetryConfig = getRetryConfig(),
): Promise<T> {
	let lastError: Error | undefined;
	const startTime = Date.now();

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		const elapsed = Date.now() - startTime;
		if (elapsed >= config.totalBudgetMs) {
			debug(`${operationName}: timeout budget exhausted after ${elapsed}ms`);
			break;
		}

		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			const remainingBudget = config.totalBudgetMs - (Date.now() - startTime);
			const shouldRetry = attempt < config.maxRetries && isTransientError(lastError) && remainingBudget > 1000;

			if (shouldRetry) {
				const delay = Math.min(calculateDelay(attempt, config), remainingBudget - 1000);
				debug(
					`${operationName} failed (attempt ${attempt + 1}/${config.maxRetries + 1}): ${lastError.message}. Retrying in ${delay}ms...`,
				);
				await sleep(delay);
			} else {
				throw lastError;
			}
		}
	}

	throw lastError;
}

/**
 * Safely close a connection
 */
export async function safeClose(close: () => Promise<void>): Promise<void> {
	try {
		await close();
	} catch (err) {
		debug(`Failed to close connection: ${(err as Error).message}`);
	}
}

/**
 * Connect to an MCP server with retry logic
 */
export async function connectToServer(serverName: string, config: ServerConfig): Promise<ConnectedClient> {
	return withRetry(async () => {
		const client = new Client(
			{
				name: 'mcp-cli',
				version: '0.1.0',
			},
			{
				capabilities: {},
			},
		);

		let transport: StdioClientTransport | StreamableHTTPClientTransport;

		if (isHttpServer(config)) {
			transport = createHttpTransport(config);
		} else {
			transport = createStdioTransport(config);
		}

		await client.connect(transport);

		return {
			client,
			close: async () => {
				await client.close();
			},
		};
	}, `connect to ${serverName}`);
}

/**
 * Create HTTP transport for remote servers
 */
function createHttpTransport(config: HttpServerConfig): StreamableHTTPClientTransport {
	const url = new URL(getServerUrl(config));

	return new StreamableHTTPClientTransport(url, {
		requestInit: {
			headers: config.headers,
		},
	});
}

/**
 * Create stdio transport for local servers
 */
function createStdioTransport(config: StdioServerConfig): StdioClientTransport {
	const mergedEnv: Record<string, string> = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value !== undefined) {
			mergedEnv[key] = value;
		}
	}
	if (config.env) {
		Object.assign(mergedEnv, config.env);
	}

	return new StdioClientTransport({
		command: config.command,
		args: config.args,
		env: mergedEnv,
		cwd: config.cwd,
		// Suppress server banner/startup output by piping stderr instead of inheriting
		// This prevents servers like chrome-devtools-mcp from printing their banners
		stderr: 'pipe',
	});
}

/**
 * List all tools from a connected client
 */
export async function listTools(client: Client): Promise<ToolInfo[]> {
	return withRetry(async () => {
		const result = await client.listTools();
		return result.tools.map((tool: Tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema as Record<string, unknown>,
		}));
	}, 'list tools');
}

/**
 * Get a specific tool by name
 */
export async function getTool(client: Client, toolName: string): Promise<ToolInfo | undefined> {
	const tools = await listTools(client);
	return tools.find((t) => t.name === toolName);
}

/**
 * Call a tool with arguments
 */
export async function callTool(client: Client, toolName: string, args: Record<string, unknown>): Promise<unknown> {
	return withRetry(async () => {
		const result = await client.callTool({
			name: toolName,
			arguments: args,
		});
		return result;
	}, `call tool ${toolName}`);
}

/**
 * List all resources from a connected client
 */
export async function listResources(client: Client): Promise<ResourceInfo[]> {
	return withRetry(async () => {
		const result = await client.listResources();
		return result.resources.map((resource: Resource) => ({
			name: resource.name,
			uri: resource.uri,
			description: resource.description,
			mimeType: resource.mimeType,
		}));
	}, 'list resources');
}

/**
 * Read a resource by URI
 */
export async function readResource(client: Client, uri: string): Promise<unknown> {
	return withRetry(async () => {
		const result = await client.readResource({
			uri,
		});
		return result;
	}, `read resource ${uri}`);
}

/**
 * Process items with limited concurrency, preserving order
 */
export async function processWithConcurrency<T, R>(
	items: T[],
	processor: (item: T, index: number) => Promise<R>,
	maxConcurrency: number,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let currentIndex = 0;

	async function worker(): Promise<void> {
		while (currentIndex < items.length) {
			const index = currentIndex++;
			results[index] = await processor(items[index], index);
		}
	}

	const workers = Array.from({ length: Math.min(maxConcurrency, items.length) }, () => worker());

	await Promise.all(workers);
	return results;
}
