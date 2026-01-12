/**
 * API-CLI Configuration Discovery and Loading
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	ApiCliConfigSchema,
	type ConfigSource,
	type MergedConfig,
	type ServerConfig,
	type ServerWithSource,
} from './schema';

// Re-export types
export type { ConfigSource, MergedConfig, ServerConfig, ServerWithSource };

/**
 * Default configuration values
 */
export const DEFAULT_TIMEOUT_SECONDS = 30;
export const DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_SECONDS * 1000;

/**
 * Debug logging utility
 */
export function debug(message: string): void {
	if (process.env.API_CLI_DEBUG) {
		console.error(`[api-cli] ${message}`);
	}
}

/**
 * Get configured timeout in milliseconds
 */
export function getTimeoutMs(): number {
	const envTimeout = process.env.API_CLI_TIMEOUT;
	if (envTimeout) {
		const seconds = Number.parseInt(envTimeout, 10);
		if (!Number.isNaN(seconds) && seconds > 0) {
			return seconds * 1000;
		}
	}
	return DEFAULT_TIMEOUT_MS;
}

/**
 * Get environment variable value
 */
function getEnvValue(varName: string): string | undefined {
	return process.env[varName];
}

/**
 * Substitute environment variables in a string
 */
function substituteEnvVars(value: string): string {
	const missingVars: string[] = [];

	const result = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
		const envValue = getEnvValue(varName);
		if (envValue === undefined) {
			missingVars.push(varName);
			return match; // Keep original ${VAR}
		}
		return envValue;
	});

	if (missingVars.length > 0) {
		const varList = missingVars.map((v) => `\${${v}}`).join(', ');
		const message = `Missing environment variable${missingVars.length > 1 ? 's' : ''}: ${varList}`;
		console.error(`[api-cli] Warning: ${message}`);
	}

	return result;
}

/**
 * Recursively substitute environment variables in an object
 */
function substituteEnvVarsInObject<T>(obj: T): T {
	if (typeof obj === 'string') {
		return substituteEnvVars(obj) as T;
	}
	if (Array.isArray(obj)) {
		return obj.map(substituteEnvVarsInObject) as T;
	}
	if (obj && typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = substituteEnvVarsInObject(value);
		}
		return result as T;
	}
	return obj;
}

/**
 * Config search locations
 */
interface ConfigLocation {
	path: string;
	label: string;
}

/**
 * Get all config search paths
 */
function getConfigSearchPaths(cwd: string = process.cwd()): ConfigLocation[] {
	const home = homedir();
	const paths: ConfigLocation[] = [];

	// Project-level configs (higher priority)
	paths.push({
		path: resolve(cwd, '.api-cli.local.json'),
		label: './.api-cli.local.json',
	});

	paths.push({
		path: resolve(cwd, '.api-cli.json'),
		label: './.api-cli.json',
	});

	// User-level configs
	paths.push({
		path: join(home, '.api-cli.local.json'),
		label: '~/.api-cli.local.json',
	});

	paths.push({
		path: join(home, '.api-cli.json'),
		label: '~/.api-cli.json',
	});

	return paths;
}

/**
 * Parse a config file and return both env and servers
 */
function parseConfigFile(
	content: string,
	location: ConfigLocation,
): { env?: Record<string, string>; servers: Record<string, ServerConfig> } | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		debug(`Failed to parse JSON: ${location.path}`);
		return null;
	}

	const result = ApiCliConfigSchema.safeParse(parsed);
	if (!result.success) {
		debug(`Invalid config format: ${location.path} - ${result.error.message}`);
		return null;
	}

	return {
		env: result.data.env ?? undefined,
		servers: result.data.servers ?? {},
	};
}

/**
 * Load a single config file
 */
function loadConfigFile(location: ConfigLocation): {
	env?: Record<string, string>;
	servers: Record<string, ServerConfig>;
	source: ConfigSource;
} | null {
	if (!existsSync(location.path)) {
		return null;
	}

	try {
		const content = readFileSync(location.path, 'utf-8');
		const parsed = parseConfigFile(content, location);
		if (!parsed) {
			return null;
		}

		const source: ConfigSource = {
			path: location.path,
			label: location.label,
		};

		return { env: parsed.env, servers: parsed.servers, source };
	} catch (error) {
		debug(`Failed to load config: ${location.path} - ${(error as Error).message}`);
		return null;
	}
}

/**
 * Apply environment variables from config
 */
function applyEnvFromConfig(env: Record<string, string> | undefined, source: string): void {
	if (!env) return;

	for (const [key, value] of Object.entries(env)) {
		if (process.env[key] === undefined) {
			process.env[key] = value;
			debug(`Set env ${key} from ${source}`);
		}
	}
}

