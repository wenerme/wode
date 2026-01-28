/**
 * MCP-CLI Configuration Discovery and Loading
 * Supports multiple config sources with deduplication and source tracking
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { z } from 'zod';
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
 * Cached env vars from all sources
 */
let envCache: Record<string, string> | null = null;

/**
 * Parse a .env file content into key-value pairs
 */
function parseDotEnv(content: string): Record<string, string> {
	const env: Record<string, string> = {};
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		// Skip empty lines and comments
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();
		// Remove surrounding quotes
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		env[key] = value;
	}
	return env;
}

/**
 * Load environment variables from .env files
 * Reads from .env and .env.local in cwd
 */
function loadDotEnvFiles(cwd: string = process.cwd()): Record<string, string> {
	const env: Record<string, string> = {};
	const dotEnvPaths = [join(cwd, '.env'), join(cwd, '.env.local')];

	for (const dotEnvPath of dotEnvPaths) {
		if (existsSync(dotEnvPath)) {
			try {
				const content = readFileSync(dotEnvPath, 'utf-8');
				const parsed = parseDotEnv(content);
				Object.assign(env, parsed);
				debug(`Loaded env vars from ${dotEnvPath}`);
			} catch (error) {
				debug(`Failed to load .env from ${dotEnvPath}: ${(error as Error).message}`);
			}
		}
	}

	return env;
}

/**
 * Load environment variables from Claude settings files
 * Reads from ~/.claude/settings.json and .claude/settings.local.json
 */
function loadClaudeSettingsEnv(): Record<string, string> {
	const env: Record<string, string> = {};
	const home = homedir();

	const settingsPaths = [join(home, '.claude', 'settings.json'), join(process.cwd(), '.claude', 'settings.local.json')];

	for (const settingsPath of settingsPaths) {
		if (existsSync(settingsPath)) {
			try {
				const content = readFileSync(settingsPath, 'utf-8');
				const settings = JSON.parse(content);
				if (settings.env && typeof settings.env === 'object') {
					Object.assign(env, settings.env);
					debug(`Loaded env vars from ${settingsPath}`);
				}
			} catch (error) {
				debug(`Failed to load Claude settings from ${settingsPath}: ${(error as Error).message}`);
			}
		}
	}

	return env;
}

/**
 * Cached .env file vars
 */
let dotEnvCache: Record<string, string> = {};

/**
 * Config env vars loaded from mcp-cli config files
 */
let configEnvCache: Record<string, string> = {};

/**
 * Set .env file vars (called during config discovery)
 */
function setDotEnv(env: Record<string, string>): void {
	Object.assign(dotEnvCache, env);
	envCache = null;
}

/**
 * Set config env vars (called during config loading)
 */
export function setConfigEnv(env: Record<string, string>): void {
	Object.assign(configEnvCache, env);
	// Invalidate cache when config env changes
	envCache = null;
}

/**
 * Load all environment variables from various sources
 * Priority (later overrides earlier): .env < .env.local < claude settings < config.env
 * Note: process.env is checked first in getEnvValue, so it has highest priority
 */
function loadAllEnv(): Record<string, string> {
	if (envCache !== null) {
		return envCache;
	}

	envCache = {
		...dotEnvCache,
		...loadClaudeSettingsEnv(),
		...configEnvCache,
	};

	return envCache;
}

/**
 * Get environment variable value, checking all sources
 */
