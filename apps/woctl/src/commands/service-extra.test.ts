import type { ServiceProvider, ServiceRuntimeClient } from '@wener/common/service';
import { createMemoryCliConfigStore, parseCliConfig } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { APP_NAME } from '../const';
import { createWocliWebCli } from '../web';

function output() {
	const lines: string[] = [];
	return {
		lines,
		io: {
			signal: new AbortController().signal,
			columns: 400,
			stdout: (text: string) => {
				lines.push(text);
			},
		},
	};
}
function serviceConfig() {
	return parseCliConfig({ services: [{ name: 'system', type: 'system' }], defaults: { system: 'system' } });
}

describe('service discovery and defaults', () => {
	it('uses the shared output selection for renderer DSL and explicit example projections', async () => {
		const cli = createWocliWebCli({ config: createMemoryCliConfigStore(serviceConfig()) });
		const { io, lines } = output();
		await cli.executeLine("service inspect system --format 'json(name)'", io);
		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines.pop() ?? '')).toEqual([{ name: 'info' }, { name: 'echo' }]);
		await cli.executeLine('service inspect system --format example', io);
		expect(lines).toHaveLength(1);
		expect(lines[0]).toContain(`${APP_NAME} service call`);
		expect(lines[0]).not.toContain('Call examples:');
	});
	it('prints complete examples at 80 columns and preserves their selected context', async () => {
		const initial = serviceConfig();
		initial.contexts.other = { services: { gateway: { provider: 'system', readOnly: true } }, defaults: {} };
		const cli = createWocliWebCli({ config: createMemoryCliConfigStore(initial) });
		const { io, lines } = output();
		await cli.executeLine('service inspect gateway --context other', { ...io, columns: 80 });
		const example = lines
			.join('\n')
			.split('\n')
			.find((line) => line.startsWith(`${APP_NAME} service call`) && line.includes("'echo'"));
		expect(example).toContain("--context 'other'");
		expect(example).toContain('--input');
		expect(example).not.toContain('--...');
		await cli.executeLine((example ?? '').replace(new RegExp(`^${APP_NAME} `), ''), io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: '<text>' });
	});
	it('keeps default changes within the selected context and validates provider/service pairs', async () => {
		const config = createMemoryCliConfigStore(serviceConfig());
		const cli = createWocliWebCli({ config });
		const { io, lines } = output();
		await cli.executeLine('service add second --type system', io);
		await cli.executeLine('service default set system second', io);
		await cli.executeLine('context create other', io);
		await cli.executeLine('service default set system system --context other', io);
		expect((await config.load()).contexts.local.defaults.system).toBe('second');
		await expect(cli.executeLine('service default set http system', io)).rejects.toThrow('provider');
		await expect(cli.executeLine('service default set system absent', io)).rejects.toThrow('Unknown service');
		await cli.executeLine('service default unset system', io);
		await cli.executeLine('service default show --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ system: 'system' });
		expect((await config.load()).contexts.other.defaults.system).toBe('system');
	});
	it('adds generic service fields and validates provider options before saving', async () => {
		const config = createMemoryCliConfigStore(serviceConfig());
		const cli = createWocliWebCli({ config });
		const { io } = output();
		await cli.executeLine(
			'service add observe --type openobserve --base-url https://observe.example.test --title Observability --header x-tenant=default --option organization=default --option timeoutMs=1000',
			io,
		);
		const saved = await config.load();
		expect(saved.contexts.local.services.observe).toMatchObject({
			type: 'openobserve',
			baseUrl: 'https://observe.example.test',
			title: 'Observability',
			headers: { 'x-tenant': 'default' },
			options: { organization: 'default', timeoutMs: 1000 },
		});
		await expect(cli.executeLine('service add invalid --type openobserve --option unsupported=true', io)).rejects.toThrow(
			'Invalid options for service type',
		);
	});
	it('inspects configured provider options without opening a service connection', async () => {
		const config = createMemoryCliConfigStore(parseCliConfig({
			services: [{ name: 'observe', type: 'openobserve', baseUrl: 'https://observe.example.test', options: { organization: 'default' } }],
		}));
		const cli = createWocliWebCli({ config });
		const { io, lines } = output();
		await cli.executeLine('service inspect observe --options --json', io);
		const value = JSON.parse(lines.pop() ?? '');
		expect(value.service).toMatchObject({ name: 'observe', type: 'openobserve', configuredOptionKeys: ['organization'] });
		expect(value.service.optionsSchema.properties.organization).toEqual({ type: 'string' });
	});
	it('shows service type metadata without loading configuration or credentials', async () => {
		const cli = createWocliWebCli({ config: createMemoryCliConfigStore(parseCliConfig({})) });
		const { io, lines } = output();
		await cli.executeLine('service type openobserve --json', io);
		const value = JSON.parse(lines.pop() ?? '');
		expect(value).toMatchObject({ name: 'openobserve', aliases: ['oo'], capabilities: ['openobserve'] });
		expect(value.optionsSchema.properties.organization).toEqual({ type: 'string' });
	});
	it('builds nested provider options from dotted keys', async () => {
		const custom: ServiceProvider = {
			name: 'custom',
			optionsSchema: { safeParse: (value) => ({ success: true, data: value }) },
			create: () => ({ getSchema: async () => ({ tools: {} }), call: async () => ({}) }),
		};
		const config = createMemoryCliConfigStore(parseCliConfig({}));
		const cli = createWocliWebCli({ config, providers: [custom] });
		const { io } = output();
		await cli.executeLine('service add custom --type custom --option auth.username=alice --option timeout=1000', io);
		expect((await config.load()).contexts.local.services.custom).toMatchObject({
			options: { auth: { username: 'alice' }, timeout: 1000 },
		});
	});
	it('discovers read-only tools, emits required-input examples and retains the original JSON schema', async () => {
		const schema = {
			tools: {
				read: {
					description: 'Read data',
					inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
					annotations: { readOnlyHint: true },
				},
				mutateTool: { inputSchema: {}, annotations: { readOnlyHint: false } },
			},
		};
		const call = vi.fn(async () => ({ ok: true }));
		const runtime: ServiceRuntimeClient = { getSchema: async () => schema, call };
		const cli = createWocliWebCli({ runtime, config: createMemoryCliConfigStore(serviceConfig()) });
		const { io, lines } = output();
		await cli.executeLine('service inspect system --output describe', io);
		const discovery = lines.pop() ?? '';
		expect(discovery).toContain('read');
		expect(discovery).toContain('<path>');
		expect(discovery).not.toContain('mutateTool');
		await cli.executeLine('service inspect system --writable --output describe', io);
		expect(lines.pop()).toContain('mutateTool');
		await cli.executeLine('service inspect system --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual(schema);
		expect(call).not.toHaveBeenCalled();
	});
});
