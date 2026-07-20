/**
 * Output formatting utilities
 */

import type { ApiClient, ApiResponse, OperationInfo } from './client';
import type { ConfigSource, ParsedOperation } from './schema';

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	gray: '\x1b[90m',
	red: '\x1b[31m',
};

/**
 * Check if output should be colorized
 */
function shouldColorize(): boolean {
	return process.stdout.isTTY && !process.env.NO_COLOR;
}

/**
 * Apply color if terminal supports it
 */
function color(text: string, colorCode: string): string {
	if (!shouldColorize()) return text;
	return `${colorCode}${text}${colors.reset}`;
}

/**
 * Format server list for display
 */
export function formatServerList(
	servers: Array<{
		name: string;
		operationCount: number;
		info?: { title: string; version: string };
		source?: ConfigSource;
		error?: string;
	}>,
	showSource = false,
): string {
	const lines: string[] = [];

	for (const server of servers) {
		let serverLine = color(server.name, colors.bold + colors.cyan);

		if (server.info) {
			serverLine += ` ${color(`(${server.info.title} ${server.info.version})`, colors.gray)}`;
		}

		if (server.error) {
			serverLine += ` ${color(`<error: ${server.error}>`, colors.red)}`;
		}

		lines.push(serverLine);

		if (!server.error) {
			lines.push(`  ${server.operationCount} operations`);
		}

		if (showSource && server.source) {
			lines.push(`  Source: ${server.source.label}`);
		}

		lines.push('');
	}

	return lines.join('\n').trimEnd();
}

/**
 * Format operations list
 */
