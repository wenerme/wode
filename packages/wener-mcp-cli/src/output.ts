/**
 * Output formatting utilities
 */

import { getAnsiStyle } from '@wener/utils';
import { formatJsonSchema } from 'common/utils';
import type { ResourceInfo, ToolInfo } from './client';
import { getServerUrl, isHttpServer, type ConfigSource, type ServerConfig } from './schema';

// Get ANSI style formatter (auto-detects color support)
const ansi = getAnsiStyle();

/**
 * Format tool annotations as compact string
 */
function formatAnnotationsCompact(annotations: ToolInfo['annotations']): string {
	if (!annotations) return '';

	const hints: string[] = [];
	if (annotations.readOnlyHint) hints.push('readonly');
	if (annotations.destructiveHint) hints.push('destructive');
	if (annotations.idempotentHint) hints.push('idempotent');
	if (annotations.openWorldHint) hints.push('open-world');

	if (hints.length === 0) return '';
	return `[${hints.join(', ')}]`;
}

/**
 * Format server list for display
 */
export function formatServerList(
	servers: Array<{ name: string; tools: ToolInfo[]; source?: ConfigSource }>,
	withDescriptions: boolean,
	showSource = false,
	verbose = false,
): string {
	const lines: string[] = [];

	for (const server of servers) {
		let serverLine = ansi.bold.cyan(server.name);
		if (showSource && server.source) {
			serverLine += ` ${ansi.gray(`(${server.source.label})`)}`;
		}
		lines.push(serverLine);

		for (const tool of server.tools) {
			let toolLine = `  • ${tool.name}`;

			// In verbose mode, show compact input schema
			if (verbose && tool.inputSchema) {
				const compactSchema = formatJsonSchema(tool.inputSchema as Record<string, unknown>);
				if (compactSchema && compactSchema !== '{}') {
					toolLine += ` ${ansi.gray(compactSchema)}`;
				}
			}

			// Add annotation hints if verbose
			if (verbose && tool.annotations) {
				const hints = formatAnnotationsCompact(tool.annotations);
				if (hints) {
					toolLine += ` ${ansi.yellow(hints)}`;
				}
			}

			if (withDescriptions && tool.description) {
				toolLine += ` - ${ansi.dim(tool.description)}`;
			}

			lines.push(toolLine);
		}

		lines.push('');
	}

	return lines.join('\n').trimEnd();
}

/**
 * Format search results
 */
export function formatSearchResults(
	results: Array<{ server: string; tool: ToolInfo }>,
	withDescriptions: boolean,
): string {
	const lines: string[] = [];

	for (const result of results) {
		const path = `${ansi.cyan(result.server)}/${ansi.green(result.tool.name)}`;
		if (withDescriptions && result.tool.description) {
			lines.push(`${path} - ${ansi.dim(result.tool.description)}`);
		} else {
			lines.push(path);
		}
	}

	return lines.join('\n');
}

/**
 * Format server details
 */
export function formatServerDetails(
	serverName: string,
	config: ServerConfig,
	tools: ToolInfo[],
	source?: ConfigSource,
	withDescriptions = false,
): string {
	const lines: string[] = [];

	lines.push(`${ansi.bold('Server:')} ${ansi.cyan(serverName)}`);

	if (source) {
		lines.push(`${ansi.bold('Source:')} ${source.label}`);
	}

	if (isHttpServer(config)) {
		lines.push(`${ansi.bold('Transport:')} HTTP`);
		lines.push(`${ansi.bold('URL:')} ${getServerUrl(config)}`);
	} else {
		lines.push(`${ansi.bold('Transport:')} stdio`);
		lines.push(`${ansi.bold('Command:')} ${config.command} ${(config.args || []).join(' ')}`);
	}

	lines.push('');
	lines.push(ansi.bold(`Tools (${tools.length}):`));

	for (const tool of tools) {
		lines.push(`  ${ansi.green(tool.name)}`);
		if (withDescriptions && tool.description) {
			lines.push(`    ${ansi.dim(tool.description)}`);
		}

		const schema = tool.inputSchema as {
			properties?: Record<string, { type?: string; description?: string }>;
			required?: string[];
		};
		if (schema.properties) {
			lines.push(`    ${ansi.yellow('Parameters:')}`);
			for (const [name, prop] of Object.entries(schema.properties)) {
				const required = schema.required?.includes(name) ? 'required' : 'optional';
				const type = prop.type || 'any';
				const desc = withDescriptions && prop.description ? ` - ${prop.description}` : '';
				lines.push(`      • ${name} (${type}, ${required})${desc}`);
			}
		}
		lines.push('');
	}

	return lines.join('\n').trimEnd();
}

