import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWocliCli, type WocliMcpConnection } from '../createWocliCli';

function output() {
	const stdout: string[] = [];
	const stderr: string[] = [];
	return {
		stdout,
		stderr,
		io: {
			signal: new AbortController().signal,
			stdout: (text: string) => stdout.push(text),
			stderr: (text: string) => stderr.push(text),
		},
	};
}

function fixtureConnection(): WocliMcpConnection {
	return {
		serverInfo: { name: 'fixture', version: '1' },
		async listTools() {
			return [{ name: 'echo', description: 'Echo', inputSchema: { type: 'object' } }];
		},
		async listResources() {
			return [{ uri: 'fixture://hello', name: 'hello', mimeType: 'text/plain' }];
		},
		async readResource(uri) {
			return { contents: [{ uri, text: 'hello' }] };
		},
		async callTool(_name, args) {
			return { content: [{ type: 'text', text: JSON.stringify(args) }] };
		},
		close: vi.fn(async () => undefined),
	};
}

describe('MCP commands', () => {
	it('lists and calls an injected server without connecting for catalog/help', async () => {
		const connect = vi.fn(async () => fixtureConnection());
		const cli = createWocliCli({
			config: createMemoryCliConfigStore({
				mcpServers: {
					demo: {
						transport: 'stdio',
						command: 'fixture',
						args: ['--token', 'fixture-secret'],
						env: { TOKEN: 'fixture-secret' },
					},
				},
			}),
			mcp: { connect },
		});
		const help = output();
		await cli.executeLine('mcp --help', help.io);
		expect(connect).not.toHaveBeenCalled();
		const listed = output();
		await cli.executeLine('mcp servers --json', listed.io);
		expect(connect).not.toHaveBeenCalled();
		expect(listed.stdout.join('')).toContain('demo');
		expect(listed.stdout.join('')).not.toContain('fixture-secret');
		const tools = output();
		await cli.executeLine('mcp tools demo --json', tools.io);
		expect(connect).toHaveBeenCalledTimes(1);
		expect(JSON.parse(tools.stdout[0])).toMatchObject([{ server: 'demo', name: 'echo' }]);
		const called = output();
		await cli.execute(['mcp', 'call', 'demo', 'echo', '{"value":1}'], called.io);
		expect(called.stdout.join('')).toContain('"value":1');
		const read = output();
		await cli.executeLine('mcp read demo fixture://hello --json', read.io);
		expect(JSON.parse(read.stdout[0]).contents[0].text).toBe('hello');
	});

	it('redacts HTTP credentials in URL fragments as well as query parameters', async () => {
		const cli = createWocliCli({
			config: createMemoryCliConfigStore({
				mcpServers: {
					remote: { transport: 'http', url: 'https://example.com/mcp?token=query-secret#access_token=fragment-secret' },
				},
			}),
			mcp: { connect: vi.fn(async () => fixtureConnection()) },
		});
		const listed = output();
		await cli.executeLine('mcp servers --json', listed.io);
		expect(listed.stdout.join('')).not.toContain('query-secret');
		expect(listed.stdout.join('')).not.toContain('fragment-secret');
	});
});
