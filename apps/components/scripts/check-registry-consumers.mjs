import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { appRoot, loadRegistryCatalog } from './registry-catalog.mjs';
import { packageNameFromSpec, resolveLocalPackageDependency } from './registry-consumer-packages.mjs';
import { getRegistryDependencyName, publicRegistryUrl } from './registry-policy.mjs';
import { runChildCommand } from './run-child-command.mjs';
import { runSyncJsonCommand } from './run-sync-command.mjs';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const repoRoot = dirname(dirname(appRoot));
const localPackages = Object.freeze({
	'@wener/ai': join(repoRoot, 'packages', 'wener-ai'),
	'@wener/common': join(repoRoot, 'packages', 'wener-common'),
});
const defaultItems = [
	'hello-button',
	'query-builder',
	'window-manager',
	'console-shell',
	'file-tree',
	'file-manager',
	'file-picker',
	'agent-message',
	'agent-chat',
	'login-page',
];
const arguments_ = process.argv.slice(2);
const catalog = await loadRegistryCatalog();
const itemsByName = new Map(catalog.items.map((item) => [item.name, item]));
const localDependencyPackages = loadLocalDependencyPackages();
const selectedItems = selectItems(arguments_.at(0) === '--' ? arguments_.slice(1) : arguments_);
assertControlledRegistryDependencies();
const temporaryRoot = await mkdtemp(join(tmpdir(), 'wener-components-consumer-'));
const registryOutput = join(temporaryRoot, 'registry');
const server = createServer((request, response) => void serveRegistry(request, response));

try {
	await runPnpm(['exec', 'shadcn', 'build', '--output', registryOutput], appRoot);
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('Local registry server did not provide an address');
	const registryBaseUrl = `http://127.0.0.1:${address.port}/r/`;

	for (const item of selectedItems) {
		const consumerRoot = join(temporaryRoot, item.name);
		console.log(`Checking clean consumer: ${item.name}`);
		await createConsumer(consumerRoot);
		await runPnpm(['install', '--prefer-offline', '--ignore-scripts'], consumerRoot);
		await installLocalDependencyPackages(consumerRoot);
		await runPnpm(
			['exec', 'shadcn', 'add', `${registryBaseUrl}${item.name}.json`, '--yes', '--cwd', consumerRoot],
			appRoot,
		);
		await writeConsumerSmoke(consumerRoot, item);
		await runPnpm(['exec', 'tsc', '--noEmit', '--project', 'tsconfig.json'], consumerRoot);
	}

	console.log(`Registry consumer check passed (${selectedItems.length} clean consumers).`);
} finally {
	if (server.listening) await new Promise((resolve) => server.close(resolve));
	await rm(temporaryRoot, { recursive: true, force: true });
}

async function serveRegistry(request, response) {
	try {
		const path = new URL(request.url ?? '/', 'http://registry.local').pathname;
		if (!path.startsWith('/r/') || !path.endsWith('.json')) {
			response.writeHead(404).end();
			return;
		}
		const fileName = basename(path);
		const document = await readFile(join(registryOutput, fileName), 'utf8');
		const rewritten = rewriteLocalRegistryDocument(document, `http://${request.headers.host}/r/`);
		if (rewritten.includes(publicRegistryUrl)) {
			throw new Error(`Unrewritten Wode registry dependency in ${fileName}`);
		}
		response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(rewritten);
	} catch (error) {
		response
			.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
			.end(error instanceof Error ? error.message : String(error));
	}
}

function rewriteLocalRegistryDocument(document, registryBaseUrl) {
	const registry = JSON.parse(document);
	registry.dependencies = (registry.dependencies ?? []).filter((dependency) => {
		const packageName = packageNameFromSpec(dependency);
		if (!localDependencyPackages.has(packageName)) throw new Error(`Uncontrolled package dependency: ${dependency}`);
		return false;
	});
	return `${JSON.stringify(registry, null, 2).replaceAll(publicRegistryUrl, registryBaseUrl)}\n`;
}

function loadLocalDependencyPackages() {
	const declaredSpecs = collectDeclaredPackageSpecs();
	const dependencies = new Map();
	for (const [name, path] of Object.entries(localPackages)) {
		const selectors = declaredSpecs.get(name);
		if (selectors) dependencies.set(name, resolveLocalPackageDependency({ name, path, selectors }));
	}
	for (const [name, selectors] of declaredSpecs) {
		if (Object.hasOwn(localPackages, name)) continue;
		const installed = [...selectors].flatMap(
			(selector) => collectInstalledPackages(pnpmList([selector, '--depth', 'Infinity', '--json'])).get(name) ?? [],
		);
		const identities = new Map(installed.map((entry) => [`${entry.version}\0${entry.path}`, entry]));
		if (identities.size !== 1) {
			throw new Error(
				`Installed dependency must resolve to one package: ${name} -> ${
					[...identities.values()].map((entry) => `${entry.version} at ${entry.path}`).join(', ') || '<missing>'
				}`,
			);
		}
		dependencies.set(name, [...identities.values()][0]);
	}
	return dependencies;
}

function collectDeclaredPackageSpecs() {
	const specs = new Map();
	for (const dependency of catalog.items.flatMap((item) => item.dependencies ?? [])) {
		const name = packageNameFromSpec(dependency);
		const values = specs.get(name) ?? new Set();
		values.add(dependency);
		specs.set(name, values);
	}
	return specs;
}

