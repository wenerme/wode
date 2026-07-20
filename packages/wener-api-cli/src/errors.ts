/**
 * Enhanced error handling with actionable messages
 */

/**
 * Error codes matching exit codes
 */
export const ErrorCode = Object.freeze({
	CLIENT_ERROR: 1,
	SERVER_ERROR: 2,
	NETWORK_ERROR: 3,
	AUTH_ERROR: 4,
} as const);

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured error for CLI output
 */
export interface CliError {
	code: ErrorCodeType;
	type: string;
	message: string;
	details?: string;
	suggestion?: string;
}

/**
 * Format a CLI error for stderr output
 */
export function formatCliError(error: CliError): string {
	const lines: string[] = [];

	lines.push(`Error [${error.type}]: ${error.message}`);

	if (error.details) {
		lines.push(`  Details: ${error.details}`);
	}

	if (error.suggestion) {
		lines.push(`  Suggestion: ${error.suggestion}`);
	}

	return lines.join('\n');
}

// Config Errors

export function configNotFoundError(path: string): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'CONFIG_NOT_FOUND',
		message: `Config file not found: ${path}`,
		suggestion: `Create .api-cli.json with: { "servers": { "server-name": { "url": "...", "type": "openapi" } } }`,
	};
}

export function configSearchError(): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'CONFIG_NOT_FOUND',
		message: 'No API-CLI configuration found in search paths',
		details: 'Searched: ./.api-cli.local.json, ./.api-cli.json, ~/.api-cli.local.json, ~/.api-cli.json',
		suggestion: 'Create .api-cli.json in current directory or use -c/--config to specify path',
	};
}

export function configInvalidJsonError(path: string, parseError?: string): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'CONFIG_INVALID_JSON',
		message: `Invalid JSON in config file: ${path}`,
		details: parseError,
		suggestion: 'Check for syntax errors: missing commas, unquoted keys, trailing commas',
	};
}

export function configMissingFieldError(path: string): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'CONFIG_MISSING_FIELD',
		message: `Config file missing required "servers" object`,
		details: `File: ${path}`,
		suggestion: 'Config must have structure: { "servers": { ... } }',
	};
}

// Server Errors

export function serverNotFoundError(serverName: string, available: string[]): CliError {
	const availableList = available.length > 0 ? available.join(', ') : '(none)';
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'SERVER_NOT_FOUND',
		message: `Server "${serverName}" not found in config`,
		details: `Available servers: ${availableList}`,
		suggestion:
			available.length > 0
				? `Use one of: ${available
						.slice(0, 5)
						.map((s) => `api-cli ops ${s}`)
						.join(', ')}`
				: `Add server to config: { "servers": { "${serverName}": { ... } } }`,
	};
}

export function specLoadError(serverName: string, cause: string): CliError {
	let suggestion = 'Check the OpenAPI spec URL and ensure it is accessible';

	if (cause.includes('ENOENT') || cause.includes('not found')) {
		suggestion = 'File not found. Check the path or URL is correct';
	} else if (cause.includes('ECONNREFUSED')) {
		suggestion = 'Connection refused. Check if the server is running and URL is correct';
	} else if (cause.includes('ETIMEDOUT') || cause.includes('timeout')) {
		suggestion = 'Connection timed out. Check network connectivity';
	} else if (cause.includes('401') || cause.includes('Unauthorized')) {
		suggestion = 'Authentication required. Add Authorization header to config';
	} else if (cause.includes('parse') || cause.includes('JSON')) {
		suggestion = 'Invalid OpenAPI spec format. Ensure it is valid JSON or YAML';
	}

	return {
		code: ErrorCode.NETWORK_ERROR,
		type: 'SPEC_LOAD_FAILED',
		message: `Failed to load OpenAPI spec for server "${serverName}"`,
		details: cause,
		suggestion,
	};
}

// Operation Errors

export function operationNotFoundError(operationId: string, serverName: string, availableOps?: string[]): CliError {
	const opList = availableOps?.slice(0, 5).join(', ') || '';
	const moreCount = availableOps && availableOps.length > 5 ? ` (+${availableOps.length - 5} more)` : '';

	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'OPERATION_NOT_FOUND',
		message: `Operation "${operationId}" not found in server "${serverName}"`,
		details: availableOps ? `Available operations: ${opList}${moreCount}` : undefined,
		suggestion: `Run 'api-cli ops ${serverName}' to see all available operations`,
	};
}

export function requestError(operation: string, cause: string): CliError {
	let suggestion = 'Check the request parameters and server availability';

	if (cause.includes('validation') || cause.includes('invalid')) {
		suggestion = `Run 'api-cli info <server>/${operation}' to see the parameter schema`;
	} else if (cause.includes('required')) {
		suggestion = `Missing required parameter. Run 'api-cli info <server>/${operation}' to see required fields`;
	} else if (cause.includes('ECONNREFUSED')) {
		suggestion = 'Server is not responding. Check the baseUrl and server status';
	} else if (cause.includes('401') || cause.includes('Unauthorized')) {
		suggestion = 'Authentication failed. Check your credentials in config headers';
	} else if (cause.includes('403') || cause.includes('Forbidden')) {
		suggestion = 'Access forbidden. Check credentials and permissions';
	}

	return {
		code: ErrorCode.SERVER_ERROR,
		type: 'REQUEST_FAILED',
		message: `Request to "${operation}" failed`,
		details: cause,
		suggestion,
	};
}

export function responseError(operation: string, statusCode: number, body?: string): CliError {
	const truncatedBody = body && body.length > 200 ? `${body.substring(0, 200)}...` : body;

	return {
		code: ErrorCode.SERVER_ERROR,
		type: 'RESPONSE_ERROR',
		message: `API returned error response for "${operation}"`,
		details: `Status: ${statusCode}${truncatedBody ? `\nBody: ${truncatedBody}` : ''}`,
		suggestion: 'Check API documentation for error codes and meanings',
	};
}

// Argument Errors

export function invalidTargetError(target: string): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'INVALID_TARGET',
		message: `Invalid target format: "${target}"`,
		details: 'Expected format: server/operationId or server/METHOD/path',
		suggestion: `Use 'api-cli call <server>/<operationId> <json>' format`,
	};
}

export function invalidJsonArgsError(input: string, parseError?: string): CliError {
	const truncated = input.length > 100 ? `${input.substring(0, 100)}...` : input;

	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'INVALID_JSON_ARGUMENTS',
		message: 'Invalid JSON in arguments',
		details: parseError ? `Parse error: ${parseError}` : `Input: ${truncated}`,
		suggestion: 'Arguments must be valid JSON. Use single quotes around JSON: \'{"key": "value"}\'',
	};
}

export function missingArgumentError(command: string, argument: string): CliError {
	return {
		code: ErrorCode.CLIENT_ERROR,
		type: 'MISSING_ARGUMENT',
		message: `Missing required argument for ${command}: ${argument}`,
		suggestion: `Run 'api-cli ${command} --help' for usage examples`,
	};
}