export function formatOperationsList(
	operations: OperationInfo[],
	serverName: string,
	withDescriptions: boolean,
): string {
	const lines: string[] = [];

	lines.push(color(serverName, colors.bold + colors.cyan));

	// Group by method for better readability
	const methodColors: Record<string, string> = {
		GET: colors.green,
		POST: colors.yellow,
		PUT: colors.blue,
		DELETE: colors.red,
		PATCH: colors.magenta,
	};

	for (const op of operations) {
		const methodColor = methodColors[op.method] || colors.gray;
		const method = color(op.method.padEnd(7), methodColor);
		const path = op.path;
		const opId = color(op.operationId, colors.dim);

		let line = `  ${method} ${path.padEnd(30)} ${opId}`;
		lines.push(line);

		if (withDescriptions && op.summary) {
			lines.push(`    ${color(op.summary, colors.dim)}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format search results
 */
export function formatSearchResults(
	results: Array<{ server: string; operation: OperationInfo }>,
	withDescriptions: boolean,
): string {
	const lines: string[] = [];

	for (const result of results) {
		const path = `${color(result.server, colors.cyan)}/${color(result.operation.operationId, colors.green)}`;
		const method = color(`[${result.operation.method}]`, colors.dim);

		if (withDescriptions && result.operation.summary) {
			lines.push(`${path} ${method}`);
			lines.push(`  ${color(result.operation.summary, colors.dim)}`);
		} else {
			lines.push(`${path} ${method} ${result.operation.path}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format server info
 */
export function formatServerInfo(serverName: string, client: ApiClient, source?: ConfigSource): string {
	const lines: string[] = [];
	const { spec } = client;

	lines.push(`${color('Server:', colors.bold)} ${color(serverName, colors.cyan)}`);
	lines.push(`${color('Title:', colors.bold)} ${spec.info.title}`);
	lines.push(`${color('Version:', colors.bold)} ${spec.info.version}`);

	if (spec.info.description) {
		lines.push(`${color('Description:', colors.bold)} ${spec.info.description}`);
	}

	lines.push(`${color('Base URL:', colors.bold)} ${client.baseUrl}`);

	if (source) {
		lines.push(`${color('Source:', colors.bold)} ${source.label}`);
	}

	lines.push('');
	lines.push(`${color(`Operations (${spec.operations.length}):`, colors.bold)}`);

	const byTag = new Map<string, OperationInfo[]>();
	for (const op of spec.operations) {
		const tag = op.tags[0] || 'default';
		if (!byTag.has(tag)) byTag.set(tag, []);
		byTag.get(tag)?.push(op);
	}

	for (const [tag, ops] of byTag) {
		lines.push(`  ${color(tag, colors.yellow)} (${ops.length})`);
	}

	return lines.join('\n');
}

/**
 * Format operation details (schema)
 */
export function formatOperationDetails(_serverName: string, operation: ParsedOperation): string {
	const lines: string[] = [];

	lines.push(`${color('Operation:', colors.bold)} ${color(operation.operationId, colors.green)}`);
	lines.push(`  ${color('Method:', colors.bold)} ${operation.method}`);
	lines.push(`  ${color('Path:', colors.bold)} ${operation.path}`);

	if (operation.summary) {
		lines.push(`  ${color('Summary:', colors.bold)} ${operation.summary}`);
	}

	if (operation.description) {
		lines.push(`  ${color('Description:', colors.bold)} ${operation.description}`);
	}

	if (operation.tags.length > 0) {
		lines.push(`  ${color('Tags:', colors.bold)} ${operation.tags.join(', ')}`);
	}

	lines.push('');

	// Parameters
	if (operation.parameters.length > 0) {
		lines.push(color('Parameters:', colors.bold));
		for (const param of operation.parameters) {
			const required = param.required ? color('required', colors.red) : color('optional', colors.gray);
			const type = formatSchemaType(param.schema);
			lines.push(`  ${color(param.name, colors.cyan)} (${param.in}, ${required}): ${type}`);
			if (param.description) {
				lines.push(`    ${color(param.description, colors.dim)}`);
			}
		}
		lines.push('');
	}

	// Request body
	if (operation.requestBody) {
		lines.push(color('Request Body:', colors.bold));
		const required = operation.requestBody.required ? color('required', colors.red) : color('optional', colors.gray);
		lines.push(`  Content-Type: ${operation.requestBody.contentType} (${required})`);
		if (operation.requestBody.description) {
			lines.push(`  ${operation.requestBody.description}`);
		}
		lines.push('');
		lines.push(`  ${color('Schema:', colors.yellow)}`);
		lines.push(formatSchema(operation.requestBody.schema, 4));
		lines.push('');
	}

	// Responses
	const responseKeys = Object.keys(operation.responses);
	if (responseKeys.length > 0) {
		lines.push(color('Responses:', colors.bold));
		for (const statusCode of responseKeys) {
			const resp = operation.responses[statusCode];
			const statusColor = statusCode.startsWith('2') ? colors.green : colors.yellow;
			lines.push(`  ${color(statusCode, statusColor)}: ${resp.description || 'No description'}`);
			if (resp.schema) {
				lines.push(`    ${color('Schema:', colors.yellow)}`);
				lines.push(formatSchema(resp.schema, 6));
			}
		}
	}

	return lines.join('\n');
}

/**
 * Format a JSON schema type
 */
function formatSchemaType(schema: Record<string, unknown>): string {
	if (schema.type === 'array') {
		const items = schema.items as Record<string, unknown> | undefined;
		const itemType = items ? formatSchemaType(items) : 'any';
		return `${itemType}[]`;
	}

	if (schema.enum) {
		return (schema.enum as unknown[]).map((v) => JSON.stringify(v)).join(' | ');
	}

	if (schema.$ref) {
		const ref = schema.$ref as string;
		return ref.split('/').pop() || 'object';
	}

	return (schema.type as string) || 'any';
}

/**
 * Format a JSON schema for display
 */
function formatSchema(schema: Record<string, unknown>, indent = 0): string {
	const pad = ' '.repeat(indent);
	const lines: string[] = [];

	if (schema.type === 'object' || schema.properties) {
		lines.push(`${pad}{`);
		const props = (schema.properties || {}) as Record<string, Record<string, unknown>>;
		const required = (schema.required || []) as string[];

		for (const [name, prop] of Object.entries(props)) {
			const isRequired = required.includes(name);
			const type = formatSchemaType(prop);
			const reqMark = isRequired ? color(' (required)', colors.red) : '';
			lines.push(`${pad}  "${name}": ${type}${reqMark}`);
			if (prop.description) {
				lines.push(`${pad}    // ${prop.description}`);
			}
		}
		lines.push(`${pad}}`);
	} else if (schema.type === 'array') {
		const items = schema.items as Record<string, unknown> | undefined;
		if (items) {
			lines.push(`${pad}[`);
			lines.push(formatSchema(items, indent + 2));
			lines.push(`${pad}]`);
		} else {
			lines.push(`${pad}[]`);
		}
	} else {
		lines.push(`${pad}${formatSchemaType(schema)}`);
	}

	return lines.join('\n');
}

/**
 * Format API response for display
 */
export function formatApiResponse(response: ApiResponse): string {
	if (typeof response.body === 'object' && response.body !== null) {
		return JSON.stringify(response.body, null, 2);
	}
	return String(response.body);
}

/**
 * Format as JSON
 */
export function formatJson(data: unknown): string {
	return JSON.stringify(data, null, 2);
}

/**
 * Format error message
 */
export function formatError(message: string): string {
	return color(`Error: ${message}`, colors.red);
}

/**
 * Format config sources
 */
export function formatConfigSources(
	sources: ConfigSource[],
	duplicates: Array<{ name: string; sources: ConfigSource[] }>,
): string {
	const lines: string[] = [];

	lines.push(color('Config Sources:', colors.bold));
	for (const source of sources) {
		lines.push(`  ${source.label}`);
	}

	if (duplicates.length > 0) {
		lines.push('');
		lines.push(color('Duplicates (first occurrence used):', colors.yellow));
		for (const dup of duplicates) {
			lines.push(`  ${dup.name}: ${dup.sources.map((s) => s.label).join(', ')}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format servers with operations list (like mcp-cli)
 */
export function formatServersWithOps(
	servers: Array<{
		name: string;
		operations: Array<{
			operationId: string;
			method: string;
			path: string;
			summary?: string;
		}>;
		info?: { title: string; version: string };
		source?: ConfigSource;
		error?: string;
	}>,
	withDescriptions: boolean,
	showSource = false,
): string {
	const lines: string[] = [];

	for (const server of servers) {
		let serverLine = color(server.name, colors.bold + colors.cyan);
		if (showSource && server.source) {
			serverLine += ` ${color(`(${server.source.label})`, colors.gray)}`;
		}
		lines.push(serverLine);

		if (server.error) {
			lines.push(`  ${color(`<error: ${server.error}>`, colors.red)}`);
		} else {
			for (const op of server.operations) {
				if (withDescriptions && op.summary) {
					lines.push(`  • ${op.operationId} - ${color(op.summary, colors.dim)}`);
				} else {
					lines.push(`  • ${op.operationId}`);
				}
			}
		}

		lines.push('');
	}

	return lines.join('\n').trimEnd();
}
