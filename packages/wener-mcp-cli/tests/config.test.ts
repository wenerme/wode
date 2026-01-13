/**
 * Unit tests for config module
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { discoverConfigs, getServerConfig, listServerNames, loadConfig, loadConfigFromPath } from '../src/config';

describe('config', () => {
	let tempDir: string;
	let originalStrictEnv: string | undefined;

	beforeAll(() => {
		// Disable strict env mode for tests to avoid errors from global config files
		originalStrictEnv = process.env.MCP_STRICT_ENV;
		process.env.MCP_STRICT_ENV = 'false';
	});

	afterAll(() => {
		if (originalStrictEnv === undefined) {
			delete process.env.MCP_STRICT_ENV;
		} else {
			process.env.MCP_STRICT_ENV = originalStrictEnv;
		}
	});

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'mcp-cli-test-'));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	describe('loadConfigFromPath', () => {
		test('loads valid config from explicit path', () => {
			const configPath = join(tempDir, 'mcp_servers.json');
			writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						test: { command: 'echo', args: ['hello'] },
					},
				}),
			);

			// Wait for file to be written
			return new Promise<void>((resolve) => {
				setTimeout(async () => {
					const config = loadConfigFromPath(configPath);
					expect(config.servers.has('test')).toBe(true);
					const server = config.servers.get('test')!;
					expect((server.config as any).command).toBe('echo');
					resolve();
				}, 100);
			});
		});

		test('throws on missing config file', () => {
			const configPath = join(tempDir, 'nonexistent.json');
			expect(() => loadConfigFromPath(configPath)).toThrow('not found');
		});
	});

	describe('discoverConfigs', () => {
		test('discovers config from .mcp.json', async () => {
			// Claude standard: .mcp.json (hidden file)
			const configPath = join(tempDir, '.mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						myserver: { command: 'test-cmd' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('myserver')).toBe(true);
		});

		test('discovers config from .cursor/mcp.json', async () => {
			const cursorDir = join(tempDir, '.cursor');
			await mkdir(cursorDir, { recursive: true });
			const configPath = join(cursorDir, 'mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						cursorserver: { command: 'cursor-cmd' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('cursorserver')).toBe(true);
			const server = config.servers.get('cursorserver')!;
			expect(server.source.type).toBe('cursor');
		});

		test('discovers config from .gemini/mcp_config.json', async () => {
			const geminiDir = join(tempDir, '.gemini');
			await mkdir(geminiDir, { recursive: true });
			const configPath = join(geminiDir, 'mcp_config.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						geminiserver: { serverUrl: 'https://example.com/mcp' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('geminiserver')).toBe(true);
			const server = config.servers.get('geminiserver')!;
			expect(server.source.type).toBe('gemini');
			// Check that serverUrl is normalized to url
			expect((server.config as any).url).toBe('https://example.com/mcp');
		});

		test('tracks duplicate servers', async () => {
			// Create two configs with same server name
			// .mcp.json is checked first (higher priority)
			const mcpPath = join(tempDir, '.mcp.json');
			await writeFile(
				mcpPath,
				JSON.stringify({
					mcpServers: {
						duplicate: { command: 'first' },
					},
				}),
			);

			const cursorDir = join(tempDir, '.cursor');
			await mkdir(cursorDir, { recursive: true });
			const cursorPath = join(cursorDir, 'mcp.json');
			await writeFile(
				cursorPath,
				JSON.stringify({
					mcpServers: {
						duplicate: { command: 'second' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);

			// First occurrence wins (.mcp.json is checked before .cursor/mcp.json)
			const server = config.servers.get('duplicate')!;
			expect((server.config as any).command).toBe('first');

			// Duplicate is tracked - there's at least 1 for our test server
			const ourDuplicate = config.duplicates.find((d) => d.name === 'duplicate');
			expect(ourDuplicate).toBeDefined();
			expect(ourDuplicate!.sources.length).toBe(2);
		});

		test('returns result even when project has no configs', () => {
			// Note: discoverConfigs also searches user-level configs like ~/.cursor/mcp.json
			// So the result may not be empty even for an empty temp directory
			const config = discoverConfigs(tempDir);
			// Just verify the function runs without error
			expect(config).toBeDefined();
			expect(config.servers).toBeDefined();
		});
	});

	describe('getServerConfig', () => {
		test('returns server config by name', async () => {
			const configPath = join(tempDir, '.mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						server1: { command: 'cmd1' },
						server2: { command: 'cmd2' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);
			const server = getServerConfig(config, 'server1');
			expect((server.config as any).command).toBe('cmd1');
		});

		test('throws on unknown server', async () => {
			const configPath = join(tempDir, '.mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: { known: { command: 'cmd' } },
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(() => getServerConfig(config, 'unknown')).toThrow('not found');
		});
	});

	describe('listServerNames', () => {
		test('returns sorted server names', async () => {
			const configPath = join(tempDir, '.mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						beta: { command: 'b' },
						alpha: { command: 'a' },
						gamma: { url: 'https://example.com' },
					},
				}),
			);

			const config = discoverConfigs(tempDir);
			const names = listServerNames(config);
			// Verify our test servers are included (may have others from global configs)
			expect(names).toContain('alpha');
			expect(names).toContain('beta');
			expect(names).toContain('gamma');
			// Verify they are sorted
			const ourNames = names.filter((n) => ['alpha', 'beta', 'gamma'].includes(n));
			expect(ourNames).toEqual(['alpha', 'beta', 'gamma']);
		});
	});

	describe('MCP_CLI_CONFIG_INLINE inline config', () => {
		let originalEnv: string | undefined;

		beforeEach(() => {
			originalEnv = process.env.MCP_CLI_CONFIG_INLINE;
		});

		afterEach(() => {
			if (originalEnv === undefined) {
				delete process.env.MCP_CLI_CONFIG_INLINE;
			} else {
				process.env.MCP_CLI_CONFIG_INLINE = originalEnv;
			}
		});

		test('loads inline config from MCP_CLI_CONFIG_INLINE env var', () => {
			process.env.MCP_CLI_CONFIG_INLINE = JSON.stringify({
				mcpServers: {
					inlineserver: { command: 'inline-cmd' },
				},
			});

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('inlineserver')).toBe(true);
			const server = config.servers.get('inlineserver')!;
			expect((server.config as any).command).toBe('inline-cmd');
			expect(server.source.label).toBe('MCP_CLI_CONFIG_INLINE');
		});

		test('inline config has highest priority', async () => {
			// Create file config
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						testserver: { command: 'file-cmd' },
					},
				}),
			);

			// Set inline config with same server name
			process.env.MCP_CLI_CONFIG_INLINE = JSON.stringify({
				mcpServers: {
					testserver: { command: 'inline-cmd' },
				},
			});

			const config = discoverConfigs(tempDir);
			const server = config.servers.get('testserver')!;
			// Inline config should win
			expect((server.config as any).command).toBe('inline-cmd');
		});

		test('inline config can disable discovery', async () => {
			// Create another config that would be discovered
			const configPath = join(tempDir, '.mcp.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						discoveredserver: { command: 'discovered-cmd' },
					},
				}),
			);

			// Set inline config with discoveryConfig: false
			process.env.MCP_CLI_CONFIG_INLINE = JSON.stringify({
				mcpServers: {
					inlineserver: { command: 'inline-cmd' },
				},
				discoveryConfig: false,
			});

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('inlineserver')).toBe(true);
			expect(config.servers.has('discoveredserver')).toBe(false);
		});
	});

	describe('extends config', () => {
		test('loads servers from extends paths', async () => {
			// Create extended config
			const extendedPath = join(tempDir, 'extended.json');
			await writeFile(
				extendedPath,
				JSON.stringify({
					mcpServers: {
						extendedserver: { command: 'extended-cmd' },
					},
				}),
			);

			// Create main config with extends
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						mainserver: { command: 'main-cmd' },
					},
					extends: ['extended.json'],
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('mainserver')).toBe(true);
			expect(config.servers.has('extendedserver')).toBe(true);
		});

		test('main config servers override extended servers', async () => {
			// Create extended config
			const extendedPath = join(tempDir, 'extended.json');
			await writeFile(
				extendedPath,
				JSON.stringify({
					mcpServers: {
						sameserver: { command: 'extended-cmd' },
					},
				}),
			);

			// Create main config with same server name
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						sameserver: { command: 'main-cmd' },
					},
					extends: ['extended.json'],
				}),
			);

			const config = discoverConfigs(tempDir);
			const server = config.servers.get('sameserver')!;
			// Main config should win
			expect((server.config as any).command).toBe('main-cmd');
		});
	});

	describe('discoveryConfig option', () => {
		test('discoveryConfig: false disables auto-discovery', async () => {
			// Create a .mcp.json that would normally be discovered
			const mcpPath = join(tempDir, '.mcp.json');
			await writeFile(
				mcpPath,
				JSON.stringify({
					mcpServers: {
						discoveredserver: { command: 'discovered-cmd' },
					},
				}),
			);

			// Create .mcp-cli.json with discoveryConfig: false
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						cliserver: { command: 'cli-cmd' },
					},
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('cliserver')).toBe(true);
			expect(config.servers.has('discoveredserver')).toBe(false);
		});

		test('discoveryConfig defaults to true', async () => {
			// Create both configs
			const mcpPath = join(tempDir, '.mcp.json');
			await writeFile(
				mcpPath,
				JSON.stringify({
					mcpServers: {
						discoveredserver: { command: 'discovered-cmd' },
					},
				}),
			);

			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						cliserver: { command: 'cli-cmd' },
					},
					// No discoveryConfig set
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('cliserver')).toBe(true);
			expect(config.servers.has('discoveredserver')).toBe(true);
		});
	});

	describe('include/exclude filters', () => {
		test('include filters servers by glob pattern', async () => {
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						'dev-mysql': { command: 'mysql' },
						'dev-postgres': { command: 'postgres' },
						'prod-mysql': { command: 'mysql' },
						'test-server': { command: 'test' },
					},
					include: ['dev-*'],
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('dev-mysql')).toBe(true);
			expect(config.servers.has('dev-postgres')).toBe(true);
			expect(config.servers.has('prod-mysql')).toBe(false);
			expect(config.servers.has('test-server')).toBe(false);
		});

		test('exclude filters servers by glob pattern', async () => {
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						'dev-mysql': { command: 'mysql' },
						'dev-postgres': { command: 'postgres' },
						'prod-mysql': { command: 'mysql' },
						'test-server': { command: 'test' },
					},
					exclude: ['*-mysql'],
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('dev-mysql')).toBe(false);
			expect(config.servers.has('prod-mysql')).toBe(false);
			expect(config.servers.has('dev-postgres')).toBe(true);
			expect(config.servers.has('test-server')).toBe(true);
		});

		test('exclude takes precedence over include', async () => {
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						'dev-mysql': { command: 'mysql' },
						'dev-postgres': { command: 'postgres' },
						'dev-redis': { command: 'redis' },
					},
					include: ['dev-*'],
					exclude: ['*-mysql'],
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			// dev-mysql matches include but also matches exclude, so excluded
			expect(config.servers.has('dev-mysql')).toBe(false);
			expect(config.servers.has('dev-postgres')).toBe(true);
			expect(config.servers.has('dev-redis')).toBe(true);
		});

		test('supports multiple patterns', async () => {
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						'dev-mysql': { command: 'mysql' },
						'prod-postgres': { command: 'postgres' },
						'test-redis': { command: 'redis' },
						'staging-api': { command: 'api' },
					},
					include: ['dev-*', 'prod-*'],
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('dev-mysql')).toBe(true);
			expect(config.servers.has('prod-postgres')).toBe(true);
			expect(config.servers.has('test-redis')).toBe(false);
			expect(config.servers.has('staging-api')).toBe(false);
		});

		test('supports case-insensitive matching', async () => {
			const configPath = join(tempDir, '.mcp-cli.json');
			await writeFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						'DEV-MySQL': { command: 'mysql' },
						'dev-postgres': { command: 'postgres' },
					},
					include: ['dev-*'],
					discoveryConfig: false,
				}),
			);

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('DEV-MySQL')).toBe(true);
			expect(config.servers.has('dev-postgres')).toBe(true);
		});

		test('inline config include/exclude works', () => {
			process.env.MCP_CLI_CONFIG_INLINE = JSON.stringify({
				mcpServers: {
					'dev-mysql': { command: 'mysql' },
					'prod-mysql': { command: 'mysql' },
				},
				include: ['dev-*'],
				discoveryConfig: false,
			});

			const config = discoverConfigs(tempDir);
			expect(config.servers.has('dev-mysql')).toBe(true);
			expect(config.servers.has('prod-mysql')).toBe(false);

			delete process.env.MCP_CLI_CONFIG_INLINE;
		});
	});
});
