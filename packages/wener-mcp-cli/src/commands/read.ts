/**
 * Read command - Read an MCP resource
 */

import { connectToServer, readResource, safeClose, type Client } from '../client';
import { getServerConfig, loadConfig } from '../config';
import { ErrorCode, formatCliError, invalidTargetError, serverConnectionError } from '../errors';
import { formatJson } from '../output';

export interface ReadOptions {
	target: string; // "server/resource-uri"
	json: boolean;
	configPath?: string;
}

/**
 * Parse target into server and resource URI
 */
function parseTarget(target: string): { server: string; resourceUri: string } {
	const slashIndex = target.indexOf('/');
	if (slashIndex === -1) {
		throw new Error(formatCliError(invalidTargetError(target)));
	}
	return {
		server: target.substring(0, slashIndex),
		resourceUri: target.substring(slashIndex + 1),
	};
}

/**
 * Execute the read command
 */
export async function readCommand(options: ReadOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	let serverName: string;
	let resourceUri: string;

	try {
		const parsed = parseTarget(options.target);
		serverName = parsed.server;
		resourceUri = parsed.resourceUri;
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

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
		const result = await readResource(client, resourceUri);

		if (options.json) {
			console.log(formatJson(result));
		} else {
			// Extract text content if available
			if (typeof result === 'object' && result !== null) {
				const r = result as { contents?: Array<{ text?: string; blob?: string; mimeType?: string }> };
				if (r.contents && Array.isArray(r.contents)) {
					for (const content of r.contents) {
						if (content.text) {
							console.log(content.text);
						} else if (content.blob) {
							console.log(`[Binary data: ${content.mimeType || 'unknown type'}]`);
						}
					}
					return;
				}
			}
			console.log(formatJson(result));
		}
	} finally {
		await safeClose(close);
	}
}
