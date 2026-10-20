import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

// 只消费父级已构建的 unbundled lib；不转译、不安装，也不回退到源码条件。
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const requiredSubpaths = ['./cli', './cli/render', './cli/getCliOutputOptions', './cli/render/renderCliOutput'];
const cliExports = Object.fromEntries(
	Object.entries(packageJson.publishConfig?.exports ?? {}).filter(
		([key]) => key === './cli' || key.startsWith('./cli/'),
	),
);

function hasExport(exports, subpath) {
	return Object.keys(exports ?? {}).some((key) => {
		if (key === subpath) return true;
		const star = key.indexOf('*');
		return star >= 0 && subpath.startsWith(key.slice(0, star)) && subpath.endsWith(key.slice(star + 1));
	});
}

function runtimeDependencies(manifest) {
	return { ...manifest.peerDependencies, ...manifest.dependencies, ...manifest.optionalDependencies };
}

for (const subpath of requiredSubpaths) {
	assert(hasExport(packageJson.exports, subpath), `Missing source export for ${subpath}`);
	assert(hasExport(cliExports, subpath), `Missing publish export for ${subpath}`);
}
assert(packageJson.dependencies?.['@wener/utils'], 'CLI publish contract requires declared @wener/utils dependency');

const temporaryRoot = await realpath(await mkdtemp(join(tmpdir(), 'wener-common-cli-publish-smoke-')));
try {
	const stagedCommon = join(temporaryRoot, 'node_modules', '@wener', 'common');
	const utilityPackageRoot = await realpath(join(packageRoot, 'node_modules', '@wener', 'utils'));
	const utilityPackageJson = JSON.parse(await readFile(join(utilityPackageRoot, 'package.json'), 'utf8'));
	const stagedUtils = join(temporaryRoot, 'node_modules', '@wener', 'utils');
	assert(utilityPackageJson.publishConfig?.exports, 'Missing @wener/utils publish exports');
	await access(join(packageRoot, 'lib', 'cli', 'index.js'));
	await access(join(utilityPackageRoot, 'lib'));

	const packages = [
		{ source: packageRoot, staged: stagedCommon, manifest: packageJson, exports: cliExports },
		{
			source: utilityPackageRoot,
			staged: stagedUtils,
			manifest: utilityPackageJson,
			exports: utilityPackageJson.publishConfig.exports,
		},
	];
	for (const entry of packages) {
		const { source, staged, manifest, exports } = entry;
		const dependencies = runtimeDependencies(manifest);
		assert(!dependencies.common && !dependencies.wocli, `${manifest.name} must not depend on application packages`);
		await mkdir(staged, { recursive: true });
		await writeFile(
			join(staged, 'package.json'),
			JSON.stringify({
				name: manifest.name,
				version: manifest.version,
				type: manifest.type,
				exports,
				imports: manifest.publishConfig?.imports ?? manifest.imports,
				dependencies: manifest.dependencies,
				peerDependencies: manifest.peerDependencies,
				peerDependenciesMeta: manifest.peerDependenciesMeta,
				optionalDependencies: manifest.optionalDependencies,
			}),
		);
		await cp(join(source, 'lib'), join(staged, 'lib'), { recursive: true });
		// 每个 publisher 保留自己的依赖解析位置，避免 common 的依赖掩盖 utils 漏声明。
		for (const dependency of Object.keys(dependencies)) {
			if (dependency === '@wener/utils') continue;
			const dependencySource = join(source, 'node_modules', ...dependency.split('/'));
			try {
				await access(dependencySource);
			} catch (error) {
				// 未被 CLI 导入的 optional/其他领域依赖无需安装；若实际导入则由 Node 报缺失。
				if (error?.code === 'ENOENT') continue;
				throw error;
			}
			const target = join(staged, 'node_modules', ...dependency.split('/'));
			await mkdir(dirname(target), { recursive: true });
			await symlink(dependencySource, target, process.platform === 'win32' ? 'junction' : 'dir');
		}
	}

	await writeFile(
		join(temporaryRoot, 'package.json'),
		JSON.stringify({ private: true, type: 'module', dependencies: { '@wener/common': packageJson.version } }),
	);
	const consumerFile = join(temporaryRoot, 'consumer.mjs');
	await writeFile(
		consumerFile,
		`await (${consumePublishedCli.toString()})(${JSON.stringify(
			packages.map(({ staged, manifest }) => ({
				name: manifest.name,
				staged,
				dependencies: Object.keys(runtimeDependencies(manifest)),
			})),
		)});\n`,
	);
	// 不继承 NODE_OPTIONS/NODE_PATH/TS loader 或 workspace conditions。
	const result = await promisify(execFile)(process.execPath, [consumerFile], {
		cwd: temporaryRoot,
		env: { NO_COLOR: '1' },
		timeout: 30000,
	});
	process.stdout.write(result.stdout);
	process.stderr.write(result.stderr);
} finally {
	await rm(temporaryRoot, { force: true, recursive: true });
}

