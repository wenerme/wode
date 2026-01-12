/**
 * Remove command - Remove MCP server configuration(s)
 */

import { getDefaultConfigPath, readConfigFile, writeConfigFile } from '../config';

export interface RmOptions {
	names: string[];
	json: boolean;
}

export async function rmCommand(options: RmOptions): Promise<void> {
	const configPath = getDefaultConfigPath();
	const config = readConfigFile(configPath);

	const removed: string[] = [];
	const notFound: string[] = [];

	for (const name of options.names) {
		if (config.mcpServers[name]) {
			delete config.mcpServers[name];
			removed.push(name);
		} else {
			notFound.push(name);
		}
	}

	if (removed.length > 0) {
		writeConfigFile(configPath, config);
	}

	if (options.json) {
		console.log(
			JSON.stringify({
				removed,
				notFound,
				path: configPath,
			}),
		);
	} else {
		if (removed.length > 0) {
			console.log(`Removed ${removed.length} server(s) from ${configPath}: ${removed.join(', ')}`);
		}
		if (notFound.length > 0) {
			console.error(`Server(s) not found: ${notFound.join(', ')}`);
		}
	}

	if (notFound.length > 0 && removed.length === 0) {
		process.exit(1);
	}
}
