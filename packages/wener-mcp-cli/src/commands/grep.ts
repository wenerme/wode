/**
 * Grep command - Search tools by pattern
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
import { formatJson, formatSearchResults } from '../output';

export interface GrepOptions {
	pattern: string;
	withDescriptions: boolean;
	json: boolean;
	configPath?: string;
}

interface SearchResult {
	server: string;
	tool: ToolInfo;
}

interface ServerSearchResult {
	serverName: string;
	results: SearchResult[];
	error?: string;
}

/**
 * Convert glob pattern to regex
 */
export function globToRegex(pattern: string): RegExp {
	let escaped = '';
	let i = 0;

	while (i < pattern.length) {
		const char = pattern[i];

		if (char === '*' && pattern[i + 1] === '*') {
			escaped += '.*';
			i += 2;
			while (pattern[i] === '*') {
				i++;
			}
		} else if (char === '*') {
			escaped += '[^/]*';
			i += 1;
		} else if (char === '?') {
			escaped += '[^/]';
			i += 1;
		} else if ('[.+^${}()|\\]'.includes(char)) {
			escaped += `\\${char}`;
			i += 1;
		} else {
			escaped += char;
			i += 1;
		}
	}

	return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Search tools in a single server
 */
async function searchServerTools(
	serverName: string,
	config: MergedConfig,
	pattern: RegExp,
): Promise<ServerSearchResult> {
	try {
		const serverWithSource = getServerConfig(config, serverName);
		const { client, close } = await connectToServer(serverName, serverWithSource.config);

		try {
			const tools = await listTools(client);
			const results: SearchResult[] = [];

			for (const tool of tools) {
				const fullPath = `${serverName}/${tool.name}`;
				const matchesName = pattern.test(tool.name);
				const matchesPath = pattern.test(fullPath);
				const matchesDescription = tool.description && pattern.test(tool.description);

				if (matchesName || matchesPath || matchesDescription) {
					results.push({ server: serverName, tool });
				}
			}

			debug(`${serverName}: found ${results.length} matches`);
			return { serverName, results };
		} finally {
			await safeClose(close);
		}
	} catch (error) {
		const errorMsg = (error as Error).message;
		debug(`${serverName}: connection failed - ${errorMsg}`);
		return { serverName, results: [], error: errorMsg };
	}
}

/**
 * Execute the grep command
 */
export async function grepCommand(options: GrepOptions): Promise<void> {
	let config: MergedConfig;

	try {
		config = await loadConfig(options.configPath);
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	const pattern = globToRegex(options.pattern);
	const serverNames = listServerNames(config);

	if (serverNames.length === 0) {
		console.error('Warning: No servers configured.');
		return;
	}

	const concurrencyLimit = getConcurrencyLimit();

	debug(`Searching ${serverNames.length} servers for pattern "${options.pattern}" (concurrency: ${concurrencyLimit})`);

	const serverResults = await processWithConcurrency(
		serverNames,
		(serverName) => searchServerTools(serverName, config, pattern),
		concurrencyLimit,
	);

	const allResults: SearchResult[] = [];
	const failedServers: string[] = [];

	for (const result of serverResults) {
		allResults.push(...result.results);
		if (result.error) {
			failedServers.push(result.serverName);
		}
	}

	if (failedServers.length > 0) {
		console.error(`Warning: ${failedServers.length} server(s) failed to connect: ${failedServers.join(', ')}`);
	}

	if (allResults.length === 0) {
		console.log(`No tools found matching "${options.pattern}"`);
		return;
	}

	if (options.json) {
		const jsonOutput = allResults.map((r) => ({
			server: r.server,
			tool: r.tool.name,
			description: r.tool.description,
			inputSchema: r.tool.inputSchema,
		}));
		console.log(formatJson(jsonOutput));
	} else {
		console.log(formatSearchResults(allResults, options.withDescriptions));
	}
}
