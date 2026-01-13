/**
 * MCP-CLI Configuration Discovery and Loading
 * Supports multiple config sources with deduplication and source tracking
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	ClaudeConfigSchema,
	CursorConfigSchema,
	GeminiConfigSchema,
	isHttpServer,
	McpCliConfigSchema,
	McpServersConfigSchema,
	normalizeHttpConfig,
	type ConfigSource,
	type McpCliConfig,
	type MergedConfig,
	type ServerConfig,
	type ServerWithSource,
} from './schema';

// Re-export types for convenience
export type { ConfigSource, MergedConfig, ServerConfig, ServerWithSource };

/**
 * Default configuration values
 */
export const DEFAULT_TIMEOUT_SECONDS = 1800; // 30 minutes
export const DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_SECONDS * 1000;
export const DEFAULT_CONCURRENCY = 5;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Debug logging utility
 */
export function debug(message: string): void {
	if (process.env.MCP_DEBUG) {
		console.error(`[mcp-cli] ${message}`);
	}
}

/**
 * Get configured timeout in milliseconds
 */
export function getTimeoutMs(): number {
	const envTimeout = process.env.MCP_TIMEOUT;
	if (envTimeout) {
		const seconds = Number.parseInt(envTimeout, 10);
		if (!Number.isNaN(seconds) && seconds > 0) {
			return seconds * 1000;
		}
	}
	return DEFAULT_TIMEOUT_MS;
}

/**
 * Get concurrency limit for parallel server connections
 */
export function getConcurrencyLimit(): number {
	const envConcurrency = process.env.MCP_CONCURRENCY;
	if (envConcurrency) {
		const limit = Number.parseInt(envConcurrency, 10);
		if (!Number.isNaN(limit) && limit > 0) {
			return limit;
		}
	}
	return DEFAULT_CONCURRENCY;
}

/**
 * Get max retry attempts
 */
export function getMaxRetries(): number {
	const envRetries = process.env.MCP_MAX_RETRIES;
	if (envRetries) {
		const retries = Number.parseInt(envRetries, 10);
		if (!Number.isNaN(retries) && retries >= 0) {
			return retries;
		}
	}
	return DEFAULT_MAX_RETRIES;
}

/**
 * Get base delay for retry backoff
 */
export function getRetryDelayMs(): number {
	const envDelay = process.env.MCP_RETRY_DELAY;
	if (envDelay) {
		const delay = Number.parseInt(envDelay, 10);
		if (!Number.isNaN(delay) && delay > 0) {
			return delay;
		}
	}
	return DEFAULT_RETRY_DELAY_MS;
}

/**
 * Cached Claude settings env vars
 */
let claudeEnvCache: Record<string, string> | null = null;

/**
 * Load environment variables from Claude settings files
 * Reads from ~/.claude/settings.json and .claude/settings.local.json
 */
function loadClaudeSettingsEnv(): Record<string, string> {
	if (claudeEnvCache !== null) {
		return claudeEnvCache;
	}

	claudeEnvCache = {};
	const home = homedir();

	const settingsPaths = [join(home, '.claude', 'settings.json'), join(process.cwd(), '.claude', 'settings.local.json')];

	for (const settingsPath of settingsPaths) {
		if (existsSync(settingsPath)) {
			try {
				const content = readFileSync(settingsPath, 'utf-8');
				const settings = JSON.parse(content);
				if (settings.env && typeof settings.env === 'object') {
					Object.assign(claudeEnvCache, settings.env);
					debug(`Loaded env vars from ${settingsPath}`);
				}
			} catch (error) {
				debug(`Failed to load Claude settings from ${settingsPath}: ${(error as Error).message}`);
			}
		}
	}

	return claudeEnvCache;
}

/**
 * Get environment variable value, checking process.env and Claude settings
 */
function getEnvValue(varName: string): string | undefined {
	// First check process.env
	if (process.env[varName] !== undefined) {
		return process.env[varName];
	}
	// Fall back to Claude settings
	const claudeEnv = loadClaudeSettingsEnv();
	return claudeEnv[varName];
}

/**
 * Substitute environment variables in a string
 * Always warns on missing vars (never errors) - servers with missing vars will fail at connection time
 */