/**
 * Format tool schema
 */
export function formatToolSchema(serverName: string, tool: ToolInfo): string {
	const lines: string[] = [];

	lines.push(`${ansi.bold('Tool:')} ${ansi.green(tool.name)}`);
	lines.push(`${ansi.bold('Server:')} ${ansi.cyan(serverName)}`);
	lines.push('');

	if (tool.description) {
		lines.push(ansi.bold('Description:'));
		lines.push(`  ${tool.description}`);
		lines.push('');
	}

	// Show annotations if present
	if (tool.annotations) {
		lines.push(ansi.bold('Annotations:'));
		if (tool.annotations.title) {
			lines.push(`  ${ansi.yellow('Title:')} ${tool.annotations.title}`);
		}
		if (tool.annotations.readOnlyHint !== undefined) {
			const hint = tool.annotations.readOnlyHint ? ansi.green('true') : 'false';
			lines.push(`  ${ansi.yellow('Read-only:')} ${hint}`);
		}
		if (tool.annotations.destructiveHint !== undefined) {
			const hint = tool.annotations.destructiveHint ? ansi.red('true') : 'false';
			lines.push(`  ${ansi.yellow('Destructive:')} ${hint}`);
		}
		if (tool.annotations.idempotentHint !== undefined) {
			const hint = tool.annotations.idempotentHint ? 'true' : 'false';
			lines.push(`  ${ansi.yellow('Idempotent:')} ${hint}`);
		}
		if (tool.annotations.openWorldHint !== undefined) {
			const hint = tool.annotations.openWorldHint ? 'true' : 'false';
			lines.push(`  ${ansi.yellow('Open-world:')} ${hint}`);
		}
		lines.push('');
	}

	// Show human-readable signature first
	if (tool.inputSchema) {
		const compactSchema = formatJsonSchema(tool.inputSchema as Record<string, unknown>);
		lines.push(ansi.bold('Signature:'));
		lines.push(`  ${ansi.green(tool.name)} ${ansi.cyan(compactSchema)}`);
		lines.push('');
	}

	lines.push(ansi.bold('Input Schema:'));
	lines.push(JSON.stringify(tool.inputSchema, null, 2));

	return lines.join('\n');
}

/**
 * Format resource list
 */
export function formatResourceList(resources: ResourceInfo[], serverName: string, withDescriptions: boolean): string {
	const lines: string[] = [];

	lines.push(`${ansi.bold('Server:')} ${ansi.cyan(serverName)}`);
	lines.push(ansi.bold(`Resources (${resources.length}):`));

	for (const resource of resources) {
		let line = `  ${ansi.green(resource.name)}`;
		if (resource.mimeType) {
			line += ` ${ansi.gray(`[${resource.mimeType}]`)}`;
		}
		lines.push(line);

		if (withDescriptions && resource.description) {
			lines.push(`    ${ansi.dim(resource.description)}`);
		}
		lines.push(`    URI: ${resource.uri}`);
	}

	return lines.join('\n');
}

/**
 * Format tool call result
 */
export function formatToolResult(result: unknown): string {
	if (typeof result === 'object' && result !== null) {
		const r = result as { content?: Array<{ type: string; text?: string }> };

		if (r.content && Array.isArray(r.content)) {
			const textParts = r.content.filter((c) => c.type === 'text' && c.text).map((c) => c.text);

			if (textParts.length > 0) {
				return textParts.join('\n');
			}
		}
	}

	return JSON.stringify(result, null, 2);
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
	return ansi.red(`Error: ${message}`);
}

/**
 * Format config sources
 */
export function formatConfigSources(
	sources: ConfigSource[],
	duplicates: Array<{ name: string; sources: ConfigSource[] }>,
): string {
	const lines: string[] = [];

	lines.push(ansi.bold('Config Sources:'));
	for (const source of sources) {
		lines.push(`  ${ansi.cyan(source.type)}: ${source.label}`);
	}

	if (duplicates.length > 0) {
		lines.push('');
		lines.push(ansi.yellow('Duplicates (first occurrence used):'));
		for (const dup of duplicates) {
			lines.push(`  ${dup.name}: ${dup.sources.map((s) => s.label).join(', ')}`);
		}
	}

	return lines.join('\n');
}
