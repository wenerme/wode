/**
 * Info command - Show operation details and schema
 */

import { findOperation, findOperationsByPath, getOperations, loadApiClient } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import { ErrorCode, formatCliError, operationNotFoundError, serverNotFoundError, specLoadError } from '../errors';
import { formatJson, formatOperationDetails, formatServerInfo } from '../output';

export interface InfoOptions {
	target: string;
	json: boolean;
	withDescriptions: boolean;
	configPath?: string;
}

/**
 * Parse target into server and optional operation
 */
function parseTarget(target: string): { server: string; operation?: string } {
	const slashIndex = target.indexOf('/');
	if (slashIndex === -1) {
		return { server: target };
	}
	return {
		server: target.substring(0, slashIndex),
		operation: target.substring(slashIndex + 1),
	};
}

/**
 * Execute the info command
 */
export async function infoCommand(options: InfoOptions): Promise<void> {
	const config = await loadConfig(options.configPath);
	const { server: serverName, operation: operationTarget } = parseTarget(options.target);

	// Check server exists
	if (!config.servers.has(serverName)) {
		const available = listServerNames(config);
		console.error(formatCliError(serverNotFoundError(serverName, available)));
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	const serverWithSource = getServerConfig(config, serverName);

	let client;
	try {
		client = await loadApiClient(serverWithSource.config);
	} catch (error) {
		console.error(formatCliError(specLoadError(serverName, (error as Error).message)));
		process.exit(ErrorCode.NETWORK_ERROR);
	}

	if (operationTarget) {
		// First try by operationId
		const found = findOperation(client, operationTarget);

		if (found) {
			// Found by operationId - show single operation
			if (options.json) {
				console.log(
					formatJson({
						operationId: found.operation.operationId,
						method: found.operation.method,
						path: found.operation.path,
						summary: found.operation.summary,
						description: found.operation.description,
						tags: found.operation.tags,
						parameters: found.operation.parameters,
						requestBody: found.operation.requestBody,
						responses: found.operation.responses,
					}),
				);
			} else {
				console.log(formatOperationDetails(serverName, found.operation));
			}
			return;
		}

		// Try by path - may return multiple operations (different methods)
		const pathMatches = findOperationsByPath(client, operationTarget);
		if (pathMatches.length > 0) {
			if (options.json) {
				console.log(
					formatJson(
						pathMatches.map((m) => ({
							operationId: m.operation.operationId,
							method: m.operation.method,
							path: m.operation.path,
							summary: m.operation.summary,
							description: m.operation.description,
							tags: m.operation.tags,
							parameters: m.operation.parameters,
							requestBody: m.operation.requestBody,
							responses: m.operation.responses,
						})),
					),
				);
			} else {
				// Show all matching operations
				for (let i = 0; i < pathMatches.length; i++) {
					if (i > 0) console.log('\n---\n');
					console.log(formatOperationDetails(serverName, pathMatches[i].operation));
				}
			}
			return;
		}

		// Not found
		const availableOps = getOperations(client).map((op) => op.operationId);
		console.error(formatCliError(operationNotFoundError(operationTarget, serverName, availableOps)));
		process.exit(ErrorCode.CLIENT_ERROR);
	} else {
		// Show server info
		if (options.json) {
			const operations = getOperations(client);
			console.log(
				formatJson({
					name: serverName,
					title: client.spec.info.title,
					version: client.spec.info.version,
					description: client.spec.info.description,
					baseUrl: client.baseUrl,
					source: serverWithSource.source,
					operationCount: operations.length,
					operations: operations.map((op) => ({
						operationId: op.operationId,
						method: op.method,
						path: op.path,
						summary: op.summary,
						tags: op.tags,
					})),
				}),
			);
		} else {
			console.log(formatServerInfo(serverName, client, serverWithSource.source));
		}
	}
}