function substituteEnvVars(value: string): string {
	const missingVars: string[] = [];

	const result = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
		const envValue = getEnvValue(varName);
		if (envValue === undefined) {
			missingVars.push(varName);
			return match; // Keep original ${VAR} so it's visible in output
		}
		return envValue;
	});

	if (missingVars.length > 0) {
		const varList = missingVars.map((v) => `\${${v}}`).join(', ');
		const message = `Missing environment variable${missingVars.length > 1 ? 's' : ''}: ${varList}`;
		// Always warn, never error - let the server connection fail if needed
		console.error(`[mcp-cli] Warning: ${message}`);
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
 * Config search locations with type and label
 */
interface ConfigLocation {
	path: string;
	type: ConfigSource['type'];
	label: string;
}

/**
 * Get all config search paths for a given working directory
 */
function getConfigSearchPaths(cwd: string = process.cwd()): ConfigLocation[] {
	const home = homedir();
	const paths: ConfigLocation[] = [];

	// Project-level configs (higher priority)
	// mcp-cli local config (highest priority, for local env vars)
	paths.push({
		path: resolve(cwd, '.mcp-cli.local.json'),
		type: 'mcp',
		label: './.mcp-cli.local.json',
	});

	// mcp-cli specific config
	paths.push({
		path: resolve(cwd, '.mcp-cli.json'),
		type: 'mcp',
		label: './.mcp-cli.json',
	});

	// Claude standard: .mcp.json (hidden file)
	paths.push({
		path: resolve(cwd, '.mcp.json'),
		type: 'mcp',
		label: './.mcp.json',
	});

	paths.push({
		path: resolve(cwd, '.cursor', 'mcp.json'),
		type: 'cursor',
		label: './.cursor/mcp.json',
	});

	paths.push({
		path: resolve(cwd, '.gemini', 'mcp_config.json'),
		type: 'gemini',
		label: './.gemini/mcp_config.json',
	});

	// User-level configs
	paths.push({
		path: join(home, '.mcp-cli.local.json'),
		type: 'mcp',
		label: '~/.mcp-cli.local.json',
	});

	paths.push({
		path: join(home, '.mcp-cli.json'),
		type: 'mcp',
		label: '~/.mcp-cli.json',
	});

	paths.push({
		path: join(home, '.claude.json'),
		type: 'claude',
		label: '~/.claude.json',
	});

	paths.push({
		path: join(home, '.cursor', 'mcp.json'),
		type: 'cursor',
		label: '~/.cursor/mcp.json',
	});

	paths.push({
		path: join(home, '.gemini', 'antigravity', 'mcp_config.json'),
		type: 'gemini',
		label: '~/.gemini/antigravity/mcp_config.json',
	});

	// Legacy mcp_servers.json locations
	paths.push({
		path: resolve(cwd, 'mcp_servers.json'),
		type: 'mcp',
		label: './mcp_servers.json',
	});

	paths.push({
		path: join(home, '.mcp_servers.json'),
		type: 'mcp',
		label: '~/.mcp_servers.json',
	});

	paths.push({
		path: join(home, '.config', 'mcp', 'mcp_servers.json'),
		type: 'mcp',
		label: '~/.config/mcp/mcp_servers.json',
	});

	return paths;
}

/**
 * Parse a config file based on its type
 * Returns both servers and mcp-cli specific options (extends, discoveryConfig)
 */
function parseConfigFile(
	content: string,
	location: ConfigLocation,
): { servers: Record<string, ServerConfig>; options?: McpCliConfig } | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		debug(`Failed to parse JSON: ${location.path}`);
		return null;
	}

	// For mcp-cli configs, try to parse with extended schema first
	if (location.type === 'mcp' && (location.label.includes('mcp-cli') || location.label === 'MCP_CLI_CONFIG_INLINE')) {
		const cliResult = McpCliConfigSchema.safeParse(parsed);
		if (cliResult.success) {
			return {
				servers: cliResult.data.mcpServers ?? {},
				options: cliResult.data,
			};
		}
	}

	let schema;
	switch (location.type) {
		case 'claude':
			schema = ClaudeConfigSchema;
			break;
		case 'cursor':
			schema = CursorConfigSchema;
			break;
		case 'gemini':
			schema = GeminiConfigSchema;
			break;
		case 'mcp':
			schema = McpServersConfigSchema;
			break;
	}

	const result = schema.safeParse(parsed);
	if (!result.success) {
		debug(`Invalid config format: ${location.path} - ${result.error.message}`);
		return null;
	}

	return { servers: result.data.mcpServers ?? {} };
}

/**
 * Load a single config file
 */
function loadConfigFile(location: ConfigLocation): {
	servers: Record<string, ServerConfig>;
	source: ConfigSource;
	options?: McpCliConfig;
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
			type: location.type,
			label: location.label,
		};

		return { servers: parsed.servers, source, options: parsed.options };
	} catch (error) {
		debug(`Failed to load config: ${location.path} - ${(error as Error).message}`);
		return null;
	}
}

/**
 * Helper to add servers to the merged config
 */
