/**
 * Query command - Execute a read-only tool with arguments
 * Only allows tools that have readOnlyHint: true annotation
 */

import { callTool, connectToServer, getTimeoutMs, listTools, safeClose, type ToolInfo } from '../client';
import { getServerConfig, loadConfig } from '../config';
import {
	ErrorCode,
	formatCliError,
	invalidJsonArgsError,
	invalidTargetError,
	serverConnectionError,
	toolExecutionError,
	toolNotFoundError,
	type CliError,
} from '../errors';
import { formatJson, formatToolResult } from '../output';

export interface QueryOptions {
	target: string; // "server/tool"
	args?: string;
	json: boolean;
	configPath?: string;
}

/**
 * Parse target into server and tool name
 */
function parseTarget(target: string): { server: string; tool: string } {
	const slashIndex = target.indexOf('/');
	if (slashIndex === -1) {
		throw new Error(formatCliError(invalidTargetError(target)));
	}
	return {
		server: target.substring(0, slashIndex),
		tool: target.substring(slashIndex + 1),
	};
}

/**
 * Parse JSON arguments from string or stdin
 */
async function parseArgs(argsString?: string): Promise<Record<string, unknown>> {
	let jsonString: string;

	// "-" means read from stdin explicitly
	const readFromStdin = argsString === '-' || (!argsString && !process.stdin.isTTY);

	if (argsString && argsString !== '-') {
		jsonString = argsString;
	} else if (readFromStdin) {
		// Read from stdin with timeout
		const timeoutMs = getTimeoutMs();
		const chunks: Buffer[] = [];
		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		const readPromise = (async () => {
			for await (const chunk of process.stdin) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks).toString('utf-8').trim();
		})();

		const timeoutPromise = new Promise<string>((_, reject) => {
			timeoutId = setTimeout(() => reject(new Error(`stdin read timed out after ${timeoutMs}ms`)), timeoutMs);
		});

		try {
			jsonString = await Promise.race([readPromise, timeoutPromise]);
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
		}
	} else {
		return {};
	}

	if (!jsonString) {
		return {};
	}

	try {
		return JSON.parse(jsonString);
	} catch (e) {
		throw new Error(formatCliError(invalidJsonArgsError(jsonString, (e as Error).message)));
	}
}

/**
 * Error for non-readonly tool
 */
function toolNotReadOnlyError(toolName: string, serverName: string, readOnlyTools: string[]): CliError {
	const toolList = readOnlyTools.slice(0, 5).join(', ');
	const moreCount = readOnlyTools.length > 5 ? ` (+${readOnlyTools.length - 5} more)` : '';

	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'TOOL_NOT_READONLY',
		message: `Tool "${toolName}" is not a read-only tool`,
		details: readOnlyTools.length > 0 ? `Read-only tools: ${toolList}${moreCount}` : 'No read-only tools found',
		suggestion: `Use 'mcp-cli call ${serverName}/${toolName}' for non-readonly operations, or use a tool with readOnlyHint: true`,
	};
}

/**
 * Execute the query command
 */
export async function queryCommand(options: QueryOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	let serverName: string;
	let toolName: string;

	try {
		const parsed = parseTarget(options.target);
		serverName = parsed.server;
		toolName = parsed.tool;
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	const serverWithSource = getServerConfig(config, serverName);

	let args: Record<string, unknown>;
	try {
		args = await parseArgs(options.args);
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	let client;
	let close: () => Promise<void> = async () => {};

	try {
		const connection = await connectToServer(serverName, serverWithSource.config);
		client = connection.client;
		close = connection.close;
	} catch (error) {
		console.error(formatCliError(serverConnectionError(serverName, (error as Error).message)));
		process.exit(ErrorCode.NETWORK_ERROR);
	}

	try {
		// First, verify the tool exists and has readOnlyHint: true
		const tools = await listTools(client);
		const tool = tools.find((t) => t.name === toolName);

		if (!tool) {
			const availableTools = tools.map((t) => t.name);
			console.error(formatCliError(toolNotFoundError(toolName, serverName, availableTools)));
			process.exit(ErrorCode.CLIENT_ERROR);
		}

		if (tool.annotations?.readOnlyHint !== true) {
			const readOnlyTools = tools.filter((t) => t.annotations?.readOnlyHint === true).map((t) => t.name);
			console.error(formatCliError(toolNotReadOnlyError(toolName, serverName, readOnlyTools)));
			process.exit(ErrorCode.CLIENT_ERROR);
		}

		// Tool is verified as read-only, execute it
		const result = await callTool(client, toolName, args);

		if (options.json) {
			console.log(formatJson(result));
		} else {
			console.log(formatToolResult(result));
		}
	} catch (error) {
		const errMsg = (error as Error).message;
		console.error(formatCliError(toolExecutionError(toolName, serverName, errMsg)));
		process.exit(ErrorCode.SERVER_ERROR);
	} finally {
		await safeClose(close);
	}
}
