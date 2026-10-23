import { Cli, type CliContext } from '@wener/common/cli';
import { createServiceRuntime, ServiceProviderRegistry } from '@wener/common/service';
import { createBuiltinServiceProviders } from '@wener/common/service/builtin';
import { createServiceCliCommand } from '@wener/common/service/cli';
import { createRemoteServiceToolClient } from '@wener/common/service/runtime/client';
import type { ISearchService } from '@wener/common/service/search';
import { parseCliConfig, resolveCliContext } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { DuckDuckGoCliDefinition } from './duckduckgo';

describe('DuckDuckGo CLI definition', () => {
	it('executes search and ddg alias through a typed runtime client while keeping help offline', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () =>
			Response.json({
				Heading: 'Example',
				AbstractURL: 'https://example.com/first',
				AbstractText: 'First result',
				RelatedTopics: [{ FirstURL: 'https://example.com/second', Text: 'Second result' }],
			}),
		);
		const runtime = createServiceRuntime({
			context: resolveCliContext(parseCliConfig({ services: [{ name: 'search', type: 'duckduckgo' }] })),
			providers: new ServiceProviderRegistry(createBuiltinServiceProviders()),
			fetch,
		});
		const cli = new Cli<CliContext>('fixture');
		const readText = vi.fn(async () => {
			throw new Error('Must not read files');
		});
		const createClient = vi.fn(() => createRemoteServiceToolClient<Pick<ISearchService, 'search'>>(runtime, 'search'));
		cli.add(
			createServiceCliCommand(DuckDuckGoCliDefinition, {
				readText,
				async run(_operation, _options, context: CliContext, prepare) {
					const invoke = await prepare();
					context.stdout(JSON.stringify(await invoke(await createClient(), { signal: context.signal })));
				},
			}),
		);
		const io = { signal: new AbortController().signal, stdout: vi.fn() };
		try {
			await cli.execute(['ddg', 'search', '--help'], io);
			expect(createClient).not.toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
			await expect(cli.execute(['ddg', 'search', 'example', '--limit', '0'], io)).rejects.toThrow('DuckDuckGo limit');
			expect(createClient).not.toHaveBeenCalled();
			for (const name of ['duckduckgo', 'ddg']) {
				await cli.execute([name, 'search', 'two words', '--limit', '1', '--offset', '0'], io);
				expect(JSON.parse(io.stdout.mock.lastCall![0])).toMatchObject({
					metadata: { query: 'two words' },
					items: [{ title: 'Example' }],
				});
			}
			expect(fetch).toHaveBeenCalledTimes(2);
			expect(readText).not.toHaveBeenCalled();
		} finally {
			await runtime.close();
		}
	});

	it.each(['', ' ', '1.5', '-1', '1e2', '0x10', 'Infinity', '9007199254740992'])(
		'rejects malformed numeric CLI options: %j',
		async (limit) => {
			const operation = DuckDuckGoCliDefinition.commands[0];
			expect(() => operation.prepare({ args: ['example'], options: { limit }, readText: vi.fn() })).toThrow();
		},
	);
});
