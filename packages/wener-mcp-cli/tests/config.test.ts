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
});
