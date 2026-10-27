import { createHash } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { lstat, readFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { type CliConfigLayer, CliConfigError, parseCliConfigLayer } from 'common/context';

export interface ProjectConfigSnapshot {
	path: string;
	revision: string;
	layer: Pick<CliConfigLayer, 'services' | 'defaults'>;
}

function hash(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}
function fileError(path: string, message: string): CliConfigError {
	return new CliConfigError(`project configuration (${basename(path)}): ${message}`);
}
async function isFile(path: string): Promise<boolean> {
	try {
		const info = await lstat(path);
		return info.isFile() || info.isSymbolicLink();
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
		throw fileError(path, 'Unable to inspect file');
	}
}
async function exists(path: string): Promise<boolean> {
	try { await lstat(path); return true; }
	catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
		throw fileError(path, 'Unable to inspect path');
	}
}
async function readProjectLayer(path: string): Promise<ProjectConfigSnapshot> {
	let content: string;
	try { content = await readFile(path, 'utf8'); }
	catch { throw fileError(path, 'Unable to read file'); }
	try {
		const document = parseDocument(content);
		if (document.errors.length) throw new Error();
		const input = document.contents === null ? {} : document.toJS();
		const layer = parseCliConfigLayer(input, { kind: basename(path).startsWith('woctl.') || basename(path) === 'woctl.yaml' || basename(path) === 'woctl.yml' ? 'base' : 'context' });
		return { path, revision: hash(content), layer: { services: layer.services, defaults: layer.defaults } };
	} catch (error) {
		throw fileError(path, error instanceof CliConfigError ? error.message : 'Invalid YAML');
	}
}

/** Find the nearest repository root without invoking git or adding a Node dependency to common code. */
export async function findProjectRoot(cwd: string): Promise<string | undefined> {
	let current = resolve(cwd);
	while (true) {
		if (await exists(join(current, '.git'))) return current;
		const parent = dirname(current);
		if (parent === current) return undefined;
		current = parent;
	}
}

export function findProjectRootSync(cwd: string): string | undefined {
	let current = resolve(cwd);
	while (true) {
		try {
			const info = lstatSync(join(current, '.git'));
			if (info.isFile() || info.isSymbolicLink() || info.isDirectory()) return current;
		} catch { /* continue toward filesystem root */ }
		const parent = dirname(current);
		if (parent === current) return undefined;
		current = parent;
	}
}

function projectDirectories(root: string, cwd: string): string[] {
	const suffix = relative(root, resolve(cwd));
	if (suffix.startsWith('..') || resolve(root, suffix) === root && suffix === '..') return [root];
	const parts = suffix ? suffix.split(/[\\/]/u).filter(Boolean) : [];
	return parts.reduce<string[]>((result, part) => [...result, join(result.at(-1)!, part)], [root]);
}

/** Discover read-only project service layers from repository root to the current directory. */
export async function discoverProjectConfigLayers(options: { cwd: string; basePath?: string }): Promise<ProjectConfigSnapshot[]> {
	const root = await findProjectRoot(options.cwd);
	if (!root) return [];
	const basePath = options.basePath ? resolve(options.basePath) : undefined;
	const names = ['service.yaml', 'service.yml', join('.wode', 'service.yaml'), join('.wode', 'service.yml'), 'woctl.yaml', 'woctl.yml'];
	const snapshots: ProjectConfigSnapshot[] = [];
	for (const directory of projectDirectories(root, options.cwd)) {
		for (const name of names) {
			const path = join(directory, name);
			if (basePath === path || !(await isFile(path))) continue;
			snapshots.push(await readProjectLayer(path));
		}
	}
	return snapshots;
}

export function mergeProjectConfigLayers(
	base: Pick<CliConfigLayer, 'services' | 'defaults'>,
	layers: readonly ProjectConfigSnapshot[],
): Pick<CliConfigLayer, 'services' | 'defaults'> {
	return layers.reduce(
		(result, layer) => ({
			services: { ...result.services, ...layer.layer.services },
			defaults: { ...result.defaults, ...layer.layer.defaults },
		}),
		{ services: { ...base.services }, defaults: { ...base.defaults } },
	);
}
