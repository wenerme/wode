/**
 * Call command - Execute a tool with arguments
 */

import { callTool, connectToServer, getTimeoutMs, listTools, safeClose } from '../client';
import { getServerConfig, loadConfig } from '../config';
import {
	ErrorCode,
	formatCliError,
	invalidJsonArgsError,
	invalidTargetError,
	serverConnectionError,
	toolExecutionError,
	toolNotFoundError,
} from '../errors';
import { formatJson, formatToolResult } from '../output';

export interface CallOptions {
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
 * Execute the call command
 */
export async function callCommand(options: CallOptions): Promise<void> {
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

	let client: Client;
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
		const result = await callTool(client, toolName, args);

		if (options.json) {
			console.log(formatJson(result));
		} else {
			console.log(formatToolResult(result));
		}
	} catch (error) {
		let availableTools: string[] | undefined;
		try {
			const tools = await listTools(client);
			availableTools = tools.map((t) => t.name);
		} catch {
			// Ignore
		}

		const errMsg = (error as Error).message;
		if (errMsg.includes('not found') || errMsg.includes('unknown tool')) {
			console.error(formatCliError(toolNotFoundError(toolName, serverName, availableTools)));
		} else {
			console.error(formatCliError(toolExecutionError(toolName, serverName, errMsg)));
		}
		process.exit(ErrorCode.SERVER_ERROR);
	} finally {
		await safeClose(close);
	}
}
