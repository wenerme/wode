/**
 * Grep command - Search operations by pattern
 */

import { getOperations, loadApiClient, type OperationInfo } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import { formatJson, formatSearchResults } from '../output';

export interface GrepOptions {
	pattern: string;
	withDescriptions: boolean;
	json: boolean;
	configPath?: string;
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except * and ?
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.');

	return new RegExp(escaped, 'i');
}

/**
 * Check if operation matches pattern
 */
function matchesPattern(operation: OperationInfo, regex: RegExp): boolean {
	if (regex.test(operation.operationId)) return true;
	if (regex.test(operation.path)) return true;
	if (regex.test(`${operation.method} ${operation.path}`)) return true;
	if (operation.summary && regex.test(operation.summary)) return true;
	if (operation.description && regex.test(operation.description)) return true;
	return false;
}

/**
 * Execute the grep command
 */
export async function grepCommand(options: GrepOptions): Promise<void> {
	const config = await loadConfig(options.configPath);
	const serverNames = listServerNames(config);

	if (serverNames.length === 0) {
		console.error('Warning: No servers configured.');
		return;
	}

	const regex = globToRegex(options.pattern);
	const results: Array<{ server: string; operation: OperationInfo }> = [];

	for (const serverName of serverNames) {
		try {
			const serverWithSource = getServerConfig(config, serverName);
			const client = await loadApiClient(serverWithSource.config);
			const operations = getOperations(client);

			for (const operation of operations) {
				if (matchesPattern(operation, regex)) {
					results.push({ server: serverName, operation });
				}
			}
		} catch (_error) {
			// Silently skip servers that fail to load
			// Could add verbose flag to show these
		}
	}

	if (results.length === 0) {
		console.log(`No operations found matching "${options.pattern}"`);
		return;
	}

	if (options.json) {
		console.log(
			formatJson(
				results.map((r) => ({
					server: r.server,
					operationId: r.operation.operationId,
					method: r.operation.method,
					path: r.operation.path,
					summary: r.operation.summary,
				})),
			),
		);
	} else {
		console.log(formatSearchResults(results, options.withDescriptions));
	}
}
