import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
	type CliConfig,
	CliConfigError,
	type CliConfigLayer,
	type CliConfigLayerKind,
	CliConfigNameSchema,
	type CliConfigStore,
	parseCliConfig,
	parseCliConfigLayer,
	serializeCliConfigLayer,
} from 'common/context';
import { parseDocument, stringify } from 'yaml';

interface LayerSnapshot {
	path: string;
	kind: CliConfigLayerKind;
	layer: CliConfigLayer;
	revision: string | null;
}
interface EditSnapshot {
	config: CliConfig;
	selected: string;
	base: LayerSnapshot;
	overlay: LayerSnapshot;
	files: Set<string>;
	createContext?: string;
}
export interface FileCliConfigStore extends CliConfigStore {
	createContext(name: string, options?: { context?: string }): Promise<void>;
}
interface Change {
	path: string;
	kind: CliConfigLayerKind;
	layer: CliConfigLayer | null;
	revision: string | null;
}

function code(error: unknown): string | undefined {
	return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
		? error.code
		: undefined;
}
function revision(content: string): string {
	return createHash('sha256').update(content).digest('hex');
}
function layerError(path: string, kind: CliConfigLayerKind, message: string): CliConfigError {
	return new CliConfigError(`${kind} configuration (${basename(path)}): ${message}`);
}
async function readLayer(path: string, kind: CliConfigLayerKind, allowMissing: boolean): Promise<LayerSnapshot> {
	let content: string;
	try {
		content = await readFile(path, 'utf8');
	} catch (error) {
		if (code(error) === 'ENOENT' && allowMissing)
			return { path, kind, layer: parseCliConfigLayer({}, { kind }), revision: null };
		throw layerError(path, kind, code(error) === 'ENOENT' ? 'Context file does not exist' : 'Unable to read file');
	}
	try {
		const document = parseDocument(content);
		if (document.errors.length) throw new CliConfigError('Invalid YAML');
		const layer = parseCliConfigLayer(document.contents === null ? {} : document.toJS(), { kind });
		return { path, kind, layer, revision: revision(content) };
	} catch (error) {
		// YAML exceptions may include the original source and secrets. Never expose them.
		throw layerError(path, kind, error instanceof CliConfigError ? error.message : 'Invalid YAML');
	}
}

async function assertRevision(document: Pick<LayerSnapshot, 'path' | 'kind' | 'revision'>): Promise<void> {
	let actual: string | null = null;
	try {
		if (document.revision === null) {
			await lstat(document.path);
			// A newly appeared context is not ours to read.
			throw layerError(document.path, document.kind, 'Configuration changed since load; reload before saving');
		}
		actual = revision(await readFile(document.path, 'utf8'));
	} catch (error) {
		if (code(error) !== 'ENOENT') {
			if (error instanceof CliConfigError) throw error;
			throw layerError(document.path, document.kind, 'Unable to verify file revision');
		}
	}
	if (actual !== document.revision)
		throw layerError(document.path, document.kind, 'Configuration changed since load; reload before saving');
}

function globals(config: CliConfig) {
	const { contexts: _contexts, ...root } = config;
	return root;
}

/**
 * Native base + selected overlay. Each load result carries its own private edit baseline.
 * Lock files coordinate participating writers; revision checks cannot make arbitrary external editors transactional.
 */
