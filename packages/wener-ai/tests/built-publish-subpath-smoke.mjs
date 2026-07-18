import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const subpaths = ['./schema', './agent/persona', './agent/skill', './mcp'];
const publishedExports = Object.fromEntries(
	subpaths.map((subpath) => {
		const target = packageJson.publishConfig?.exports?.[subpath];
		if (!target?.default) throw new Error(`Missing publish export for ${subpath}`);
		return [subpath, target];
	}),
);

const temporaryRoot = await mkdtemp(join(tmpdir(), 'wener-ai-publish-smoke-'));
try {
	const stagedPackage = join(temporaryRoot, 'node_modules', '@wener', 'ai');
	await mkdir(stagedPackage, { recursive: true });
	await writeFile(
		join(stagedPackage, 'package.json'),
		JSON.stringify({
			name: packageJson.name,
			version: packageJson.version,
			type: packageJson.type,
			exports: publishedExports,
		}),
	);
	await symlink(
		join(packageRoot, 'lib'),
		join(stagedPackage, 'lib'),
		process.platform === 'win32' ? 'junction' : 'dir',
	);

	const smokeModule = join(temporaryRoot, 'smoke.mjs');
	await writeFile(
		smokeModule,
		`const schema = await import('@wener/ai/schema');
const persona = await import('@wener/ai/agent/persona');
const skill = await import('@wener/ai/agent/skill');
const mcp = await import('@wener/ai/mcp');
const checks = [
  schema.AiConfigBundleSchema.safeParse({}).success,
  persona.PersonaSchema.safeParse({ id: 'persona-smoke', name: 'Smoke', version: '1' }).success,
  skill.SkillSchema.safeParse({ name: 'smoke', description: 'Smoke', instructions: 'Run.', version: '1' }).success,
  mcp.McpServerConfigSchema.safeParse({ transport: 'stdio', command: 'smoke' }).success,
];
if (checks.some((passed) => !passed)) throw new Error('Built publish subpath schema check failed');
`,
	);
	await import(`${pathToFileURL(smokeModule).href}?run=${Date.now()}`);
	console.log(`built publish subpath smoke: ${subpaths.length}/${subpaths.length}`);
} finally {
	await rm(temporaryRoot, { recursive: true, force: true });
}
