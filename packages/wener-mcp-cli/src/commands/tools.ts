/**
 * Tools command - List available tools from a server
 */

import { connectToServer, listTools, safeClose, type Client } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import { ErrorCode, formatCliError, serverConnectionError } from '../errors';
import { formatJson, formatServerDetails } from '../output';

export interface ToolsOptions {
	server?: string;
	withDescriptions: boolean;
	json: boolean;
	configPath?: string;
}

/**
 * Execute the tools command
 */
export async function toolsCommand(options: ToolsOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	if (!options.server) {
		// List all servers
		const serverNames = listServerNames(config);
		if (options.json) {
			console.log(formatJson({ servers: serverNames }));
		} else {
			console.log('Available servers:');
			for (const name of serverNames) {
				console.log(`  ${name}`);
			}
		}
		return;
	}

	const serverWithSource = getServerConfig(config, options.server);
	let client: Client;
	let close: () => Promise<void> = async () => {};

	try {
		const connection = await connectToServer(options.server, serverWithSource.config);
		client = connection.client;
		close = connection.close;
	} catch (error) {
		console.error(formatCliError(serverConnectionError(options.server, (error as Error).message)));
		process.exit(ErrorCode.NETWORK_ERROR);
	}

	try {
		const tools = await listTools(client);

		if (options.json) {
			console.log(
				formatJson({
					server: options.server,
					source: serverWithSource.source,
					tools: tools.map((t) => ({
						name: t.name,
						description: t.description,
						inputSchema: t.inputSchema,
					})),
				}),
			);
		} else {
			console.log(
				formatServerDetails(
					options.server,
					serverWithSource.config,
					tools,
					serverWithSource.source,
					options.withDescriptions,
				),
			);
		}
	} finally {
		await safeClose(close);
	}
}
