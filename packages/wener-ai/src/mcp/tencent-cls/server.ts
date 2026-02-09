import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TencentLogClient, type TencentLogClientInit } from '@wener/client/tencent/cls';
import { SEARCH_GUIDE } from './guide';
import { registerAnalysisTools, registerSearchTools, registerTopicTools } from './tools';

export interface CreateTencentClsMcpServerOptions extends TencentLogClientInit {
	/** Server name */
	name?: string;
	/** Server version */
	version?: string;
}

export interface TencentClsContext {
	server: McpServer;
	getClient: () => TencentLogClient;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

/**
 * Create an MCP server for Tencent CLS (Cloud Log Service) operations.
 */
export function createTencentClsMcpServer(options: CreateTencentClsMcpServerOptions) {
	const { name = 'tencent-cls', version = '1.0.0', ...clientInit } = options;

	const server = new McpServer({ name, version });

	let _client: TencentLogClient | undefined;
	const getClient = () => {
		if (!_client) {
			_client = new TencentLogClient(clientInit);
		}
		return _client;
	};

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({
		content: [{ type: 'text' as const, text: JSON.stringify(cleanObject(data), null, 2) }],
	});

	// Register the search guide as a resource
	server.resource(
		'search-guide',
		'cls://search-guide',
		{
			description: 'CLS CQL search syntax guide with examples',
			mimeType: 'text/markdown',
		},
		async () => {
			return {
				contents: [{ uri: 'cls://search-guide', mimeType: 'text/markdown', text: SEARCH_GUIDE }],
			};
		},
	);

	// =========================================================================
	// Register Tools
	// =========================================================================

	const ctx: TencentClsContext = { server, getClient, textResult, jsonResult };

	registerSearchTools(ctx);
	registerTopicTools(ctx);
	registerAnalysisTools(ctx);

	return {
		server,
		getClient,
		async close() {
			await server.close();
		},
	};
}

/**
 * Recursively clean object by removing null, undefined, and empty string values
 */
function cleanObject(obj: unknown): unknown {
	if (obj === null || obj === undefined) return undefined;
	if (Array.isArray(obj)) {
		return obj.map(cleanObject);
	}
	if (typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			const cleaned = cleanObject(value);
			if (cleaned !== undefined && cleaned !== null && cleaned !== '') {
				result[key] = cleaned;
			}
		}
		return result;
	}
	return obj;
}