function getEnvValue(varName: string): string | undefined {
	// First check process.env (highest priority for system-level vars)
	if (process.env[varName] !== undefined) {
		return process.env[varName];
	}
	// Then check loaded env from files
	const allEnv = loadAllEnv();
	return allEnv[varName];
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
 * Find a file by searching upward from cwd to root
 * Stops at filesystem root or home directory
 * Unlike findUpToGit, this continues past .git directories
 */
function findUpSync(filename: string, cwd: string = process.cwd()): string | null {
	const home = homedir();
	let current = resolve(cwd);

	while (current) {
		const filePath = join(current, filename);
		if (existsSync(filePath)) {
			return filePath;
		}

		// Stop at home directory
		if (current === home) {
			return null;
		}

		const parent = dirname(current);
		if (parent === current) {
			// Reached filesystem root
			return null;
		}
		current = parent;
	}

	return null;
}

/**
 * Find a file by searching upward, stopping at .git boundary (project root)
 */
function _findUpToGitSync(filename: string, cwd: string = process.cwd()): string | null {
	const home = homedir();
	let current = resolve(cwd);

	while (current) {
		const filePath = join(current, filename);
		if (existsSync(filePath)) {
			return filePath;
		}

		// Stop at .git directory or home directory
		const gitPath = join(current, '.git');
		if (existsSync(gitPath) || current === home) {
			return null;
		}

		const parent = dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}

	return null;
}

/**
 * Parse codex TOML config file and extract MCP servers
 * Codex format: [mcp_servers.server_name] sections
 */
function parseCodexConfig(content: string): Record<string, ServerConfig> {
	const servers: Record<string, ServerConfig> = {};

	try {
		const parsed = parseToml(content) as Record<string, unknown>;
		const mcpServers = parsed.mcp_servers as Record<string, unknown> | undefined;

		if (!mcpServers || typeof mcpServers !== 'object') {
			return servers;
		}

		for (const [name, serverConfig] of Object.entries(mcpServers)) {
			if (!serverConfig || typeof serverConfig !== 'object') {
				continue;
			}

			const config = serverConfig as Record<string, unknown>;

			// Skip disabled servers
			if (config.enabled === false) {
				debug(`Skipping disabled codex server: ${name}`);
				continue;
			}

			if (config.command && typeof config.command === 'string') {
				// Stdio server
				const stdioConfig: ServerConfig = {
					command: config.command,
				};
				if (Array.isArray(config.args)) {
					stdioConfig.args = config.args.map(String);
				}
				if (config.env && typeof config.env === 'object') {
					stdioConfig.env = config.env as Record<string, string>;
				}
				if (config.cwd && typeof config.cwd === 'string') {
					stdioConfig.cwd = config.cwd;
				}
				servers[name] = stdioConfig;
			} else if (config.url && typeof config.url === 'string') {
				// HTTP server
				const httpConfig: ServerConfig = {
					url: config.url,
				};
				if (config.headers && typeof config.headers === 'object') {
					httpConfig.headers = config.headers as Record<string, string>;
				}
				servers[name] = httpConfig;
			}
		}
	} catch (error) {
		debug(`Failed to parse codex TOML: ${(error as Error).message}`);
	}

	return servers;
}

/**
 * Get config search paths for discovery (excludes mcp-cli configs which are handled separately)
 */
function getConfigSearchPaths(cwd: string = process.cwd()): ConfigLocation[] {
	const home = homedir();
	const paths: ConfigLocation[] = [];

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

	// Codex config - project level
	paths.push({
		path: resolve(cwd, '.codex', 'config.toml'),
		type: 'codex',
		label: './.codex/config.toml',
	});

	// User-level configs
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

	// Codex config - user level
	paths.push({
		path: join(home, '.codex', 'config.toml'),
		type: 'codex',
		label: '~/.codex/config.toml',
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
	// Handle codex TOML config
	if (location.type === 'codex') {
		const servers = parseCodexConfig(content);
		return { servers };
	}

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

	let schema: z.ZodTypeAny;
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

	const data = result.data as { mcpServers?: Record<string, ServerConfig> };
	return { servers: data.mcpServers ?? {} };
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
			const existingServer = servers.get(name)!;
			const existing = duplicateMap.get(name) ?? [existingServer.source];
			existing.push(source);
			duplicateMap.set(name, existing);
			debug(`Duplicate server: ${name} (keeping first from ${existingServer.source.label})`);
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
		filtered = new Map(Array.from(filtered.entries()).filter(([name]) => matchesPatterns(name, include)));
		debug(`Include filter applied: ${filtered.size} servers remaining`);
	}

	// Apply exclude filter (blacklist) - takes precedence
	if (exclude && exclude.length > 0) {
		filtered = new Map(Array.from(filtered.entries()).filter(([name]) => !matchesPatterns(name, exclude)));
		debug(`Exclude filter applied: ${filtered.size} servers remaining`);
	}

	return filtered;
}

/**
 * Discover and merge all MCP configurations
 * Returns merged config with deduplication and source tracking
 *
 * Loading order:
 * 1. MCP_CLI_CONFIG_INLINE env var (highest priority for all settings)
 * 2. Primary .mcp-cli.json found via findup (controls discoveryConfig)
 * 3. Local .mcp-cli.local.json (for local env overrides)
 * 4. Other mcp-cli configs
 * 5. Extends configs
 * 6. Other config sources (if discoveryConfig allows)
 */
export function discoverConfigs(cwd?: string, options?: { skipDiscovery?: boolean }): MergedConfig {
	const workingDir = cwd ?? process.cwd();
	const home = homedir();
	const servers = new Map<string, ServerWithSource>();
	const sources: ConfigSource[] = [];
	const duplicateMap = new Map<string, ConfigSource[]>();

	// Reset env caches for fresh discovery
	envCache = null;
	dotEnvCache = {};
	configEnvCache = {};

	// Pre-load .env files from working directory
	setDotEnv(loadDotEnvFiles(workingDir));

	// Track extends paths to load and config options
	let extendsToLoad: string[] = [];
	// discoveryConfig can be: true (all), false (none), or string[] (selective)
	// Using object wrapper to avoid TypeScript narrowing issues with closures
	const configState = { discoveryConfig: true as boolean | string[] };
	let includePatterns: string[] = [];
	let excludePatterns: string[] = [];
	const loadedPaths = new Set<string>();

	// Helper to update options from a config (first one wins for each option, env merges)
	const updateOptions = (configOptions?: McpCliConfig) => {
		if (!configOptions) return;
		if (configOptions.extends && extendsToLoad.length === 0) {
			extendsToLoad = [...configOptions.extends];
		}
		if (configOptions.discoveryConfig !== undefined && configState.discoveryConfig === true) {
			configState.discoveryConfig = configOptions.discoveryConfig;
			debug(`discoveryConfig set to: ${JSON.stringify(configState.discoveryConfig)}`);
		}
		if (configOptions.include && includePatterns.length === 0) {
			includePatterns = [...configOptions.include];
		}
		if (configOptions.exclude && excludePatterns.length === 0) {
			excludePatterns = [...configOptions.exclude];
		}
		// Merge env vars (later configs override earlier ones)
		if (configOptions.env) {
			setConfigEnv(configOptions.env);
			debug(`Loaded ${Object.keys(configOptions.env).length} env vars from config`);
		}
	};

	// 1. First, check MCP_CLI_CONFIG_INLINE env var for inline config (highest priority)
	const inlineConfig = parseInlineConfig();
	if (inlineConfig) {
		const source: ConfigSource = {
			path: 'MCP_CLI_CONFIG_INLINE',
			type: 'mcp',
			label: 'MCP_CLI_CONFIG_INLINE',
		};
		sources.push(source);
		debug('Found inline config: MCP_CLI_CONFIG_INLINE');
		// Load env first so it's available for server config substitution
		updateOptions(inlineConfig.options);
		addServersToConfig(servers, duplicateMap, inlineConfig.servers, source);
	}

	// 2. Find and load PRIMARY .mcp-cli.json via findup (controls discoveryConfig)
	// This is the key config that controls whether other configs are loaded
	const primaryConfigPath = findUpSync('.mcp-cli.json', workingDir);
	if (primaryConfigPath && !loadedPaths.has(primaryConfigPath)) {
		const location: ConfigLocation = {
			path: primaryConfigPath,
			type: 'mcp',
			label: primaryConfigPath.replace(home, '~'),
		};
		const result = loadConfigFile(location);
		if (result) {
			loadedPaths.add(primaryConfigPath);
			sources.push(result.source);
			debug(`Found primary config: ${location.label}`);
			// Load env first so it's available for server config substitution
			updateOptions(result.options);
			addServersToConfig(servers, duplicateMap, result.servers, result.source);
		}
	}

	// 3. Load local override configs (.mcp-cli.local.json) - for local env vars, etc.
	// These should NOT override discoveryConfig from the primary config
	const localOverridePaths = [resolve(workingDir, '.mcp-cli.local.json'), join(home, '.mcp-cli.local.json')];
	for (const localPath of localOverridePaths) {
		if (loadedPaths.has(localPath) || !existsSync(localPath)) continue;
		const location: ConfigLocation = {
			path: localPath,
			type: 'mcp',
			label: localPath.replace(home, '~').replace(workingDir, '.'),
		};
		const result = loadConfigFile(location);
		if (result) {
			loadedPaths.add(localPath);
			sources.push(result.source);
			debug(`Found local override config: ${location.label}`);
			// Only update extends/include/exclude/env, NOT discoveryConfig from local overrides
			if (result.options?.extends && extendsToLoad.length === 0) {
				extendsToLoad = [...result.options.extends];
			}
			if (result.options?.include && includePatterns.length === 0) {
				includePatterns = [...result.options.include];
			}
			if (result.options?.exclude && excludePatterns.length === 0) {
				excludePatterns = [...result.options.exclude];
			}
			// Load env before processing servers
			if (result.options?.env) {
				setConfigEnv(result.options.env);
				debug(`Loaded ${Object.keys(result.options.env).length} env vars from local config`);
			}
			addServersToConfig(servers, duplicateMap, result.servers, result.source);
		}
	}

	// 4. Load user-level mcp-cli config
	const userConfigPath = join(home, '.mcp-cli.json');
	if (!loadedPaths.has(userConfigPath) && existsSync(userConfigPath)) {
		const location: ConfigLocation = {
			path: userConfigPath,
			type: 'mcp',
			label: '~/.mcp-cli.json',
		};
		const result = loadConfigFile(location);
		if (result) {
			loadedPaths.add(userConfigPath);
			sources.push(result.source);
			debug(`Found user config: ${location.label}`);
			// Load env first so it's available for server config substitution
			updateOptions(result.options);
			addServersToConfig(servers, duplicateMap, result.servers, result.source);
		}
	}

	// 5. Load extends configs
	for (const extendPath of extendsToLoad) {
		const resolvedPath = resolve(workingDir, extendPath);
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

	// 6. If discoveryConfig is disabled or skipDiscovery is set, skip other configs
	const shouldDiscover = configState.discoveryConfig !== false && !options?.skipDiscovery;
	if (!shouldDiscover) {
		debug('Discovery disabled, skipping other configs');
	} else {
		// Load remaining configs based on discoveryConfig
		const searchPaths = getConfigSearchPaths(workingDir);
		const otherPaths = searchPaths.filter((p) => !p.label.includes('mcp-cli'));

		for (const location of otherPaths) {
			if (loadedPaths.has(location.path)) continue;

			// If discoveryConfig is an array, check if this source type is allowed
			if (Array.isArray(configState.discoveryConfig)) {
				const allowedTypes = configState.discoveryConfig.map((t) => t.toLowerCase());
				if (!allowedTypes.includes(location.type)) {
					debug(`Skipping ${location.label} (type ${location.type} not in discoveryConfig)`);
					continue;
				}
			}

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
	} catch (_error) {
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
	writeFileSync(configPath, `${content}\n`, 'utf-8');
}
