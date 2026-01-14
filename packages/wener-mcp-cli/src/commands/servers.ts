/**
 * Servers command - List all servers and their tools
 */

import {
	connectToServer,
	debug,
	getConcurrencyLimit,
	listTools,
	processWithConcurrency,
	safeClose,
	type ToolInfo,
} from '../client';
import { getServerConfig, listServerNames, loadConfig, type MergedConfig } from '../config';
import { ErrorCode } from '../errors';
import { formatConfigSources, formatJson, formatServerList } from '../output';
import type { ConfigSource } from '../schema';

export interface ServersOptions {
	withDescriptions: boolean;
	json: boolean;
	showSources: boolean;
	verbose: boolean;
	configPath?: string;
}

interface ServerWithTools {
	name: string;
	tools: ToolInfo[];
	source?: ConfigSource;
	error?: string;
}

/**
 * Fetch tools from a single server
 */
async function fetchServerTools(serverName: string, config: MergedConfig): Promise<ServerWithTools> {
	try {
		const serverWithSource = getServerConfig(config, serverName);
		const { client, close } = await connectToServer(serverName, serverWithSource.config);

		try {
			const tools = await listTools(client);
			debug(`${serverName}: loaded ${tools.length} tools`);
			return { name: serverName, tools, source: serverWithSource.source };
		} finally {
			await safeClose(close);
		}
	} catch (error) {
		const errorMsg = (error as Error).message;
		debug(`${serverName}: connection failed - ${errorMsg}`);
		return {
			name: serverName,
			tools: [],
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
		console.error('Warning: No servers configured. Add servers to mcp.json or other config files.');
		if (options.showSources && config.sources.length > 0) {
			console.error('');
			console.error(formatConfigSources(config.sources, config.duplicates));
		}
		return;
	}

	const concurrencyLimit = getConcurrencyLimit();
	debug(`Processing ${serverNames.length} servers with concurrency ${concurrencyLimit}`);

	// Process servers in parallel with concurrency limit
	const servers = await processWithConcurrency(serverNames, (name) => fetchServerTools(name, config), concurrencyLimit);

	// Sort by name
	servers.sort((a, b) => a.name.localeCompare(b.name));

	// Convert errors to tool-like display for human output
	const displayServers = servers.map((s) => ({
		name: s.name,
		source: s.source,
		tools: s.error ? [{ name: `<error: ${s.error}>`, description: undefined, inputSchema: {} }] : s.tools,
	}));

	if (options.json) {
		const jsonOutput = {
			servers: servers.map((s) => ({
				name: s.name,
				source: s.source,
				tools: s.tools.map((t) => ({
					name: t.name,
					description: t.description,
					inputSchema: t.inputSchema,
					...(options.verbose && t.annotations ? { annotations: t.annotations } : {}),
				})),
				error: s.error,
			})),
			sources: config.sources,
			duplicates: config.duplicates,
		};
		console.log(formatJson(jsonOutput));
	} else {
		console.log(formatServerList(displayServers, options.withDescriptions, options.showSources, options.verbose));

		if (options.showSources && config.sources.length > 0) {
			console.log('');
			console.log(formatConfigSources(config.sources, config.duplicates));
		}
	}
}
