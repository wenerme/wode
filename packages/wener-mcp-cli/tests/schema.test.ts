/**
 * Unit tests for schema module
 */

import { describe, expect, test } from 'vite-plus/test';
import {
	ClaudeConfigSchema,
	CursorConfigSchema,
	GeminiConfigSchema,
	getServerUrl,
	HttpServerConfigSchema,
	isHttpServer,
	isStdioServer,
	McpServersConfigSchema,
	normalizeHttpConfig,
	StdioServerConfigSchema,
} from '../src/schema';

describe('schema', () => {
	describe('StdioServerConfigSchema', () => {
		test('validates valid stdio config', () => {
			const config = { command: 'npx', args: ['-y', 'some-server'] };
			const result = StdioServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('validates stdio config with env and cwd', () => {
			const config = {
				command: 'node',
				args: ['server.js'],
				env: { API_KEY: 'secret' },
				cwd: '/path/to/dir',
			};
			const result = StdioServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('rejects config without command', () => {
			const config = { args: ['test'] };
			const result = StdioServerConfigSchema.safeParse(config);
			expect(result.success).toBe(false);
		});
	});

	describe('HttpServerConfigSchema', () => {
		test('validates config with url', () => {
			const config = { url: 'https://example.com/mcp' };
			const result = HttpServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('validates config with serverUrl (Gemini format)', () => {
			const config = { serverUrl: 'https://example.com/mcp' };
			const result = HttpServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('validates config with headers', () => {
			const config = {
				url: 'https://example.com',
				headers: { Authorization: 'Bearer token' },
			};
			const result = HttpServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('rejects config without url or serverUrl', () => {
			const config = { headers: {} };
			const result = HttpServerConfigSchema.safeParse(config);
			expect(result.success).toBe(false);
		});
	});

	describe('Config schema variants', () => {
		test('ClaudeConfigSchema parses valid config', () => {
			const config = {
				mcpServers: {
					github: { command: 'npx', args: ['-y', 'github-mcp'] },
				},
			};
			const result = ClaudeConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('CursorConfigSchema parses valid config', () => {
			const config = {
				mcpServers: {
					filesystem: { command: 'node', args: ['fs-server.js'] },
				},
			};
			const result = CursorConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('GeminiConfigSchema parses config with serverUrl', () => {
			const config = {
				mcpServers: {
					deepwiki: { serverUrl: 'https://mcp.deepwiki.com/mcp' },
				},
			};
			const result = GeminiConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('McpServersConfigSchema handles empty mcpServers', () => {
			const config = { mcpServers: {} };
			const result = McpServersConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test('McpServersConfigSchema handles undefined mcpServers', () => {
			const config = {};
			const result = McpServersConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});
	});

	describe('type guards', () => {
		test('isHttpServer identifies HTTP config with url', () => {
			expect(isHttpServer({ url: 'https://example.com' })).toBe(true);
			expect(isHttpServer({ serverUrl: 'https://example.com' })).toBe(true);
			expect(isHttpServer({ command: 'echo' })).toBe(false);
		});

		test('isStdioServer identifies stdio config', () => {
			expect(isStdioServer({ command: 'echo' })).toBe(true);
			expect(isStdioServer({ url: 'https://example.com' })).toBe(false);
		});
	});

	describe('getServerUrl', () => {
		test('returns url when present', () => {
			expect(getServerUrl({ url: 'https://example.com' })).toBe('https://example.com');
		});

		test('returns serverUrl when url is not present', () => {
			expect(getServerUrl({ serverUrl: 'https://gemini.example.com' })).toBe('https://gemini.example.com');
		});

		test('prefers url over serverUrl', () => {
			expect(getServerUrl({ url: 'https://url.com', serverUrl: 'https://serverurl.com' })).toBe('https://url.com');
		});
	});

	describe('normalizeHttpConfig', () => {
		test('adds url from serverUrl', () => {
			const config = { serverUrl: 'https://example.com' };
			const normalized = normalizeHttpConfig(config);
			expect(normalized.url).toBe('https://example.com');
		});

		test('preserves existing url', () => {
			const config = { url: 'https://existing.com', serverUrl: 'https://other.com' };
			const normalized = normalizeHttpConfig(config);
			expect(normalized.url).toBe('https://existing.com');
		});

		test('preserves headers and other fields', () => {
			const config = {
				serverUrl: 'https://example.com',
				headers: { Authorization: 'Bearer token' },
				timeout: 5000,
			};
			const normalized = normalizeHttpConfig(config);
			expect(normalized.headers).toEqual({ Authorization: 'Bearer token' });
			expect(normalized.timeout).toBe(5000);
		});
	});
});
