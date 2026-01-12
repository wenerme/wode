/**
 * Resources command - List and read MCP resources
 */

import { connectToServer, listResources, safeClose } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import { ErrorCode, formatCliError, serverConnectionError } from '../errors';
import { formatJson, formatResourceList } from '../output';

export interface ResourcesOptions {
	server?: string;
	withDescriptions: boolean;
	json: boolean;
	configPath?: string;
}

/**
 * Execute the resources command
 */
export async function resourcesCommand(options: ResourcesOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	if (!options.server) {
		const serverNames = listServerNames(config);
		if (options.json) {
			console.log(formatJson({ servers: serverNames }));
		} else {
			console.log('Available servers (use "mcp-cli resources <server>" to list resources):');
			for (const name of serverNames) {
				console.log(`  ${name}`);
			}
		}
		return;
	}

	const serverWithSource = getServerConfig(config, options.server);
	let client;
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
		const resources = await listResources(client);

		if (options.json) {
			console.log(
				formatJson({
					server: options.server,
					resources: resources.map((r) => ({
						name: r.name,
						uri: r.uri,
						description: r.description,
						mimeType: r.mimeType,
					})),
				}),
			);
		} else {
			console.log(formatResourceList(resources, options.server, options.withDescriptions));
		}
	} finally {
		await safeClose(close);
	}
}