/**
 * Discover and merge all configurations
 */
export function discoverConfigs(cwd?: string): MergedConfig {
	const searchPaths = getConfigSearchPaths(cwd);
	const servers = new Map<string, ServerWithSource>();
	const sources: ConfigSource[] = [];
	const duplicateMap = new Map<string, ConfigSource[]>();

	// First pass: collect all env values (higher priority configs first)
	const configResults: Array<{
		env?: Record<string, string>;
		servers: Record<string, ServerConfig>;
		source: ConfigSource;
	}> = [];

	for (const location of searchPaths) {
		const result = loadConfigFile(location);
		if (!result) continue;
		configResults.push(result);
	}

	// Apply env values in reverse order (lower priority first, so higher priority wins)
	for (let i = configResults.length - 1; i >= 0; i--) {
		applyEnvFromConfig(configResults[i].env, configResults[i].source.label);
	}

	// Second pass: process servers with substitution
	for (const result of configResults) {
		sources.push(result.source);
		debug(`Found config: ${result.source.label}`);

		for (const [name, rawConfig] of Object.entries(result.servers)) {
			const config = substituteEnvVarsInObject(rawConfig);

			if (servers.has(name)) {
				const existing = duplicateMap.get(name) ?? [servers.get(name)!.source];
				existing.push(result.source);
				duplicateMap.set(name, existing);
				debug(`Duplicate server: ${name} (keeping first from ${servers.get(name)!.source.label})`);
			} else {
				servers.set(name, {
					name,
					config,
					source: result.source,
				});
			}
		}
	}

	const duplicates = Array.from(duplicateMap.entries()).map(([name, srcs]) => ({
		name,
		sources: srcs,
	}));

	return { servers, sources, duplicates };
}

/**
 * Load config from a specific path
 */
export function loadConfigFromPath(configPath: string): MergedConfig {
	const resolvedPath = resolve(configPath);

	if (!existsSync(resolvedPath)) {
		throw new Error(`Config file not found: ${resolvedPath}`);
	}

	const content = readFileSync(resolvedPath, 'utf-8');
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
	}

	const result = ApiCliConfigSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(`Invalid config format: ${result.error.message}`);
	}

	const source: ConfigSource = {
		path: resolvedPath,
		label: configPath,
	};

	// Apply env values first
	applyEnvFromConfig(result.data.env ?? undefined, source.label);

	const rawServers = result.data.servers ?? {};
	const servers = new Map<string, ServerWithSource>();
	for (const [name, rawConfig] of Object.entries(rawServers)) {
		const config = substituteEnvVarsInObject(rawConfig);
		servers.set(name, { name, config, source });
	}

	return { servers, sources: [source], duplicates: [] };
}

/**
 * Load configuration (auto-discover or from explicit path)
 */
export async function loadConfig(explicitPath?: string): Promise<MergedConfig> {
	if (explicitPath) {
		return loadConfigFromPath(explicitPath);
	}

	const envPath = process.env.API_CLI_CONFIG_PATH;
	if (envPath) {
		return loadConfigFromPath(envPath);
	}

	return discoverConfigs();
}

/**
 * Get server config by name
 */
export function getServerConfig(config: MergedConfig, serverName: string): ServerWithSource {
	const server = config.servers.get(serverName);
	if (!server) {
		const available = Array.from(config.servers.keys());
		throw new Error(`Server "${serverName}" not found. Available: ${available.join(', ') || '(none)'}`);
	}
	return server;
}

/**
 * List all server names
 */
export function listServerNames(config: MergedConfig): string[] {
	return Array.from(config.servers.keys()).sort();
}

/**
 * Get the default config file path for api-cli
 */
export function getDefaultConfigPath(cwd: string = process.cwd()): string {
	return resolve(cwd, '.api-cli.json');
}

/**
 * Read raw config from file
 */
export function readConfigFile(configPath: string): { servers: Record<string, ServerConfig> } {
	if (!existsSync(configPath)) {
		return { servers: {} };
	}

	const content = readFileSync(configPath, 'utf-8');
	const parsed = JSON.parse(content);
	const result = ApiCliConfigSchema.safeParse(parsed);

	if (!result.success) {
		throw new Error(`Invalid config format in ${configPath}: ${result.error.message}`);
	}

	return { servers: result.data.servers ?? {} };
}

/**
 * Write config to file
 */
export function writeConfigFile(configPath: string, config: { servers: Record<string, ServerConfig> }): void {
	const content = JSON.stringify(config, null, 2);
	writeFileSync(configPath, content + '\n', 'utf-8');
}
