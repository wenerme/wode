import { access, lstat, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import {
	allowedSourceRoots,
	getRegistryDependencyName,
	isAllowedDependency,
	itemDomains,
	transitionalDuplicateSourceOwners,
	transitionalDuplicateTargetOwners,
} from './registry-policy.mjs';
import { appRoot, loadRegistryCatalog, rootRegistryPath } from './registry-catalog.mjs';

const runtimeProvidedPackages = new Set(['react', 'react-dom']);
const catalog = await loadRegistryCatalog(process.env.WODE_REGISTRY_PATH ?? rootRegistryPath);
const failures = [];
const itemsByName = new Map();
const sourceOwners = new Map();
const targetOwners = new Map();

await rejectLegacySourceTree();

for (const item of catalog.items) {
	if (itemsByName.has(item.name)) {
		failures.push(`duplicate item name: ${item.name}`);
		continue;
	}
	itemsByName.set(item.name, item);
	for (const file of item.files ?? []) {
		sourceOwners.set(file.path, item.name);
		if (file.target) registerTargetOwner(file.target, item.name);
	}
}

checkClassification();
await checkFilesAndDependencies();
const targetGroups = collectGroups((file) => file.target);
checkOwnership('target', targetGroups, transitionalDuplicateTargetOwners);
checkOwnership(
	'source path',
	collectGroups((file) => file.path),
	transitionalDuplicateSourceOwners,
);
checkRegistryGraph();

if (failures.length > 0) {
	console.error(`Registry policy check failed:\n- ${failures.join('\n- ')}`);
	process.exitCode = 1;
} else {
	console.log(
		`Registry policy check passed (${catalog.items.length} items, ${catalog.manifests.length} manifest${catalog.manifests.length === 1 ? '' : 's'}).`,
	);
}

function checkClassification() {
	for (const name of itemsByName.keys()) {
		if (!itemDomains[name]) failures.push(`missing domain classification: ${name}`);
	}
	for (const name of Object.keys(itemDomains)) {
		if (!itemsByName.has(name)) failures.push(`classification references unknown item: ${name}`);
	}
}

async function rejectLegacySourceTree() {
	try {
		await lstat(join(appRoot, 'registry'));
		failures.push('legacy authored source tree must not exist: registry/');
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}
}

async function checkFilesAndDependencies() {
	for (const item of catalog.items) {
		const declaredDependencies = new Set((item.dependencies ?? []).map(packageName));
		const declaredRegistryDependencies = new Set(
			(item.registryDependencies ?? []).map(getRegistryDependencyName).filter(Boolean),
		);
		for (const file of item.files ?? []) {
			checkSourceRoot(item, file.path);
			if (!file.target) failures.push(`implicit target: ${item.name} -> ${file.path}`);
			try {
				await access(join(appRoot, file.path));
			} catch {
				failures.push(`missing source file: ${item.name} -> ${file.path}`);
				continue;
			}

			const source = await readFile(join(appRoot, file.path), 'utf8');
			for (const dependency of importedPackages(source)) {
				if (!declaredDependencies.has(dependency) && !runtimeProvidedPackages.has(dependency)) {
					failures.push(`undeclared package dependency: ${item.name} -> ${dependency} (${file.path})`);
				}
			}
			for (const specifier of importedSpecifiers(source)) {
				const owner = resolveSourceOwner(file.path, specifier);
				if (!owner || owner === item.name) continue;
				if (!declaredRegistryDependencies.has(owner)) {
					failures.push(`undeclared source registry dependency: ${item.name} -> ${owner} (${file.path})`);
				}
				if (!isAllowedDependency(item.name, owner)) {
					failures.push(`forbidden source domain dependency: ${item.name} -> ${owner} (${file.path})`);
				}
			}
		}
	}
}

function checkSourceRoot(item, path) {
	const [sourceRoot, domainRoot] = path.split('/');
	if (sourceRoot !== 'src' || !allowedSourceRoots[itemDomains[item.name]]?.has(domainRoot)) {
		failures.push(`invalid source root: ${item.name} -> ${path}`);
	}
}

function checkOwnership(label, groups, transitionalOwners) {
	for (const [key, owners] of groups) {
		if (owners.length < 2) continue;
		const expectedOwners = transitionalOwners[key];
		if (!expectedOwners || !sameStrings(owners, expectedOwners)) {
			failures.push(`duplicate ${label} owner: ${key} -> ${owners.join(', ')}`);
		}
	}
	for (const [key, expectedOwners] of Object.entries(transitionalOwners)) {
		const actualOwners = groups.get(key) ?? [];
		if (!sameStrings(actualOwners, expectedOwners)) {
			failures.push(`transitional duplicate ${label} changed: ${key} -> ${actualOwners.join(', ') || '<missing>'}`);
		}
	}
}

function checkRegistryGraph() {
	const graph = new Map([...itemsByName.keys()].map((name) => [name, []]));
	for (const item of catalog.items) {
		for (const dependency of item.registryDependencies ?? []) {
			const dependencyName = getRegistryDependencyName(dependency);
			if (!dependencyName) {
				failures.push(`noncanonical registry dependency: ${item.name} -> ${dependency}`);
				continue;
			}
			if (!itemsByName.has(dependencyName)) {
				failures.push(`unknown self registry dependency: ${item.name} -> ${dependency}`);
				continue;
			}
			if (!isAllowedDependency(item.name, dependencyName)) {
				failures.push(`forbidden domain dependency: ${item.name} -> ${dependencyName}`);
			}
			graph.get(item.name).push(dependencyName);
		}
	}

	const visiting = new Set();
	const visited = new Set();
	for (const name of graph.keys()) visit(name, []);

	function visit(name, stack) {
		if (visited.has(name)) return;
		if (visiting.has(name)) {
			failures.push(`registry dependency cycle: ${[...stack, name].join(' -> ')}`);
			return;
		}
		visiting.add(name);
		for (const dependency of graph.get(name)) visit(dependency, [...stack, name]);
		visiting.delete(name);
		visited.add(name);
	}
}

function registerTargetOwner(target, itemName) {
	const normalized = withoutExtension(target);
	targetOwners.set(normalized, itemName);
	if (normalized.endsWith('/index')) targetOwners.set(normalized.slice(0, -'/index'.length), itemName);
}

function resolveSourceOwner(sourcePath, specifier) {
	if (specifier.startsWith('@components/') || specifier.startsWith('@ui/')) {
		return targetOwners.get(withoutExtension(specifier));
	}
	if (specifier.startsWith('@/') || specifier.startsWith('#/')) {
		return ownerForResolvedPath(resolve(appRoot, 'src', specifier.slice(2)));
	}
	if (!specifier.startsWith('.')) return undefined;
	return ownerForResolvedPath(resolve(appRoot, dirname(sourcePath), specifier));
}

function ownerForResolvedPath(resolved) {
	for (const path of sourcePathCandidates(resolved)) {
		const owner = sourceOwners.get(relative(appRoot, path));
		if (owner) return owner;
	}
	return undefined;
}

function sourcePathCandidates(path) {
	if (extname(path)) return [path];
	return [path, `${path}.ts`, `${path}.tsx`, join(path, 'index.ts'), join(path, 'index.tsx')];
}

function collectGroups(select) {
	const groups = new Map();
	for (const item of catalog.items) {
		for (const file of item.files ?? []) {
			const key = select(file);
			if (!key) continue;
			const owners = groups.get(key) ?? [];
			owners.push(item.name);
			groups.set(key, owners);
		}
	}
	for (const owners of groups.values()) owners.sort();
	return groups;
}

function importedPackages(source) {
	const packages = new Set();
	for (const specifier of importedSpecifiers(source)) {
		if (
			specifier.startsWith('.') ||
			specifier.startsWith('@/') ||
			specifier.startsWith('#/') ||
			specifier.startsWith('@components/') ||
			specifier.startsWith('@ui/')
		)
			continue;
		packages.add(packageName(specifier));
	}
	return packages;
}

function importedSpecifiers(source) {
	const specifiers = new Set();
	for (const match of source.matchAll(
		/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s*['"]([^'"]+)['"]/g,
	)) {
		specifiers.add(match[1] ?? match[2] ?? match[3]);
	}
	return specifiers;
}

function packageName(specifier) {
	if (specifier.startsWith('@')) {
		const [scope, name] = specifier.split('/');
		return `${scope}/${name ?? ''}`.replace(/@(?=[~^\d]|$).*$/, '');
	}
	return specifier.split('/')[0].replace(/@(?=[~^\d]|$).*$/, '');
}

function withoutExtension(path) {
	return path.replace(/\.(?:tsx?|mts|cts)$/, '');
}

function sameStrings(left, right) {
	return left.length === right.length && left.every((value, index) => value === [...right].sort()[index]);
}
