/**
 * Add command - Add MCP server configuration
 * Follows Claude's syntax for adding servers
 */

import { getDefaultConfigPath, readConfigFile, writeConfigFile } from '../config';
import type { HttpServerConfig, StdioServerConfig } from '../schema';

export interface AddOptions {
	transport: 'http' | 'sse' | 'stdio';
	env: string[];
	name: string;
	urlOrCommand: string;
	args: string[];
	json: boolean;
}

export async function addCommand(options: AddOptions): Promise<void> {
	const configPath = getDefaultConfigPath();
	const config = readConfigFile(configPath);

	// Check if server already exists
	if (config.mcpServers[options.name]) {
		if (options.json) {
			console.log(JSON.stringify({ error: `Server "${options.name}" already exists` }));
		} else {
			console.error(`Error: Server "${options.name}" already exists in ${configPath}`);
			console.error(`Use "mcp-cli rm ${options.name}" first to remove it.`);
		}
		process.exit(1);
	}

	let serverConfig: StdioServerConfig | HttpServerConfig;

	if (options.transport === 'http' || options.transport === 'sse') {
		// HTTP/SSE server
		serverConfig = {
			url: options.urlOrCommand,
		};
	} else {
		// stdio server
		const env: Record<string, string> = {};
		for (const e of options.env) {
			const [key, ...valueParts] = e.split('=');
			if (key && valueParts.length > 0) {
				env[key] = valueParts.join('=');
			}
		}

		serverConfig = {
			command: options.urlOrCommand,
			...(options.args.length > 0 && { args: options.args }),
			...(Object.keys(env).length > 0 && { env }),
		};
	}

	config.mcpServers[options.name] = serverConfig;
	writeConfigFile(configPath, config);

	if (options.json) {
		console.log(
			JSON.stringify({
				success: true,
				name: options.name,
				config: serverConfig,
				path: configPath,
			}),
		);
	} else {
		console.log(`Added server "${options.name}" to ${configPath}`);
	}
}
