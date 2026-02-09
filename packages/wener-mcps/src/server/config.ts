import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import consola from 'consola';
import YAML from 'yaml';
import { McpsConfigSchema, type McpsConfig, type ServerConfig } from './schema';

const log = consola.withTag('config');

/**
 * Load .env files into process.env
 * Priority: .env.local > .env (later files override earlier)
 */
export function loadEnvFiles(cwd: string = process.cwd()): void {
	const envFiles = ['.env', '.env.local'];

	for (const envFile of envFiles) {
		const filePath = resolve(cwd, envFile);
		if (!existsSync(filePath)) continue;

		try {
			const content = readFileSync(filePath, 'utf-8');
			const lines = content.split('\n');

			for (const line of lines) {
				const trimmed = line.trim();
				// Skip empty lines and comments
				if (!trimmed || trimmed.startsWith('#')) continue;

				const eqIndex = trimmed.indexOf('=');
				if (eqIndex === -1) continue;

				const key = trimmed.slice(0, eqIndex).trim();
				let value = trimmed.slice(eqIndex + 1).trim();

				// Remove quotes if present
				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1);
				}

				// Only set if not already set (don't override existing env vars)
				if (process.env[key] === undefined) {
					process.env[key] = value;
					log.debug(`Loaded env var ${key} from ${envFile}`);
				}
			}
			log.info(`Loaded env file: ${envFile}`);
		} catch (e) {
			log.warn(`Failed to load ${envFile}:`, e);
		}
	}
}

/**
 * Parse config file content based on format
 */
function parseConfigContent(content: string, format: 'yaml' | 'json'): unknown {
	if (format === 'yaml') {
		return YAML.parse(content);
	}
	return JSON.parse(content);
}

/**
 * Load and parse a single config file
 */
function loadConfigFile(filePath: string, format: 'yaml' | 'json'): { data: McpsConfig; path: string } | null {
	if (!existsSync(filePath)) {
		return null;
	}

	try {
		const content = readFileSync(filePath, 'utf-8');
		const parsed = parseConfigContent(content, format);
		const result = McpsConfigSchema.safeParse(parsed);

		if (result.success) {
			log.info(`Loaded config from ${filePath}`);
			return { data: result.data, path: filePath };
		} else {
			log.warn(`Invalid config in ${filePath}: ${result.error.message}`);
			return null;
		}
	} catch (e) {
		log.error(`Failed to load ${filePath}:`, e);
		return null;
	}
}

/**
 * Load config from multiple config files with priority merging
 *
 * Priority (highest to lowest):
 * 1. .mcps.local.yaml/.yml/.json (local overrides for mcps)
 * 2. .mcps.yaml/.yml/.json (base mcps config)
 * 3. .mcp.local.yaml/.yml/.json (local overrides for mcp)
 * 4. .mcp.yaml/.yml/.json (base mcp config)
 *
 * Within each group, YAML has higher priority than JSON.
 * All found configs are merged, with higher priority configs overriding lower ones.
 */
export function loadConfig(cwd: string = process.cwd()): McpsConfig {
	const config: McpsConfig = { servers: {} };

	// Load configs in reverse priority order (lowest first, so higher priority overwrites)
	// We want: base configs first, then local configs
	// And within each: json first, then yaml (yaml overwrites json)
	const loadOrder = [
		// Base MCP configs (lowest priority)
		{ path: '.mcp.json', format: 'json' as const },
		{ path: '.mcp.yml', format: 'yaml' as const },
		{ path: '.mcp.yaml', format: 'yaml' as const },
		// Local MCP configs
		{ path: '.mcp.local.json', format: 'json' as const },
		{ path: '.mcp.local.yml', format: 'yaml' as const },
		{ path: '.mcp.local.yaml', format: 'yaml' as const },
		// Base MCPS configs
		{ path: '.mcps.json', format: 'json' as const },
		{ path: '.mcps.yml', format: 'yaml' as const },
		{ path: '.mcps.yaml', format: 'yaml' as const },
		// Local MCPS configs (highest priority)
		{ path: '.mcps.local.json', format: 'json' as const },
		{ path: '.mcps.local.yml', format: 'yaml' as const },
		{ path: '.mcps.local.yaml', format: 'yaml' as const },
	];

	for (const { path: configPath, format } of loadOrder) {
		const fullPath = resolve(cwd, configPath);
		const result = loadConfigFile(fullPath, format);
		if (result) {
			// Merge servers, later configs take precedence
			Object.assign(config.servers, result.data.servers);

			// Merge models config (array format - later configs append/override by name)
			if (result.data.models && result.data.models.length > 0) {
				if (!config.models) {
					config.models = [];
				}
				// Merge by name - later config overrides earlier ones with same name
				for (const model of result.data.models) {
					const existingIndex = config.models.findIndex((m) => m.name === model.name);
					if (existingIndex >= 0) {
						config.models[existingIndex] = model;
					} else {
						config.models.push(model);
					}
				}
			}
		}
	}

	// Filter disabled servers
	for (const [name, serverConfig] of Object.entries(config.servers)) {
		if (serverConfig.disabled) {
			log.debug(`Server ${name} is disabled`);
			delete config.servers[name];
		}
	}

	return config;
}

/**
 * Substitute environment variables in config values
 * Supports ${VAR_NAME} syntax
 */
export function substituteEnvVars(config: McpsConfig): McpsConfig {
	const result: McpsConfig = { servers: {} };

	for (const [name, serverConfig] of Object.entries(config.servers)) {
		result.servers[name] = substituteEnvVarsInObject(serverConfig) as ServerConfig;
	}

	// Process models config
	if (config.models) {
		result.models = substituteEnvVarsInObject(config.models);
	}

	return result;
}

function substituteEnvVarsInObject<T>(obj: T): T {
	if (typeof obj === 'string') {
		return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
			return process.env[varName] ?? '';
		}) as T;
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