export function createFileConfigStore(path: string): FileCliConfigStore {
	const basePath = resolve(path);
	const extension = extname(basePath);
	if (extension !== '.yaml' && extension !== '.yml')
		throw new CliConfigError('Unsupported configuration extension; use .yaml or .yml');
	const directory = dirname(basePath);
	const stem = basename(basePath, extension);
	const prefix = `${stem}.`;
	const snapshots = new WeakMap<CliConfig, EditSnapshot>();
	const contextPath = (name: string) => {
		if (!CliConfigNameSchema.safeParse(name).success) throw new CliConfigError('Invalid context name');
		return join(directory, `${prefix}${name}${extension}`);
	};
	async function contextFiles(): Promise<Set<string>> {
		try {
			const entries = await readdir(directory, { withFileTypes: true });
			return new Set(
				entries.flatMap((entry) => {
					if (
						!entry.name.startsWith(prefix) ||
						!entry.name.endsWith(extension) ||
						(!entry.isFile() && !entry.isSymbolicLink())
					)
						return [];
					const name = entry.name.slice(prefix.length, -extension.length);
					return CliConfigNameSchema.safeParse(name).success ? [name] : [];
				}),
			);
		} catch (error) {
			if (code(error) === 'ENOENT') return new Set();
			throw new CliConfigError('Unable to enumerate context files');
		}
	}
	const store: FileCliConfigStore = {
		async load(options = {}) {
			const base = await readLayer(basePath, 'base', true);
			const selected = options.context ?? base.layer.currentContext ?? 'local';
			const overlayPath = contextPath(selected);
			const files = await contextFiles();
			const overlay = await readLayer(overlayPath, 'context', selected === 'local');
			// The selected layer's read is authoritative over the earlier directory snapshot.
			if (overlay.revision !== null) files.add(selected);
			else files.delete(selected);
			const contexts = Object.fromEntries(
				[...new Set(['local', ...files, selected])].map((name) => [
					name,
					name === selected ? overlay.layer : { services: {}, defaults: {} },
				]),
			);
			const config = parseCliConfig({ ...base.layer, contexts });
			snapshots.set(config, { config: structuredClone(config), selected, base, overlay, files });
			return config;
		},
		async save(input) {
			try {
				const snapshot = snapshots.get(input);
				if (!snapshot) throw new CliConfigError('Save requires an edit snapshot returned by this store.load');
				const next = parseCliConfig(input);
				const before = snapshot.config;
				const changes: Change[] = [];
				const previousRoot = globals(before);
				const nextRoot = globals(next);
				if (!isDeepStrictEqual(previousRoot, nextRoot)) {
					if (!isDeepStrictEqual({ ...previousRoot, currentContext: next.currentContext }, nextRoot))
						throw new CliConfigError('Only currentContext can be edited in the base configuration');
					if (next.currentContext !== snapshot.selected || !Object.hasOwn(next.contexts, next.currentContext))
						throw new CliConfigError('Load the target context before changing currentContext');
					changes.push({ ...snapshot.base, layer: { ...snapshot.base.layer, currentContext: next.currentContext } });
				}
				for (const name of new Set([...Object.keys(before.contexts), ...Object.keys(next.contexts)])) {
					const existed = Object.hasOwn(before.contexts, name);
					const exists = Object.hasOwn(next.contexts, name);
					const creating = snapshot.createContext === name;
					if (!creating && existed && exists && isDeepStrictEqual(before.contexts[name], next.contexts[name])) continue;
					const destination = contextPath(name);
					if (!creating && existed && name !== snapshot.selected)
						throw new CliConfigError('Cannot edit an unloaded context; load the target context first');
					if (!exists && (name === before.currentContext || !snapshot.files.has(name)))
						throw new CliConfigError('Cannot remove the current context or a context without a file');
					changes.push({
						path: destination,
						kind: 'context',
						layer: exists ? next.contexts[name] : null,
						revision: existed && !creating ? snapshot.overlay.revision : null,
					});
				}
				if (changes.length > 1) throw new CliConfigError('Saving changes to multiple documents is not supported');
				if (!changes.length) return;
				const change = changes[0];
				// Validate every change before creating directories, locks or temporary files.
				const content = change.layer === null ? null : stringify(serializeCliConfigLayer(change.layer, change.kind));
				const verify = async () => {
					await assertRevision(snapshot.base);
					await assertRevision(snapshot.overlay);
					if (change.path !== snapshot.base.path && change.path !== snapshot.overlay.path) await assertRevision(change);
				};
				const lockPath = `${change.path}.lock`;
				const temporary = `${change.path}.${randomUUID()}.tmp`;
				let temporaryIdentity: { dev: number; ino: number } | undefined;
				await mkdir(directory, { recursive: true, mode: 0o700 });
				let lock;
				try {
					lock = await open(lockPath, 'wx', 0o600);
				} catch (error) {
					throw layerError(
						change.path,
						change.kind,
						code(error) === 'EEXIST' ? 'Configuration is busy (lock exists)' : 'Unable to acquire configuration lock',
					);
				}
				try {
					await lock.writeFile(randomUUID());
					await verify();
					if (content === null) {
						await unlink(change.path);
					} else {
						const file = await open(temporary, 'wx', 0o600);
						try {
							const { dev, ino } = await file.stat();
							temporaryIdentity = { dev, ino };
							await file.writeFile(content, 'utf8');
						} finally {
							await file.close();
						}
						await verify();
						await rename(temporary, change.path);
						temporaryIdentity = undefined;
					}
					const updated = content === null ? null : revision(content);
					const files = new Set(snapshot.files);
					if (snapshot.createContext) files.add(snapshot.createContext);
					for (const name of Object.keys(next.contexts)) if (!Object.hasOwn(before.contexts, name)) files.add(name);
					for (const name of Object.keys(before.contexts)) if (!Object.hasOwn(next.contexts, name)) files.delete(name);
					if (change.path === snapshot.overlay.path && content !== null) files.add(snapshot.selected);
					snapshots.set(input, {
						...snapshot,
						config: structuredClone(next),
						files,
						base:
							change.path === snapshot.base.path
								? { ...snapshot.base, layer: change.layer ?? snapshot.base.layer, revision: updated }
								: snapshot.base,
						overlay:
							change.path === snapshot.overlay.path
								? { ...snapshot.overlay, layer: change.layer ?? { services: {}, defaults: {} }, revision: updated }
								: snapshot.overlay,
					});
				} catch (error) {
					if (error instanceof CliConfigError) throw error;
					throw layerError(change.path, change.kind, 'Unable to save configuration');
				} finally {
					try {
						if (temporaryIdentity) {
							const current = await lstat(temporary).catch((error: unknown) => {
								if (code(error) === 'ENOENT') return undefined;
								throw error;
							});
							if (current?.dev === temporaryIdentity.dev && current.ino === temporaryIdentity.ino)
								await rm(temporary, { force: true });
						}
					} finally {
						try {
							const owned = await lock.stat();
							const current = await lstat(lockPath).catch((error: unknown) => {
								if (code(error) === 'ENOENT') return undefined;
								throw error;
							});
							if (current?.dev === owned.dev && current.ino === owned.ino) await unlink(lockPath);
						} finally {
							await lock.close();
						}
					}
				}
			} catch (error) {
				if (error instanceof CliConfigError) throw error;
				throw new CliConfigError('Unable to save configuration');
			}
		},
		async createContext(name, options) {
			contextPath(name);
			const config = await store.load(options);
			const snapshot = snapshots.get(config);
			if (!snapshot) throw new CliConfigError('Missing configuration edit snapshot');
			if (snapshot.files.has(name)) throw new CliConfigError('Context file already exists');
			Object.defineProperty(config.contexts, name, {
				value: { services: {}, defaults: {} },
				enumerable: true,
				configurable: true,
				writable: true,
			});
			snapshots.set(config, { ...snapshot, createContext: name });
			try {
				await store.save(config);
			} finally {
				snapshots.delete(config);
			}
		},
	};
	return store;
}
