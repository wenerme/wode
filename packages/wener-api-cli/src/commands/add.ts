/**
 * Add command - Add server configuration
 */

import { getDefaultConfigPath, readConfigFile, writeConfigFile } from '../config';
import type { ServerConfig } from '../schema';

export interface AddOptions {
	name: string;
	specUrl: string;
	baseUrl?: string;
	headers?: string[];
	json: boolean;
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
 * Execute the add command
 */
export async function addCommand(options: AddOptions): Promise<void> {
	const configPath = getDefaultConfigPath();
	const config = readConfigFile(configPath);

	// Check if server already exists
	if (config.servers[options.name]) {
		if (options.json) {
			console.log(JSON.stringify({ error: `Server "${options.name}" already exists` }));
		} else {
			console.error(`Error: Server "${options.name}" already exists in ${configPath}`);
			console.error(`Use "api-cli rm ${options.name}" first to remove it.`);
		}
		process.exit(1);
	}

	// Build server config
	const headers = parseHeaders(options.headers);
	const serverConfig: ServerConfig = {
		url: options.specUrl,
		type: 'openapi',
		...(options.baseUrl && { baseUrl: options.baseUrl }),
		...(Object.keys(headers).length > 0 && { headers }),
	};

	config.servers[options.name] = serverConfig;
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
