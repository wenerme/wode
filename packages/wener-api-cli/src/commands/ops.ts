/**
 * Ops command - List available operations
 */

import { getOperations, loadApiClient } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import { ErrorCode, formatCliError, serverNotFoundError, specLoadError } from '../errors';
import { formatJson, formatOperationsList } from '../output';

export interface OpsOptions {
	server?: string;
	withDescriptions: boolean;
	json: boolean;
	configPath?: string;
	tag?: string;
	method?: string;
}

/**
 * Execute the ops command
 */
export async function opsCommand(options: OpsOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	// If server specified, show only that server
	const serverNames = options.server ? [options.server] : listServerNames(config);

	if (options.server && !config.servers.has(options.server)) {
		const available = listServerNames(config);
		console.error(formatCliError(serverNotFoundError(options.server, available)));
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	if (serverNames.length === 0) {
		console.error('Warning: No servers configured.');
		return;
	}

	const results: Array<{
		server: string;
		operations: Array<{
			operationId: string;
			method: string;
			path: string;
			summary?: string;
			tags: string[];
		}>;
		error?: string;
	}> = [];

	for (const serverName of serverNames) {
		try {
			const serverWithSource = getServerConfig(config, serverName);
			const client = await loadApiClient(serverWithSource.config);
			let operations = getOperations(client);

			// Filter by tag
			if (options.tag) {
				operations = operations.filter((op) =>
					op.tags.some((t) => t.toLowerCase().includes(options.tag!.toLowerCase())),
				);
			}

			// Filter by method
			if (options.method) {
				operations = operations.filter((op) => op.method.toUpperCase() === options.method!.toUpperCase());
			}

			results.push({
				server: serverName,
				operations: operations.map((op) => ({
					operationId: op.operationId,
					method: op.method,
					path: op.path,
					summary: op.summary,
					tags: op.tags,
				})),
			});
		} catch (error) {
			results.push({
				server: serverName,
				operations: [],
				error: (error as Error).message,
			});
		}
	}

	if (options.json) {
		console.log(formatJson(results));
	} else {
		for (const result of results) {
			if (result.error) {
				console.log(`${result.server}: <error: ${result.error}>`);
			} else {
				console.log(formatOperationsList(result.operations, result.server, options.withDescriptions));
			}
			console.log('');
		}
	}
}
