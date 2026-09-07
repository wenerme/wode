import { lstat, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const rootRegistryPath = resolve(appRoot, 'registry.json');
export const domainManifestIncludes = Object.freeze([
	'./src/agent/registry.json',
	'./src/auth/registry.json',
	'./src/components/registry.json',
	'./src/console/registry.json',
	'./src/file/registry.json',
	'./src/resource/registry.json',
	'./src/ui/registry.json',
	'./src/window/registry.json',
]);

export async function loadRegistryCatalog(registryPath = rootRegistryPath) {
	const resolvedPath = resolve(registryPath);
	if (resolvedPath !== rootRegistryPath) return loadStandaloneCatalog(resolvedPath);

	const root = await readManifest(rootRegistryPath);
	validateRootManifest(root);
	const manifests = [{ path: 'registry.json', manifest: root }];
	const items = [];

	for (const include of domainManifestIncludes) {
		const manifestPath = resolve(appRoot, include);
		const manifest = await readManifest(manifestPath);
		if (manifest.include !== undefined) {
			throw new Error(`Nested registry include is not allowed: ${toAppRelativePath(manifestPath)}`);
		}
		if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
			throw new Error(`Registry domain manifest must contain items: ${toAppRelativePath(manifestPath)}`);
		}
		manifests.push({ path: toAppRelativePath(manifestPath), manifest });
		items.push(...resolveManifestItems(manifestPath, manifest));
	}

	return { manifests, items, root };
}

async function loadStandaloneCatalog(manifestPath) {
	const manifest = await readManifest(manifestPath);
	if (manifest.include !== undefined) {
		throw new Error(`Standalone registry fixtures cannot include manifests: ${toAppRelativePath(manifestPath)}`);
	}
	return {
		manifests: [{ path: toAppRelativePath(manifestPath), manifest }],
		items: resolveManifestItems(manifestPath, manifest),
		root: manifest,
	};
}

async function readManifest(manifestPath) {
	const stat = await lstat(manifestPath);
	if (stat.isSymbolicLink())
		throw new Error(`Registry manifest cannot be a symlink: ${toAppRelativePath(manifestPath)}`);
	return JSON.parse(await readFile(manifestPath, 'utf8'));
}

function validateRootManifest(root) {
	if (root.items !== undefined) throw new Error('Root registry manifest must not declare items');
	if (!sameStrings(root.include, domainManifestIncludes)) {
		throw new Error(`Root registry includes must match the approved domains: ${domainManifestIncludes.join(', ')}`);
	}
}

function resolveManifestItems(manifestPath, manifest) {
	return (manifest.items ?? []).map((item) => ({
		...item,
		files: (item.files ?? []).map((file) => ({
			...file,
			path: resolveItemFilePath(manifestPath, file.path),
		})),
	}));
}

function resolveItemFilePath(manifestPath, filePath) {
	if (typeof filePath !== 'string' || filePath.length === 0 || isAbsolute(filePath)) {
		throw new Error(`Invalid registry file path in ${toAppRelativePath(manifestPath)}`);
	}

	const resolved = filePath.startsWith('.') ? resolve(dirname(manifestPath), filePath) : resolve(appRoot, filePath);
	const relativePath = relative(appRoot, resolved);
	if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
		throw new Error(`Registry file escapes app root: ${filePath} from ${toAppRelativePath(manifestPath)}`);
	}
	return relativePath;
}

function sameStrings(left, right) {
	return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function toAppRelativePath(path) {
	return relative(appRoot, path) || '.';
}
