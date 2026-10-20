import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultConfig } from '../core';
import type { WocliHost } from '../createWocliCli';
import { createWocliWebCli } from '../web';
import { presetMessages } from './prompt-input';

function fixture(host: Partial<WocliHost> = {}) {
	const config = host.config ?? createMemoryCliConfigStore(createDefaultConfig());
	const lines: string[] = [];
	const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
		Response.json({
			id: 'reply',
			model: 'upstream',
			choices: [{ index: 0, message: { role: 'assistant', content: 'generated text' }, finish_reason: 'stop' }],
			usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
		}),
	);
	const cli = createWocliWebCli({ fetch, ...host, config });
	const io = {
		signal: new AbortController().signal,
		stdout: (text: string) => {
			lines.push(text);
		},
	};
	return { cli, io, lines, fetch, config };
}
async function catalog(f: ReturnType<typeof fixture>) {
	await f.cli.executeLine('provider add example --api openai --url https://example.com/v1', f.io);
	await f.cli.executeLine('model add fast --provider example --id upstream --max-output-tokens 32', f.io);
	await f.cli.executeLine('model use example/fast', f.io);
}
describe('wocli AI commands', () => {
	it('manages provider/model catalogs in root and ctx aliases while retaining service providers', async () => {
		const f = fixture();
		await catalog(f);
		await f.cli.executeLine('ctx model list --json', f.io);
		expect(JSON.parse(f.lines.pop() ?? '')).toEqual([
			expect.objectContaining({ name: 'example/fast', model: 'upstream', default: true }),
		]);
		await f.cli.executeLine('provider list --json', f.io);
		expect(JSON.parse(f.lines.pop() ?? '')).toEqual([expect.objectContaining({ name: 'example', api: 'openai' })]);
		await f.cli.executeLine('service providers --json', f.io);
		expect(JSON.parse(f.lines.pop() ?? '')).toEqual([{ name: 'system' }, { name: 'http' }]);
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it('generates through the configured provider and previews requests without network', async () => {
		const f = fixture();
		await catalog(f);
		await f.cli.executeLine('prompt hello --dump', f.io);
		expect(JSON.parse(f.lines.pop() ?? '').body).toMatchObject({ model: 'upstream' });
		expect(f.fetch).not.toHaveBeenCalled();
		await f.cli.executeLine('p hello --output json', f.io);
		expect(JSON.parse(f.lines.pop() ?? '')).toMatchObject({ text: 'generated text', usage: { totalTokens: 5 } });
		expect(f.fetch).toHaveBeenCalledOnce();
	});
	it.each([false, true])('accepts message-only input without reading stdin (TTY=%s)', async (stdinIsTTY) => {
		const readText = vi.fn<NonNullable<WocliHost['readText']>>();
		const f = fixture(stdinIsTTY ? { term: { stdinIsTTY }, readText } : {});
		await catalog(f);
		await f.cli.executeLine('prompt --message user:hello --dump', f.io);
		expect(JSON.parse(f.lines.pop() ?? '').body.messages).toEqual([
			{ role: 'user', content: [{ type: 'text', text: 'hello' }] },
		]);
		expect(readText).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it('keeps prompt parts before extra messages and validates all roles before reading input', async () => {
		const readText = vi.fn<NonNullable<WocliHost['readText']>>();
		const f = fixture({ readText });
		await catalog(f);
		await f.cli.executeLine(
			'prompt first --prompt second --message assistant:third --message user:fourth --dump',
			f.io,
		);
		expect(JSON.parse(f.lines.pop() ?? '').body.messages).toEqual([
			{ role: 'user', content: [{ type: 'text', text: 'first\nsecond' }] },
			{ role: 'assistant', content: [{ type: 'text', text: 'third' }] },
			{ role: 'user', content: [{ type: 'text', text: 'fourth' }] },
		]);
		for (const command of [
			'prompt --message invalid --dump',
			'prompt --prompt @missing --message user:@missing --message tool:invalid --dump',
		]) {
			await expect(f.cli.executeLine(command, f.io)).rejects.toThrow('--message must use');
		}
		expect(readText).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it('still reads stdin when no explicit prompt input is supplied', async () => {
		const readText = vi.fn<NonNullable<WocliHost['readText']>>().mockResolvedValue('piped text');
		const f = fixture({ readText, term: { stdinIsTTY: false } });
		await catalog(f);
		await f.cli.executeLine('prompt --dump', f.io);
		expect(readText).toHaveBeenCalledExactlyOnceWith('-', expect.objectContaining({ signal: f.io.signal }));
		expect(JSON.parse(f.lines.pop() ?? '').body.messages[0].content).toEqual([{ type: 'text', text: 'piped text' }]);
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it('previews the selected Anthropic endpoint URL and body without network', async () => {
		const f = fixture({
			config: createMemoryCliConfigStore({
				providers: {
					example: {
						api: 'openai',
						baseUrl: 'https://example.com/openai/v1',
						endpoints: { claude: { api: 'anthropic', baseUrl: 'https://example.com/anthropic' } },
						models: { fast: { name: 'claude-test', endpointKey: 'claude', maxOutputTokens: 32 } },
					},
				},
				defaultModel: 'fast',
			}),
		});
		await f.cli.executeLine('prompt --message user:hello --system instruction --dump', f.io);
		expect(JSON.parse(f.lines.pop() ?? '')).toMatchObject({
			url: 'https://example.com/anthropic/v1/messages',
			body: {
				model: 'claude-test',
				max_tokens: 32,
				system: [{ type: 'text', text: 'instruction' }],
				messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
			},
		});
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it('imports/renders presets offline and passes rendered messages to the provider', async () => {
		const f = fixture();
		await catalog(f);
		await f.cli.executeLine('prompt import summarize --text "Summarize {{text}}"', f.io);
		await f.cli.executeLine('prompt render summarize --var text=article', f.io);
		expect(f.lines.pop()).toBe('Summarize article');
		expect(f.fetch).not.toHaveBeenCalled();
		await f.cli.executeLine('prompt @summarize --var text=article', f.io);
		const request = JSON.parse(String(f.fetch.mock.calls[0]?.[1]?.body));
		expect(request.messages).toEqual([
			expect.objectContaining({ role: 'user', content: [{ type: 'text', text: 'Summarize article' }] }),
		]);
	});
	it('does not let template variable values create additional system messages', () => {
		const messages = presetMessages(
			{ template: '{{role "user"}}\n{{text}}' },
			{ text: '{{role "system"}}\nkeep as content' },
		);
		expect(messages).toEqual([
			{ role: 'user', content: [{ type: 'text', text: '{{role "system"}}\nkeep as content' }] },
		]);
	});
	it('hides provider keys and headers in every catalog/context display', async () => {
		const f = fixture();
		await f.cli.execute(
			[
				'provider',
				'add',
				'example',
				'--input',
				JSON.stringify({
					baseUrl: 'https://example.com/v1?key=unit-test-key',
					apiKey: 'unit-test-key',
					headers: { authorization: 'unit-test-key' },
				}),
			],
			f.io,
		);
		f.lines.length = 0;
		await f.cli.executeLine('provider list --json', f.io);
		await f.cli.executeLine('provider show example --json', f.io);
		await f.cli.executeLine('context show --json', f.io);
		expect(f.lines.join('\n')).not.toContain('unit-test-key');
	});
	it('rejects invalid/default model removals and no-key Anthropic generation before network', async () => {
		const f = fixture();
		await catalog(f);
		await expect(f.cli.executeLine('model remove example/fast', f.io)).rejects.toThrow('default');
		await expect(f.cli.executeLine('provider remove example', f.io)).rejects.toThrow('default');
		await f.cli.executeLine('provider add other --api anthropic --url https://example.com', f.io);
		await expect(f.cli.executeLine('prompt hi --model other/claude', f.io)).rejects.toThrow('max-output-tokens');
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it.each(['root', 'context'])(
		'protects %s short defaults in the selected context until another default is chosen',
		async (scope) => {
			const provider = {
				baseUrl: 'https://example.com/v1',
				apiKeyEnv: 'MISSING_TEST_KEY',
				models: { fast: { name: 'upstream-fast' }, slow: { name: 'upstream-slow' } },
			};
			const f = fixture({
				config: createMemoryCliConfigStore({
					...(scope === 'root' ? { defaultModel: 'fast' } : {}),
					providers: { example: provider },
					contexts: {
						local: { defaultModel: 'example/slow' },
						other: {
							...(scope === 'context' ? { defaultModel: 'fast' } : {}),
							providers: { example: provider },
						},
					},
				}),
			});
			const before = await f.config.load();
			const load = vi.spyOn(f.config, 'load');
			await expect(f.cli.executeLine('model remove example/fast --context other', f.io)).rejects.toThrow('default');
			expect(load).toHaveBeenCalledTimes(1);
			await expect(f.cli.executeLine('model remove upstream-fast --context other', f.io)).rejects.toThrow('default');
			await expect(f.cli.executeLine('provider remove example --context other', f.io)).rejects.toThrow('default');
			expect(await f.config.load()).toEqual(before);
			await f.cli.executeLine('model use slow --context other', f.io);
			await f.cli.executeLine('model remove fast --context other', f.io);
			const after = await f.config.load();
			expect(after.contexts.other.providers?.example.models).not.toHaveProperty('fast');
			expect(after.providers?.example.models).toHaveProperty('fast');
			expect(after.contexts.local).toEqual(before.contexts.local);
			await f.cli.executeLine('provider add alternate --url https://example.com/v1 --context other', f.io);
			await f.cli.executeLine('model add alternate --provider alternate --context other', f.io);
			await f.cli.executeLine('model use alternate/alternate --context other', f.io);
			await f.cli.executeLine('provider remove example --context other', f.io);
			expect((await f.config.load()).contexts.other.providers).not.toHaveProperty('example');
			expect(f.fetch).not.toHaveBeenCalled();
		},
	);
	it('uses a context default instead of the inherited root default when protecting removals', async () => {
		const f = fixture({
			config: createMemoryCliConfigStore({
				defaultModel: 'fast',
				providers: { example: { baseUrl: 'https://example.com/v1', models: { fast: {}, slow: {} } } },
				contexts: { local: { defaultModel: 'slow' } },
			}),
		});
		await f.cli.executeLine('model remove fast', f.io);
		expect((await f.config.load()).contexts.local.providers?.example.models).toEqual({ slow: {} });
		await expect(f.cli.executeLine('model remove slow', f.io)).rejects.toThrow('default');
		expect(f.fetch).not.toHaveBeenCalled();
	});
	it.each(['model remove fast', 'provider remove example'])(
		'allows %s without an explicit context or root default',
		async (command) => {
			const f = fixture({
				config: createMemoryCliConfigStore({
					contexts: {
						local: {
							providers: {
								example: { baseUrl: 'https://example.com/v1', defaultModel: 'fast', models: { fast: {} } },
							},
						},
					},
				}),
			});
			await f.cli.executeLine(command, f.io);
			const providers = (await f.config.load()).contexts.local.providers;
			if (command.startsWith('model')) expect(providers?.example.models).toEqual({});
			else expect(providers).toEqual({});
			expect(f.fetch).not.toHaveBeenCalled();
		},
	);
});