// 此函数作为独立 consumer 模块写入临时目录；仅使用 Node 内建模块和公开发布入口。
async function consumePublishedCli(packages) {
	const { default: assert } = await import('node:assert/strict');
	const { isBuiltin, registerHooks } = await import('node:module');
	const { pathToFileURL } = await import('node:url');
	const { join } = await import('node:path');
	const owners = packages.map((entry) => ({
		...entry,
		prefix: pathToFileURL(`${entry.staged}/`).href,
		lib: pathToFileURL(`${join(entry.staged, 'lib')}/`).href,
	}));
	const dependencyImports = new Set();
	const packageName = (specifier) =>
		specifier
			.split('/')
			.slice(0, specifier.startsWith('@') ? 2 : 1)
			.join('/');
	// 在防反向依赖 hook 注册前验证 consumer 自身确实看不到应用包。
	for (const name of ['common', 'wocli']) {
		assert.throws(() => import.meta.resolve(name), { code: 'ERR_MODULE_NOT_FOUND' });
	}
	const hooks = registerHooks({
		resolve(specifier, context, nextResolve) {
			const name = packageName(specifier);
			assert(name !== 'common' && name !== 'wocli', `Forbidden application import: ${specifier}`);
			const owner = owners.find((entry) => context.parentURL?.startsWith(entry.prefix));
			const relative = specifier.startsWith('./') || specifier.startsWith('../');
			const bare = !relative && !specifier.startsWith('/') && !specifier.includes(':') && !specifier.startsWith('#');
			if (owner && bare && !isBuiltin(specifier) && name !== owner.name) {
				assert(owner.dependencies.includes(name), `${owner.name} has undeclared CLI runtime dependency: ${name}`);
				dependencyImports.add(`${owner.name} -> ${name}`);
			}
			const resolved = nextResolve(specifier, context);
			if (owner && !bare && !isBuiltin(specifier)) {
				assert(resolved.url.startsWith(owner.lib), `Internal import escaped published lib: ${specifier}`);
			}
			const publicPackage = owners.find((entry) => entry.name === name);
			if (publicPackage) {
				assert(resolved.url.startsWith(publicPackage.lib), `Public import did not resolve to staged lib: ${specifier}`);
			}
			const stagedOwner = owners.find((entry) => resolved.url.startsWith(entry.prefix));
			if (stagedOwner) {
				assert(resolved.url.startsWith(stagedOwner.lib), `CLI runtime escaped staged lib: ${specifier}`);
			}
			return resolved;
		},
	});
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		throw new Error('CLI publish smoke must not access the network');
	};
	try {
		const api = await import('@wener/common/cli');
		const render = await import('@wener/common/cli/render');
		const deepOptions = await import('@wener/common/cli/getCliOutputOptions');
		const deepRender = await import('@wener/common/cli/render/renderCliOutput');
		assert.equal(render.renderCliOutput, api.renderCliOutput);
		assert.equal(deepRender.renderCliOutput, api.renderCliOutput);
		assert.equal(deepOptions.getCliOutputOptions, api.getCliOutputOptions);

		const lines = [];
		let calls = 0;
		const cli = new api.Cli('publish-consumer');
		cli.add({
			name: 'echo',
			description: '输出原始输入',
			arguments: '<value>',
			run({ args }, context) {
				calls++;
				context.stdout(args[0]);
			},
		});
		const io = { signal: new AbortController().signal, stdout: (text) => lines.push(text) };
		await cli.execute(['--help'], io);
		await cli.execute(['echo', '--help'], io);
		assert.equal(calls, 0);
		assert.match(lines.join('\n'), /publish-consumer/);
		assert.match(lines.join('\n'), /echo/);
		const argv = api.splitCliCommandLine('echo "00012"');
		assert.deepEqual(argv, ['echo', '00012']);
		assert.deepEqual(cli.parse(argv), { path: ['echo'], args: ['00012'], options: {} });
		assert.equal(calls, 0);
		await cli.execute(argv, io);
		assert.equal(calls, 1);
		assert.equal(lines.at(-1), '00012');
		assert.deepEqual(api.splitCliCommandLine('echo "hello world"'), ['echo', 'hello world']);
		assert.deepEqual(api.parseCliArgs(['--id', '00012', '007'], [{ name: 'id', description: '标识' }]), {
			args: ['007'],
			options: { id: '00012' },
		});

		const options = deepOptions.getCliOutputOptions(
			{ columns: 72, env: {}, term: { stdoutIsTTY: false } },
			{ output: 'json' },
		);
		assert.equal(options.format, 'json');
		assert.equal(options.w, 72);
		const value = { id: '00012', count: 2 };
		assert.deepEqual(JSON.parse(api.renderCliOutput(value, options)), value);
		assert.equal(render.renderCliOutput({ count: 2 }, { format: 'yaml' }), 'count: 2\n');
		assert.deepEqual(JSON.parse(deepRender.renderCliOutput(value, { format: 'json' })), value);
		assert(dependencyImports.has('@wener/common -> @wener/utils'), 'Expected built @wener/utils dependency to execute');
		console.log('CLI-PUBLIC-01: unbundled published CLI root/deep APIs, help, parse/split and JSON/YAML render passed');
	} finally {
		globalThis.fetch = originalFetch;
		hooks.deregister();
	}
}