function addServersToConfig(
	servers: Map<string, ServerWithSource>,
	duplicateMap: Map<string, ConfigSource[]>,
	rawServers: Record<string, ServerConfig>,
	source: ConfigSource,
): void {
	for (const [name, rawConfig] of Object.entries(rawServers)) {
		// Normalize and substitute env vars
		let config = substituteEnvVarsInObject(rawConfig);
		if (isHttpServer(config)) {
			config = normalizeHttpConfig(config);
		}

		if (servers.has(name)) {
			// Track duplicate
			const existing = duplicateMap.get(name) ?? [servers.get(name)!.source];
			existing.push(source);
			duplicateMap.set(name, existing);
			debug(`Duplicate server: ${name} (keeping first from ${servers.get(name)!.source.label})`);
		} else {
			servers.set(name, {
				name,
				config,
				source,
			});
		}
	}
}

/**
 * Parse inline config from MCP_CLI_CONFIG_INLINE env var
 */
function parseInlineConfig(): { servers: Record<string, ServerConfig>; options?: McpCliConfig } | null {
	const inlineConfig = process.env.MCP_CLI_CONFIG_INLINE;
	if (!inlineConfig) {
		return null;
	}

	const location: ConfigLocation = {
		path: 'MCP_CLI_CONFIG_INLINE',
		type: 'mcp',
		label: 'MCP_CLI_CONFIG_INLINE',
	};

	return parseConfigFile(inlineConfig, location);
}

/**
 * Convert glob pattern to regex for server name matching
 */
