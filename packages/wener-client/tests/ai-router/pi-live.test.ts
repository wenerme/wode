import { execFile, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { serve } from '@hono/node-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAiRouter } from '../../src/ai/router';
import { ApiType } from '../../src/api/schema/ApiType';
import { createPiRouterModels } from './pi-models';

const run = promisify(execFile);
const pi = process.env.TESTING_PI_BIN || 'pi';
const available = spawnSync(pi, ['--version'], { encoding: 'utf8', timeout: 10_000 }).status === 0;
const isolated = [
	'--offline',
	'--no-approve',
	'--no-extensions',
	'--no-mcp',
	'--no-context-files',
	'--no-skills',
	'--no-prompt-templates',
	'--no-themes',
];

const models = [
	{ alias: 'router-chat', api: ApiType.OpenAIChatCompletions, model: process.env.TESTING_AI_MODEL_CHAT },
	{ alias: 'router-responses', api: ApiType.OpenAIResponses, model: process.env.TESTING_AI_MODEL_RESPONSES },
	// Exercise the Anthropic client against a Responses upstream through the router.
	{ alias: 'router-messages', api: ApiType.OpenAIResponses, model: process.env.TESTING_AI_MODEL_RESPONSES },
	{ alias: 'router-gemini', api: ApiType.GoogleGenerativeAI, model: process.env.TESTING_AI_MODEL_GEMINI },
] as const;

describe.skipIf(!available || !process.env.TESTING_AI_BASE_URL)('Pi client through Hono router (live)', () => {
	let directory: string;
	let server: ReturnType<typeof serve>;
	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'ai-router-pi-live-'));
		const app = createAiRouter({
			resolve: (ctx) => {
				const target = models.find((entry) => entry.alias === ctx.model);
				if (!target?.model) return new Response('Model is not configured', { status: 404 });
				return {
					api: target.api,
					baseURL: process.env.TESTING_AI_BASE_URL as string,
					model: target.model,
					headers: process.env.TESTING_AI_API_KEY
						? { authorization: `Bearer ${process.env.TESTING_AI_API_KEY}` }
						: undefined,
				};
			},
		});
		server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 });
		if (!server.listening) await once(server, 'listening');
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('No TCP address for test server');
		await writeFile(
			join(directory, 'models.json'),
			JSON.stringify(createPiRouterModels(`http://127.0.0.1:${address.port}`)),
		);
	});
	afterAll(async () => {
		if (server) {
			if ('closeAllConnections' in server) server.closeAllConnections();
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
		if (directory) await rm(directory, { recursive: true, force: true });
	});
	for (const target of models) {
		it.skipIf(!target.model)(
			`${target.alias}: streams through Hono`,
			async () => {
				const pending = run(
					pi,
					[
						...isolated,
						'--no-tools',
						'--no-session',
						'--provider',
						'local-ai-router',
						'--model',
						target.alias,
						'--thinking',
						'off',
						'--system-prompt',
						'Reply with the single lowercase word pong.',
						'--print',
						'ping',
					],
					{ cwd: directory, env: { ...process.env, PI_CODING_AGENT_DIR: directory }, timeout: 120_000 },
				);
				// Print mode reads piped stdin before sending the prompt. Close the unused pipe.
				pending.child.stdin?.end();
				const result = await pending;
				expect(result.stdout.trim()).toMatch(/\bpong\b/i);
			},
			130_000,
		);
	}
});
