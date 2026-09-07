import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const subpath = './server/utils';
const target = packageJson.publishConfig?.exports?.[subpath];
if (!target?.default) throw new Error(`Missing publish export for ${subpath}`);

const temporaryRoot = await mkdtemp(join(tmpdir(), 'wener-common-publish-smoke-'));
try {
	const stagedPackage = join(temporaryRoot, 'node_modules', '@wener', 'common');
	await mkdir(stagedPackage, { recursive: true });
	await writeFile(
		join(stagedPackage, 'package.json'),
		JSON.stringify({
			exports: { [subpath]: target },
			name: packageJson.name,
			type: packageJson.type,
			version: packageJson.version,
		}),
	);
	await cp(join(packageRoot, 'lib'), join(stagedPackage, 'lib'), { recursive: true });

	const dependencyNames = new Set([
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.peerDependencies ?? {}),
	]);
	for (const dependency of dependencyNames) {
		const source = join(packageRoot, 'node_modules', ...dependency.split('/'));
		if (dependency === '@wener/utils') {
			const utilityPackageRoot = await realpath(source);
			await cp(join(utilityPackageRoot, 'lib'), join(temporaryRoot, 'wener-utils-lib'), { recursive: true });
			const utilityPackageJson = JSON.parse(await readFile(join(utilityPackageRoot, 'package.json'), 'utf8'));
			const stagedUtilityPackage = join(temporaryRoot, 'node_modules', '@wener', 'utils');
			await mkdir(stagedUtilityPackage, { recursive: true });
			await writeFile(
				join(stagedUtilityPackage, 'package.json'),
				JSON.stringify({
					exports: utilityPackageJson.publishConfig.exports,
					name: utilityPackageJson.name,
					type: utilityPackageJson.type,
					version: utilityPackageJson.version,
				}),
			);
			await symlink(
				join(temporaryRoot, 'wener-utils-lib'),
				join(stagedUtilityPackage, 'lib'),
				process.platform === 'win32' ? 'junction' : 'dir',
			);
			continue;
		}
		const dependencyTarget = join(temporaryRoot, 'node_modules', ...dependency.split('/'));
		await mkdir(dirname(dependencyTarget), { recursive: true });
		try {
			await symlink(source, dependencyTarget, process.platform === 'win32' ? 'junction' : 'dir');
		} catch (error) {
			if (error?.code !== 'ENOENT') throw error;
		}
	}

	const smokeModule = join(temporaryRoot, 'smoke.mjs');
	await writeFile(
		smokeModule,
		`import { loadEnvConf, parseDotEnv } from '@wener/common/server/utils';
import { z } from 'zod';

const parsed = parseDotEnv('APP_PORT=8022\\n');
if (parsed.APP_PORT !== '8022') throw new Error('parseDotEnv runtime export failed');

const config = loadEnvConf(z.object({ port: z.coerce.number().int() }), {
  env: { APP_PORT: '8022' },
  name: 'app',
});
if (config.port !== 8022) throw new Error('loadEnvConf runtime export failed');
`,
	);
	await import(`${pathToFileURL(smokeModule).href}?run=${Date.now()}`);
	console.log('built publish subpath smoke: @wener/common/server/utils loaded from lib');
} finally {
	await rm(temporaryRoot, { force: true, recursive: true });
}