function globToRegex(pattern: string): RegExp {
	let escaped = '';
	let i = 0;

	while (i < pattern.length) {
		const char = pattern[i];

		if (char === '*' && pattern[i + 1] === '*') {
			escaped += '.*';
			i += 2;
			while (pattern[i] === '*') {
				i++;
			}
		} else if (char === '*') {
			escaped += '[^/]*';
			i += 1;
		} else if (char === '?') {
			escaped += '[^/]';
			i += 1;
		} else if ('[.+^${}()|\\]'.includes(char)) {
			escaped += `\\${char}`;
			i += 1;
		} else {
			escaped += char;
			i += 1;
		}
	}

	return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Check if a server name matches any of the patterns
 */
function matchesPatterns(name: string, patterns: string[]): boolean {
	return patterns.some((pattern) => {
		const regex = globToRegex(pattern);
		return regex.test(name);
	});
}

/**
 * Filter servers based on include/exclude patterns
 */
function filterServers(
	servers: Map<string, ServerWithSource>,
	include?: string[],
	exclude?: string[],
): Map<string, ServerWithSource> {
	let filtered = new Map(servers);

	// Apply include filter (whitelist)
	if (include && include.length > 0) {
		filtered = new Map(
			Array.from(filtered.entries()).filter(([name]) => matchesPatterns(name, include)),
		);
		debug(`Include filter applied: ${filtered.size} servers remaining`);
	}

	// Apply exclude filter (blacklist) - takes precedence
	if (exclude && exclude.length > 0) {
		filtered = new Map(
			Array.from(filtered.entries()).filter(([name]) => !matchesPatterns(name, exclude)),
		);
		debug(`Exclude filter applied: ${filtered.size} servers remaining`);
	}

	return filtered;
}

/**
 * Discover and merge all MCP configurations
 * Returns merged config with deduplication and source tracking
 */
export function discoverConfigs(cwd?: string, options?: { skipDiscovery?: boolean }): MergedConfig {
	const searchPaths = getConfigSearchPaths(cwd);
	const servers = new Map<string, ServerWithSource>();
	const sources: ConfigSource[] = [];
	const duplicateMap = new Map<string, ConfigSource[]>();

	// Track extends paths to load and config options
	let extendsToLoad: string[] = [];
	let discoveryConfig = true;
	let includePatterns: string[] = [];
	let excludePatterns: string[] = [];
	const loadedPaths = new Set<string>();

	// First, check MCP_CLI_CONFIG_INLINE env var for inline config
	const inlineConfig = parseInlineConfig();
	if (inlineConfig) {
		const source: ConfigSource = {
			path: 'MCP_CLI_CONFIG_INLINE',
			type: 'mcp',
			label: 'MCP_CLI_CONFIG_INLINE',
		};
		sources.push(source);
		debug('Found inline config: MCP_CLI_CONFIG_INLINE');

		addServersToConfig(servers, duplicateMap, inlineConfig.servers, source);

		if (inlineConfig.options?.extends) {
			extendsToLoad = [...inlineConfig.options.extends];
		}
		if (inlineConfig.options?.discoveryConfig === false) {
			discoveryConfig = false;
		}
		if (inlineConfig.options?.include) {
			includePatterns = [...inlineConfig.options.include];
		}
		if (inlineConfig.options?.exclude) {
			excludePatterns = [...inlineConfig.options.exclude];
		}
	}

	// Load mcp-cli specific configs first to get extends/discoveryConfig/include/exclude
	const mcpCliPaths = searchPaths.filter((p) => p.label.includes('mcp-cli'));
	for (const location of mcpCliPaths) {
		const result = loadConfigFile(location);
		if (!result) continue;

		loadedPaths.add(location.path);
		sources.push(result.source);
		debug(`Found config: ${location.label}`);

		addServersToConfig(servers, duplicateMap, result.servers, result.source);

		// Check for options (first one wins for each option)
		if (result.options?.extends && extendsToLoad.length === 0) {
			extendsToLoad = [...result.options.extends];
		}
		if (result.options?.discoveryConfig === false) {
			discoveryConfig = false;
		}
		if (result.options?.include && includePatterns.length === 0) {
			includePatterns = [...result.options.include];
		}
		if (result.options?.exclude && excludePatterns.length === 0) {
			excludePatterns = [...result.options.exclude];
		}
	}

	// Load extends configs
	for (const extendPath of extendsToLoad) {
		const resolvedPath = resolve(cwd ?? process.cwd(), extendPath);
		if (loadedPaths.has(resolvedPath)) {
			debug(`Skipping already loaded extends: ${extendPath}`);
			continue;
		}

		const location: ConfigLocation = {
			path: resolvedPath,
			type: 'mcp',
			label: extendPath,
		};

		const result = loadConfigFile(location);
		if (!result) {
			debug(`Failed to load extends: ${extendPath}`);
			continue;
		}

		loadedPaths.add(resolvedPath);
		sources.push(result.source);
		debug(`Found extends config: ${extendPath}`);

		addServersToConfig(servers, duplicateMap, result.servers, result.source);
	}

	// If discoveryConfig is disabled or skipDiscovery is set, skip other configs
	if (!discoveryConfig || options?.skipDiscovery) {
		debug('Discovery disabled, skipping other configs');
	} else {
		// Load remaining configs (non mcp-cli)
		const otherPaths = searchPaths.filter((p) => !p.label.includes('mcp-cli'));
		for (const location of otherPaths) {
			if (loadedPaths.has(location.path)) continue;

			const result = loadConfigFile(location);
			if (!result) continue;

			loadedPaths.add(location.path);
			sources.push(result.source);
			debug(`Found config: ${location.label}`);

			addServersToConfig(servers, duplicateMap, result.servers, result.source);
		}
	}

	const duplicates = Array.from(duplicateMap.entries()).map(([name, srcs]) => ({
		name,
		sources: srcs,
	}));

	// Apply include/exclude filters
	const filteredServers = filterServers(servers, includePatterns, excludePatterns);

	return { servers: filteredServers, sources, duplicates };
}

/**
 * Load config from a specific path (explicit config file)
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
	} catch (error) {
		throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
	}

	const result = McpServersConfigSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(`Invalid config format: ${result.error.message}`);
	}

	const rawServers = result.data.mcpServers ?? {};
	const source: ConfigSource = {
		path: resolvedPath,
		type: 'mcp',
		label: configPath,
	};

	const servers = new Map<string, ServerWithSource>();
	for (const [name, rawConfig] of Object.entries(rawServers)) {
		let config = substituteEnvVarsInObject(rawConfig);
		if (isHttpServer(config)) {
			config = normalizeHttpConfig(config);
		}
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

	const envPath = process.env.MCP_CONFIG_PATH;
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
 * Get the default config file path for mcp-cli (for add/rm commands)
 * Uses .mcp-cli.json in the current directory
 */
export function getDefaultConfigPath(cwd: string = process.cwd()): string {
	return resolve(cwd, '.mcp-cli.json');
}

/**
 * Read raw config from file, returns empty mcpServers object if file doesn't exist
 */
export function readConfigFile(configPath: string): { mcpServers: Record<string, ServerConfig> } {
	if (!existsSync(configPath)) {
		return { mcpServers: {} };
	}

	const content = readFileSync(configPath, 'utf-8');
	const parsed = JSON.parse(content);
	const result = McpServersConfigSchema.safeParse(parsed);

	if (!result.success) {
		throw new Error(`Invalid config format in ${configPath}: ${result.error.message}`);
	}

	return { mcpServers: result.data.mcpServers ?? {} };
}

/**
 * Write config to file
 */
export function writeConfigFile(configPath: string, config: { mcpServers: Record<string, ServerConfig> }): void {
	const content = JSON.stringify(config, null, 2);
	writeFileSync(configPath, content + '\n', 'utf-8');
}
