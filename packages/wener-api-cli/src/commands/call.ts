/**
 * Call command - Execute an API operation
 */

import { type ApiClient, executeOperation, findOperation, getOperations, getTimeoutMs, loadApiClient } from '../client';
import { getServerConfig, listServerNames, loadConfig } from '../config';
import {
	ErrorCode,
	formatCliError,
	invalidJsonArgsError,
	invalidTargetError,
	operationNotFoundError,
	requestError,
	responseError,
	serverNotFoundError,
	specLoadError,
} from '../errors';
import { formatApiResponse, formatJson } from '../output';

export interface CallOptions {
	target: string;
	args?: string;
	method?: string; // HTTP method (GET, POST, etc.) - when specified, find operation by method+path
	json: boolean;
	configPath?: string;
	headers?: string[];
}

/**
 * Parse target into server and operation
 */
function parseTarget(target: string): { server: string; operation: string } {
	const slashIndex = target.indexOf('/');
	if (slashIndex === -1) {
		throw new Error(formatCliError(invalidTargetError(target)));
	}
	return {
		server: target.substring(0, slashIndex),
		operation: target.substring(slashIndex + 1),
	};
}

/**
 * Parse JSON arguments from string or stdin
 */
async function parseArgs(argsString?: string): Promise<Record<string, unknown>> {
	let jsonString: string;

	// "-" means read from stdin explicitly
	const readFromStdin = argsString === '-' || (!argsString && !process.stdin.isTTY);

	if (argsString && argsString !== '-') {
		jsonString = argsString;
	} else if (readFromStdin) {
		// Read from stdin with timeout
		const timeoutMs = getTimeoutMs();
		const chunks: Buffer[] = [];
		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		const readPromise = (async () => {
			for await (const chunk of process.stdin) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks).toString('utf-8').trim();
		})();

		const timeoutPromise = new Promise<string>((_, reject) => {
			timeoutId = setTimeout(() => reject(new Error(`stdin read timed out after ${timeoutMs}ms`)), timeoutMs);
		});

		try {
			jsonString = await Promise.race([readPromise, timeoutPromise]);
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
		}
	} else {
		return {};
	}

	if (!jsonString) {
		return {};
	}

	try {
		return JSON.parse(jsonString);
	} catch (e) {
		throw new Error(formatCliError(invalidJsonArgsError(jsonString, (e as Error).message)));
	}
}

/**
 * Parse header arguments
 */
function parseHeaders(headers: string[] = []): Record<string, string> {
	const result: Record<string, string> = {};
	for (const h of headers) {
		const eqIndex = h.indexOf('=');
		if (eqIndex > 0) {
			const key = h.substring(0, eqIndex);
			const value = h.substring(eqIndex + 1);
			result[key] = value;
		}
	}
	return result;
}

/**
 * Execute the call command
 */
export async function callCommand(options: CallOptions): Promise<void> {
	const config = await loadConfig(options.configPath);

	let serverName: string;
	let operationTarget: string;

	try {
		const parsed = parseTarget(options.target);
		serverName = parsed.server;
		operationTarget = parsed.operation;
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	// Check server exists
	if (!config.servers.has(serverName)) {
		const available = listServerNames(config);
		console.error(formatCliError(serverNotFoundError(serverName, available)));
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	const serverWithSource = getServerConfig(config, serverName);

	// Parse arguments
	let args: Record<string, unknown>;
	try {
		args = await parseArgs(options.args);
	} catch (error) {
		console.error((error as Error).message);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	// Add any command-line headers
	const extraHeaders = parseHeaders(options.headers);

	// Load API client
	let client: ApiClient;
	try {
		client = await loadApiClient(serverWithSource.config);
		// Merge extra headers
		Object.assign(client.headers, extraHeaders);
	} catch (error) {
		console.error(formatCliError(specLoadError(serverName, (error as Error).message)));
		process.exit(ErrorCode.NETWORK_ERROR);
	}

	// Find operation
	const found = findOperation(client, operationTarget, options.method);
	if (!found) {
		const availableOps = getOperations(client).map((op) => op.operationId);
		console.error(formatCliError(operationNotFoundError(operationTarget, serverName, availableOps)));
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	// Verify method matches if specified
	if (options.method && found.operation.method.toUpperCase() !== options.method.toUpperCase()) {
		console.error(
			formatCliError({
				code: ErrorCode.CLIENT_ERROR,
				type: 'METHOD_MISMATCH',
				message: `Operation "${found.operation.operationId}" uses ${found.operation.method}, not ${options.method}`,
				suggestion: `Use 'api-cli ${found.operation.method.toLowerCase()} ${serverName}/${operationTarget}'`,
			}),
		);
		process.exit(ErrorCode.CLIENT_ERROR);
	}

	// Merge path params from URL matching
	if (found.pathParams) {
		args = { ...found.pathParams, ...args };
	}

	// Execute request
	try {
		const response = await executeOperation(client, found.operation, args);

		// Check for error responses
		if (response.status >= 400) {
			if (options.json) {
				console.log(
					formatJson({
						error: true,
						status: response.status,
						statusText: response.statusText,
						body: response.body,
					}),
				);
			} else {
				console.error(
					formatCliError(
						responseError(
							found.operation.operationId,
							response.status,
							typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
						),
					),
				);
			}
			process.exit(ErrorCode.SERVER_ERROR);
		}

		// Output response
		if (options.json) {
			console.log(
				formatJson({
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
					body: response.body,
				}),
			);
		} else {
			console.log(formatApiResponse(response));
		}
	} catch (error) {
		console.error(formatCliError(requestError(found.operation.operationId, (error as Error).message)));
		process.exit(ErrorCode.NETWORK_ERROR);
	}
}
