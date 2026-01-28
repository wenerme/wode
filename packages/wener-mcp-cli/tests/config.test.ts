import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverConfigs } from '../src/config';

describe('config env support', () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'mcp-cli-test-'));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('should substitute env vars from process.env', () => {
		process.env.TEST_API_KEY = 'secret-key-123';

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				mcpServers: {
					test: {
						url: 'https://api.example.com',
						headers: {
							Authorization: 'Bearer ${TEST_API_KEY}',
						},
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('test');

		expect(server).toBeDefined();
		expect((server?.config as any).headers?.Authorization).toBe('Bearer secret-key-123');

		delete process.env.TEST_API_KEY;
	});

	it('should load env vars from .env file', () => {
		writeFileSync(join(tempDir, '.env'), 'MY_DB_URL=postgres://localhost/test\n');

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				mcpServers: {
					db: {
						url: '${MY_DB_URL}',
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('db');

		expect(server).toBeDefined();
		expect((server?.config as any).url).toBe('postgres://localhost/test');
	});

	it('should load env vars from .env.local with higher priority', () => {
		writeFileSync(join(tempDir, '.env'), 'API_URL=http://prod.example.com\n');
		writeFileSync(join(tempDir, '.env.local'), 'API_URL=http://localhost:3000\n');

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				mcpServers: {
					api: {
						url: '${API_URL}',
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('api');

		expect(server).toBeDefined();
		expect((server?.config as any).url).toBe('http://localhost:3000');
	});

	it('should support env field in mcp-cli config', () => {
		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				env: {
					CONFIG_API_KEY: 'from-config',
				},
				mcpServers: {
					test: {
						url: 'https://api.example.com',
						headers: {
							'X-API-Key': '${CONFIG_API_KEY}',
						},
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('test');

		expect(server).toBeDefined();
		expect((server?.config as any).headers?.['X-API-Key']).toBe('from-config');
	});

	it('should handle quoted values in .env file', () => {
		writeFileSync(
			join(tempDir, '.env'),
			`
DOUBLE_QUOTED="hello world"
SINGLE_QUOTED='hello world'
UNQUOTED=hello
`,
		);

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				mcpServers: {
					test: {
						command: '${DOUBLE_QUOTED}',
						args: ['${SINGLE_QUOTED}', '${UNQUOTED}'],
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('test');

		expect(server).toBeDefined();
		expect((server?.config as any).command).toBe('hello world');
		expect((server?.config as any).args).toEqual(['hello world', 'hello']);
	});

	it('should skip comments and empty lines in .env file', () => {
		writeFileSync(
			join(tempDir, '.env'),
			`
# This is a comment
VALID_KEY=valid_value

# Another comment
ANOTHER_KEY=another_value
`,
		);

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				mcpServers: {
					test: {
						url: '${VALID_KEY}/${ANOTHER_KEY}',
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('test');

		expect(server).toBeDefined();
		expect((server?.config as any).url).toBe('valid_value/another_value');
	});

	it('process.env should have highest priority', () => {
		process.env.PRIORITY_TEST = 'from-process-env';
		writeFileSync(join(tempDir, '.env'), 'PRIORITY_TEST=from-dotenv\n');
		writeFileSync(join(tempDir, '.env.local'), 'PRIORITY_TEST=from-dotenv-local\n');

		writeFileSync(
			join(tempDir, '.mcp-cli.json'),
			JSON.stringify({
				env: {
					PRIORITY_TEST: 'from-config',
				},
				mcpServers: {
					test: {
						url: '${PRIORITY_TEST}',
					},
				},
			}),
		);

		const config = discoverConfigs(tempDir);
		const server = config.servers.get('test');

		expect(server).toBeDefined();
		expect((server?.config as any).url).toBe('from-process-env');

		delete process.env.PRIORITY_TEST;
	});
});
