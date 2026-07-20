/**
 * Servers command - List all API servers and their operations
 */

import { getOperations, loadApiClient } from '../client';
import { debug, getServerConfig, listServerNames, loadConfig, type MergedConfig } from '../config';
import { ErrorCode } from '../errors';
import { formatConfigSources, formatJson, formatServersWithOps } from '../output';

export interface ServersOptions {
	json: boolean;
	showSources: boolean;
	withDescriptions: boolean;
	configPath?: string;
}

interface OperationInfo {
	operationId: string;
	method: string;
	path: string;
	summary?: string;
}

interface ServerInfo {
	name: string;
	operations: OperationInfo[];
	info?: { title: string; version: string };
	source?: { path: string; label: string };
	error?: string;
}

/**
 * Fetch info from a single server
 */
async function fetchServerInfo(serverName: string, config: MergedConfig): Promise<ServerInfo> {
	try {
		const serverWithSource = getServerConfig(config, serverName);
		const client = await loadApiClient(serverWithSource.config);
		const operations = getOperations(client);

		debug(`${serverName}: loaded ${operations.length} operations`);

		return {
			name: serverName,
			operations: operations.map((op) => ({
				operationId: op.operationId,
				method: op.method,
				path: op.path,
				summary: op.summary,
			})),
			info: client.spec.info,
			source: serverWithSource.source,
		};
	} catch (error) {
		const errorMsg = (error as Error).message;
		debug(`${serverName}: failed - ${errorMsg}`);
		return {
			name: serverName,
			operations: [],
			error: errorMsg,
		};
	}
}

/**
 * Execute the servers command
 */
export async function serversCommand(options: ServersOptions): Promise<void> {
	let config: MergedConfig;

	try {
		config = await loadConfig(options.configPath);
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	const serverNames = listServerNames(config);

	if (serverNames.length === 0) {
		console.error('Warning: No servers configured. Add servers to .api-cli.json');
		if (options.showSources && config.sources.length > 0) {
			console.error('');
			console.error(formatConfigSources(config.sources, config.duplicates));
		}
		return;
	}

	// Fetch server info in parallel
	const servers = await Promise.all(serverNames.map((name) => fetchServerInfo(name, config)));

	// Sort by name
	servers.sort((a, b) => a.name.localeCompare(b.name));

	if (options.json) {
		const jsonOutput = {
			servers: servers.map((s) => ({
				name: s.name,
				title: s.info?.title,
				version: s.info?.version,
				operationCount: s.operations.length,
				operations: s.operations,
				source: s.source,
				error: s.error,
			})),
			sources: config.sources,
			duplicates: config.duplicates,
		};
		console.log(formatJson(jsonOutput));
	} else {
		console.log(formatServersWithOps(servers, options.withDescriptions, options.showSources));

		if (options.showSources && config.sources.length > 0) {
			console.log('');
			console.log(formatConfigSources(config.sources, config.duplicates));
		}
	}
}
