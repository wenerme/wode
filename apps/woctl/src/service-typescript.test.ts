import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createMemoryCliConfigStore } from 'common/context';
import { expect, it } from 'vitest';
import { createCli } from './createCli';

it('generates a standalone Apollo service declaration that typechecks', async () => {
	const cli = createCli({ config: createMemoryCliConfigStore({}) });
	const lines: string[] = [];
	await cli.executeLine('svc type apollo --typescript', {
		signal: new AbortController().signal, stdout: (text) => lines.push(text),
	});
	const source = lines.join('\n');
	expect(source).toContain('publishNamespaceRelease(');
	expect(source).not.toContain('string<uri>');
	await assertTypechecks(source);
});

it('generates readable, standalone MCP tool declarations for one tool or an entire server', async () => {
	const tools = [{
		name: 'search-docs', description: 'Search documents. */ Still a comment.',
		inputSchema: {
			type: 'object', additionalProperties: false, required: ['query'],
			properties: { query: { type: 'string', description: 'Search query' }, limit: { type: 'integer' } },
		},
		outputSchema: { type: 'object', additionalProperties: false, properties: { count: { type: 'integer' } } },
	}, { name: 'ping', inputSchema: { type: 'object' } }];
	let closed = 0;
	const cli = createCli({
		config: createMemoryCliConfigStore({ mcpServers: { demo: { transport: 'stdio', command: 'fixture' } } }),
		mcp: { connect: async () => ({
			listTools: async () => tools, listResources: async () => [], readResource: async () => ({}),
			callTool: async () => ({}), close: async () => { closed++; },
		}) },
	});
	for (const command of [
		'mcp info demo --typescript',
		'mcp info demo search-docs --typescript',
		'mcp tools demo search-docs --typescript',
	]) {
		const lines: string[] = [];
		await cli.executeLine(command, { signal: new AbortController().signal, stdout: (text) => lines.push(text) });
		const source = lines.join('\n');
		expect(source).toContain('export interface DemoTools');
		expect(source).toContain('"search-docs"(input:');
		expect(source).toContain('query: string;');
		expect(source).toContain('limit?: number;');
		expect(source).toContain('count?: number;');
		expect(source).toContain('/** Search query */');
		expect(source).toContain('Search documents. * / Still a comment.');
		if (command === 'mcp info demo --typescript') expect(source).toContain('Promise<unknown>');
		else expect(source).not.toContain('ping(');
		await assertTypechecks(source);
	}
	expect(closed).toBe(3);
});

it.each([
	['wener-site', 'WenerSiteTools'],
	['123-site', 'Mcp123SiteTools'],
	['...', 'McpTools'],
])('names the MCP interface after server %s', async (server, name) => {
	const cli = createCli({
		config: createMemoryCliConfigStore({}),
		mcp: { connect: async () => ({
			listTools: async () => [{ name: 'search', inputSchema: { type: 'object' } }],
			listResources: async () => [], readResource: async () => ({}), callTool: async () => ({}),
			close: async () => undefined,
		}) },
	});
	for (const command of [`info ${server} search`, `info ${server}`, `tools ${server}`]) {
		const lines: string[] = [];
		await cli.executeLine(`mcp --url https://example.test/mcp --name=${server} ${command} --typescript`, {
			signal: new AbortController().signal, stdout: (text) => lines.push(text),
		});
		const source = lines.join('\n');
		expect(source).toContain(`export interface ${name} {`);
		await assertTypechecks(source);
	}
});

it('discovers Redis method result types from output schemas without creating a driver', async () => {
	let driverCalls = 0;
	const cli = createCli({
		config: createMemoryCliConfigStore({}),
		redisDriver: async () => { driverCalls++; throw new Error('Discovery must remain offline'); },
	});
	const lines: string[] = [];
	await cli.executeLine('service type redis --typescript', {
		signal: new AbortController().signal, stdout: (text) => lines.push(text),
	});
	const source = lines.join('\n');
	expect(source).toContain('rangeStream(');
	expect(source).toContain('ttlSeconds: number;');
	expect(source).toContain('success: boolean;');
	expect(source).not.toContain('Promise<unknown>');
	expect(driverCalls).toBe(0);
	await assertTypechecks(source);
});

async function assertTypechecks(source: string) {
	const directory = await mkdtemp(join(tmpdir(), 'woctl-declaration-'));
	try {
		const filename = join(directory, 'contracts.ts');
		await writeFile(filename, source);
		const compiler = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));
		const result = await promisify(execFile)(process.execPath, [compiler, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', filename], { timeout: 30000 })
			.catch((error: { stdout?: string; stderr?: string }) => { throw new Error(`${error.stdout ?? ''}${error.stderr ?? ''}`); });
		expect(result.stdout).toBe('');
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
