/**
 * Dump command - Export MCP tools in various formats
 */

import {
	type Client,
	connectToServer,
	getConcurrencyLimit,
	listTools,
	processWithConcurrency,
	safeClose,
	type ToolInfo,
} from '../client';
import { debug, getServerConfig, listServerNames, loadConfig, type ServerWithSource } from '../config';
import { configSearchError, ErrorCode, formatCliError } from '../errors';
import { formatJson } from '../output';

export interface DumpOptions {
	format: 'request-tools';
	json: boolean;
	configPath?: string;
}

/**
 * Chat completions tool format (OpenAI-compatible)
 */
interface ChatCompletionsTool {
	type: 'function';
	function: {
		name: string;
		description?: string;
		parameters: Record<string, unknown>;
	};
}

/**
 * Convert MCP tool to chat completions format
 * Uses server__tool naming convention (like codex)
 */
function toRequestTool(serverName: string, tool: ToolInfo): ChatCompletionsTool {
	return {
		type: 'function',
		function: {
			name: `${serverName}__${tool.name}`,
			description: tool.description,
			parameters: tool.inputSchema,
		},
	};
}

/**
 * Collect tools from a single server
 */
async function collectServerTools(
	serverName: string,
	serverWithSource: ServerWithSource,
): Promise<{ server: string; tools: ToolInfo[]; error?: string }> {
	let client: Client;
	let close: () => Promise<void> = async () => {};

	try {
		const connection = await connectToServer(serverName, serverWithSource.config);
		client = connection.client;
		close = connection.close;

		const tools = await listTools(client);
		return { server: serverName, tools };
	} catch (error) {
		const errorMessage = (error as Error).message;
		debug(`Failed to connect to ${serverName}: ${errorMessage}`);
		return { server: serverName, tools: [], error: errorMessage };
	} finally {
		await safeClose(close);
	}
}

/**
 * Execute the dump command
 */
export async function dumpCommand(options: DumpOptions): Promise<void> {
	const config = await loadConfig(options.configPath);
	const serverNames = listServerNames(config);

	if (serverNames.length === 0) {
		console.error(formatCliError(configSearchError()));
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	// Collect tools from all servers
	const concurrencyLimit = getConcurrencyLimit();
	const results = await processWithConcurrency(
		serverNames,
		async (serverName) => {
			const serverWithSource = getServerConfig(config, serverName);
			return collectServerTools(serverName, serverWithSource);
		},
		concurrencyLimit,
	);

	// Convert to chat completions format
	const requestTools: ChatCompletionsTool[] = [];
	const errors: Array<{ server: string; error: string }> = [];

	for (const result of results) {
		if (result.error) {
			errors.push({ server: result.server, error: result.error });
			continue;
		}

		for (const tool of result.tools) {
			requestTools.push(toRequestTool(result.server, tool));
		}
	}

	// Output based on format
	if (options.format === 'request-tools') {
		if (options.json) {
			const output: Record<string, unknown> = {
				tools: requestTools,
			};
			if (errors.length > 0) {
				output.errors = errors;
			}
			console.log(formatJson(output));
		} else {
			// Pretty print the tools array (ready to use in API calls)
			console.log(formatJson(requestTools));
			if (errors.length > 0) {
				console.error(`\n# Errors (${errors.length} servers failed):`);
				for (const { server, error } of errors) {
					console.error(`#   ${server}: ${error}`);
				}
			}
		}
	}
}
