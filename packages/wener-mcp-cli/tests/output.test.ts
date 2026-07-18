/**
 * Unit tests for output formatting
 */

import { beforeAll, describe, expect, test } from 'vite-plus/test';
import {
	formatConfigSources,
	formatError,
	formatJson,
	formatSearchResults,
	formatServerList,
	formatToolResult,
	formatToolSchema,
} from '../src/output';

// Disable colors for testing
beforeAll(() => {
	process.env.NO_COLOR = '1';
});

describe('output', () => {
	describe('formatServerList', () => {
		test('formats servers with tools', () => {
			const servers = [
				{
					name: 'github',
					tools: [
						{ name: 'search', description: 'Search repos', inputSchema: {} },
						{ name: 'clone', description: 'Clone repo', inputSchema: {} },
					],
				},
				{
					name: 'filesystem',
					tools: [{ name: 'read_file', description: 'Read file', inputSchema: {} }],
				},
			];

			const output = formatServerList(servers, false);
			expect(output).toContain('github');
			expect(output).toContain('search');
			expect(output).toContain('clone');
			expect(output).toContain('filesystem');
			expect(output).toContain('read_file');
		});

		test('includes descriptions when requested', () => {
			const servers = [
				{
					name: 'test',
					tools: [{ name: 'tool1', description: 'A test tool', inputSchema: {} }],
				},
			];

			const withDesc = formatServerList(servers, true);
			expect(withDesc).toContain('A test tool');

			const withoutDesc = formatServerList(servers, false);
			expect(withoutDesc).not.toContain('A test tool');
		});

		test('includes source when requested', () => {
			const servers = [
				{
					name: 'test',
					tools: [{ name: 'tool1', inputSchema: {} }],
					source: { path: '/path/to/config', type: 'cursor' as const, label: '~/.cursor/mcp.json' },
				},
			];

			const withSource = formatServerList(servers, false, true);
			expect(withSource).toContain('~/.cursor/mcp.json');

			const withoutSource = formatServerList(servers, false, false);
			expect(withoutSource).not.toContain('~/.cursor/mcp.json');
		});
	});

	describe('formatSearchResults', () => {
		test('formats search results', () => {
			const results = [
				{
					server: 'github',
					tool: { name: 'search', description: 'Search', inputSchema: {} },
				},
				{
					server: 'fs',
					tool: { name: 'find', description: 'Find files', inputSchema: {} },
				},
			];

			const output = formatSearchResults(results, false);
			expect(output).toContain('github');
			expect(output).toContain('search');
			expect(output).toContain('fs');
			expect(output).toContain('find');
		});

		test('includes descriptions when requested', () => {
			const results = [
				{
					server: 'test',
					tool: {
						name: 'tool',
						description: 'Tool description',
						inputSchema: {},
					},
				},
			];

			const withDesc = formatSearchResults(results, true);
			expect(withDesc).toContain('Tool description');

			const withoutDesc = formatSearchResults(results, false);
			expect(withoutDesc).not.toContain('Tool description');
		});
	});

	describe('formatToolSchema', () => {
		test('formats tool with schema', () => {
			const tool = {
				name: 'search_repos',
				description: 'Search GitHub repositories',
				inputSchema: {
					type: 'object',
					properties: {
						query: { type: 'string' },
					},
					required: ['query'],
				},
			};

			const output = formatToolSchema('github', tool);
			expect(output).toContain('search_repos');
			expect(output).toContain('github');
			expect(output).toContain('Search GitHub');
			expect(output).toContain('query');
		});
	});

	describe('formatToolResult', () => {
		test('extracts text content from MCP result', () => {
			const result = {
				content: [{ type: 'text', text: 'Hello, world!' }],
			};

			const output = formatToolResult(result);
			expect(output).toBe('Hello, world!');
		});

		test('handles multiple text parts', () => {
			const result = {
				content: [
					{ type: 'text', text: 'Part 1' },
					{ type: 'text', text: 'Part 2' },
				],
			};

			const output = formatToolResult(result);
			expect(output).toContain('Part 1');
			expect(output).toContain('Part 2');
		});

		test('falls back to JSON for non-text content', () => {
			const result = { data: [1, 2, 3] };
			const output = formatToolResult(result);
			expect(output).toContain('"data"');
			expect(output).toContain('1');
			expect(output).toContain('2');
			expect(output).toContain('3');
		});
	});

	describe('formatJson', () => {
		test('outputs valid JSON', () => {
			const data = { name: 'test', values: [1, 2, 3] };
			const output = formatJson(data);
			expect(JSON.parse(output)).toEqual(data);
		});
	});

	describe('formatError', () => {
		test('formats error message', () => {
			const output = formatError('Something went wrong');
			expect(output).toContain('Something went wrong');
		});
	});

	describe('formatConfigSources', () => {
		test('formats sources list', () => {
			const sources = [
				{ path: '/path/to/mcp.json', type: 'mcp' as const, label: './mcp.json' },
				{ path: '/home/.cursor/mcp.json', type: 'cursor' as const, label: '~/.cursor/mcp.json' },
			];

			const output = formatConfigSources(sources, []);
			expect(output).toContain('Config Sources:');
			expect(output).toContain('./mcp.json');
			expect(output).toContain('~/.cursor/mcp.json');
		});

		test('formats duplicates', () => {
			const sources = [
				{ path: '/a', type: 'mcp' as const, label: 'a' },
				{ path: '/b', type: 'cursor' as const, label: 'b' },
			];
			const duplicates = [
				{
					name: 'myserver',
					sources: [sources[0], sources[1]],
				},
			];

			const output = formatConfigSources(sources, duplicates);
			expect(output).toContain('Duplicates');
			expect(output).toContain('myserver');
		});
	});
});
