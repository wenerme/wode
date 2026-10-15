import { execFile, spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { createPiRouterModels } from './pi-models';

const pi = process.env.TESTING_PI_BIN || 'pi';
const available = spawnSync(pi, ['--version'], { encoding: 'utf8', timeout: 10_000 }).status === 0;

describe.skipIf(!available)('Pi models.json integration', () => {
	it('loads four protocol aliases from a single provider without using the normal agent configuration', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'ai-router-pi-models-'));
		try {
			await writeFile(join(directory, 'models.json'), JSON.stringify(createPiRouterModels('http://127.0.0.1:8788')));
			const result = await promisify(execFile)(
				pi,
				[
					'--offline',
					'--no-approve',
					'--no-extensions',
					'--no-mcp',
					'--no-context-files',
					'--no-skills',
					'--no-prompt-templates',
					'--no-themes',
					'--list-models',
					'local-ai-router',
				],
				{ cwd: directory, env: { ...process.env, PI_CODING_AGENT_DIR: directory }, timeout: 20_000 },
			);
			for (const model of ['router-chat', 'router-responses', 'router-messages', 'router-gemini']) {
				expect(result.stdout).toContain(model);
			}
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	}, 30_000);
});