function pnpmList(arguments_) {
	return runSyncJsonCommand({ command: pnpm, arguments_: ['list', ...arguments_], cwd: appRoot });
}

function collectInstalledPackages(inventory) {
	const packages = new Map();
	const visited = new Set();
	for (const project of inventory) visit(project);
	return packages;

	function visit(node) {
		if (!node || typeof node !== 'object' || visited.has(node)) return;
		visited.add(node);
		for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
			for (const [name, dependency] of Object.entries(node[group] ?? {})) {
				if (isInstalledPackage(dependency)) {
					const values = packages.get(name) ?? [];
					values.push({ path: dependency.path, version: dependency.version });
					packages.set(name, values);
				}
				visit(dependency);
			}
		}
	}
}

async function installLocalDependencyPackages(consumerRoot) {
	const dependencies = [...localDependencyPackages].map(([name, package_]) => `${name}@link:${package_.path}`);
	await runPnpm(['add', '--offline', '--ignore-scripts', '--', ...dependencies], consumerRoot);
}

function isInstalledPackage(value) {
	return typeof value?.version === 'string' && typeof value?.path === 'string';
}

function selectItems(argv) {
	if (argv.length === 0) return defaultItems.map(requireItem);
	if (argv.length === 1 && argv[0] === '--all') return [...itemsByName.values()];
	if (argv[0] === '--items' && argv.length === 2) {
		return argv[1].split(',').filter(Boolean).map(requireItem);
	}
	throw new Error('Usage: registry:consumer-check [-- --all | -- --items item-a,item-b]');
}

function requireItem(name) {
	const item = itemsByName.get(name);
	if (!item) throw new Error(`Unknown registry item: ${name}`);
	return item;
}

async function createConsumer(root) {
	await mkdir(join(root, 'src', 'lib'), { recursive: true });
	await writeFile(
		join(root, 'package.json'),
		`${JSON.stringify(
			{
				name: 'wener-registry-consumer-smoke',
				private: true,
				type: 'module',
				packageManager: 'pnpm@10.33.0',
				dependencies: {
					clsx: '2.1.1',
					react: '19.2.7',
					'react-dom': '19.2.7',
					'tailwind-merge': '3.6.0',
				},
				devDependencies: {
					'@types/node': '24.13.3',
					'@types/react': '19.2.17',
					'@types/react-dom': '19.2.3',
					typescript: '7.0.2',
				},
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(
		join(root, 'components.json'),
		`${JSON.stringify(
			{
				$schema: 'https://ui.shadcn.com/schema.json',
				style: 'new-york',
				rsc: false,
				tsx: true,
				tailwind: {
					config: '',
					css: 'src/index.css',
					baseColor: 'neutral',
					cssVariables: true,
					prefix: '',
				},
				iconLibrary: 'lucide',
				aliases: {
					components: '@components',
					hooks: '@hooks',
					lib: '@lib',
					ui: '@ui',
					utils: '@lib/utils',
				},
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(
		join(root, 'tsconfig.json'),
		`${JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2022',
					lib: ['DOM', 'DOM.Iterable', 'ESNext'],
					module: 'ESNext',
					moduleResolution: 'Bundler',
					jsx: 'react-jsx',
					strict: true,
					skipLibCheck: true,
					types: ['node', 'react', 'react-dom'],
					noEmit: true,
					paths: {
						'@/*': ['./src/*'],
						'@components/*': ['./@components/*'],
						'@hooks/*': ['./@hooks/*'],
						'@lib/*': ['./src/lib/*'],
						'@ui/*': ['./@ui/*'],
					},
				},
				include: ['src'],
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(join(root, 'src', 'index.css'), "@import 'tailwindcss';\n@plugin 'daisyui';\n");
	await writeFile(
		join(root, 'src', 'lib', 'utils.ts'),
		"import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n\treturn twMerge(clsx(inputs));\n}\n",
	);
}

async function writeConsumerSmoke(root, item) {
	const targets = [...new Set((item.files ?? []).map((file) => file.target).filter(isImportableTarget))];
	if (targets.length === 0) throw new Error(`No importable target for ${item.name}`);
	const imports = targets.map((target, index) => `import * as Item${index} from '${withoutExtension(target)}';`);
	const values = targets.map((_, index) => `Item${index}`).join(', ');
	await writeFile(join(root, 'src', 'registry-smoke.ts'), `${imports.join('\n')}\n\nvoid [${values}];\n`);
}

function assertControlledRegistryDependencies() {
	for (const item of catalog.items) {
		for (const dependency of item.registryDependencies ?? []) {
			if (!getRegistryDependencyName(dependency))
				throw new Error(`Noncanonical registry dependency: ${item.name} -> ${dependency}`);
		}
	}
}

function isImportableTarget(target) {
	return typeof target === 'string' && !target.endsWith('.d.ts');
}

function withoutExtension(target) {
	return target.replace(/\.(?:tsx?|mts|cts)$/, '');
}

function runPnpm(arguments_, cwd) {
	return runChildCommand({
		command: pnpm,
		arguments_,
		cwd,
		env: { ...process.env, npm_config_offline: 'true', npm_config_prefer_offline: 'true' },
	});
}
