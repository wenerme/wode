/**
 * Info command - Show server or tool details
 */

import { connectToServer, listTools, safeClose, type Client } from '../client';
import { getServerConfig, loadConfig } from '../config';
import { ErrorCode, formatCliError, serverConnectionError, toolNotFoundError } from '../errors';
import { formatJson, formatServerDetails, formatToolSchema } from '../output';

export interface InfoOptions {
	target: string; // "server" or "server/tool"
	json: boolean;
	withDescriptions: boolean;
	configPath?: string;
}

/**
 * Parse target into server and optional tool name
 */
function parseTarget(target: string): { server: string; tool?: string } {
	const parts = target.split('/');
	if (parts.length === 1) {
		return { server: parts[0] };
	}
	return { server: parts[0], tool: parts.slice(1).join('/') };
}

/**
 * Execute the info command
 */
export async function infoCommand(options: InfoOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	const { server: serverName, tool: toolName } = parseTarget(options.target);

	const serverWithSource = getServerConfig(config, serverName);

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
		if (toolName) {
			// Show specific tool schema
			const tools = await listTools(client);
			const tool = tools.find((t) => t.name === toolName);

			if (!tool) {
				const availableTools = tools.map((t) => t.name);
				console.error(formatCliError(toolNotFoundError(toolName, serverName, availableTools)));
				process.exit(ErrorCode.CLIENT_ERROR);
			}

			if (options.json) {
				console.log(
					formatJson({
						name: tool.name,
						description: tool.description,
						inputSchema: tool.inputSchema,
						...(tool.annotations ? { annotations: tool.annotations } : {}),
					}),
				);
			} else {
				console.log(formatToolSchema(serverName, tool));
			}
		} else {
			// Show server details
			const tools = await listTools(client);

			if (options.json) {
				console.log(
					formatJson({
						name: serverName,
						source: serverWithSource.source,
						config: serverWithSource.config,
						tools: tools.map((t) => ({
							name: t.name,
							description: t.description,
							inputSchema: t.inputSchema,
							...(t.annotations ? { annotations: t.annotations } : {}),
						})),
					}),
				);
			} else {
				console.log(
					formatServerDetails(
						serverName,
						serverWithSource.config,
						tools,
						serverWithSource.source,
						options.withDescriptions,
					),
				);
			}
		}
	} finally {
		await safeClose(close);
	}
}
