'use client';

import { createContext, type PropsWithChildren, type ReactNode, useContext, useState } from 'react';
import type {
	CreateFileManagerOptions,
	FileManagerFileTypeDefinition,
	FileManagerFileTypeInput,
	FileManagerFileTypeMatchInput,
	FileManagerFileTypeRegistry,
	FileManagerFileTypeRenderer,
	FileManagerRegistry,
} from './file-manager-file-type-types';

const FileManagerRegistryContext = createContext<FileManagerRegistry | null>(null);
let globalFileManager: FileManagerRegistry | undefined;
let builtinDefinitions: readonly FileManagerFileTypeDefinition[] = [];

export type FileManagerRegistryProviderProps = PropsWithChildren<{
	definitions?: Iterable<FileManagerFileTypeDefinition>;
	manager?: FileManagerRegistry;
}>;

export function createFileManager(
	options?: CreateFileManagerOptions,
	parent?: FileManagerRegistry,
): FileManagerRegistry;
export function createFileManager(parent: FileManagerRegistry): FileManagerRegistry;
export function createFileManager(
	optionsOrParent: CreateFileManagerOptions | FileManagerRegistry | undefined = {},
	parentOverride?: FileManagerRegistry,
): FileManagerRegistry {
	const value = optionsOrParent ?? {};
	const options = isFileManagerRegistry(value) ? {} : value;
	const parent = parentOverride ?? (isFileManagerRegistry(value) ? value : options.parent);
	const manager = new FileManagerRegistryImpl(parent);
	if (options.includeBuiltins ?? !parent) {
		for (const definition of builtinDefinitions) manager.fileTypes.register(definition);
	}
	for (const definition of options.definitions ?? []) manager.fileTypes.register(definition);
	return manager;
}

export function getFileManager(): FileManagerRegistry {
	globalFileManager ??= createFileManager();
	return globalFileManager;
}

export function getBuiltinFileManagerFileType(id: string): FileManagerFileTypeDefinition | undefined {
	return builtinDefinitions.find((definition) => definition.id === id);
}

export function setFileManagerBuiltinDefinitions(definitions: Iterable<FileManagerFileTypeDefinition>) {
	builtinDefinitions = Object.freeze([...definitions]);
	globalFileManager = undefined;
}

export function FileManagerRegistryProvider({ children, definitions, manager }: FileManagerRegistryProviderProps) {
	const inherited = useContext(FileManagerRegistryContext);
	const [localManager] = useState(() => {
		if (manager) return manager;
		if (definitions) return createFileManager({ definitions, parent: inherited ?? getFileManager() });
		return inherited ?? getFileManager();
	});
	return (
		<FileManagerRegistryContext.Provider value={manager ?? localManager}>
			{children}
		</FileManagerRegistryContext.Provider>
	);
}

export function useFileManagerRegistry(override?: FileManagerRegistry): FileManagerRegistry {
	const inherited = useContext(FileManagerRegistryContext);
	return override ?? inherited ?? getFileManager();
}

export function getFileManagerFileTypeLabel(
	definition: FileManagerFileTypeDefinition,
	file: FileManagerFileTypeMatchInput,
): ReactNode {
	return typeof definition.label === 'function' ? definition.label(file) : definition.label;
}

export function renderFileManagerFileType<Props extends object>(
	renderer: FileManagerFileTypeRenderer<Props>,
	props: Props,
): ReactNode {
	if (renderer.render) return renderer.render(props);
	if (renderer.component) {
		const Component = renderer.component;
		return <Component {...props} />;
	}
	return null;
}

export function FileManagerFileTypeIcon({
	className,
	file,
	manager: managerOverride,
}: {
	className?: string;
	file: FileManagerFileTypeInput;
	manager?: FileManagerRegistry;
}) {
	const manager = useFileManagerRegistry(managerOverride);
	const resolvedFile = manager.fileTypes.resolveInput(file);
	const fileType = manager.fileTypes.resolve(resolvedFile);
	const fallback = manager.fileTypes.get(resolvedFile.kind === 'directory' ? 'directory' : 'generic-file');
	const Icon = fileType?.icon ?? fallback?.icon;
	if (!fileType || !Icon) return null;
	return <Icon aria-hidden='true' className={className} file={resolvedFile} fileType={fileType} />;
}

class FileManagerRegistryImpl implements FileManagerRegistry {
	readonly fileTypes: FileManagerFileTypeRegistryImpl;

	constructor(readonly parent?: FileManagerRegistry) {
		this.fileTypes = new FileManagerFileTypeRegistryImpl(parent?.fileTypes);
	}
}

type RegisteredDefinition = {
	definition: FileManagerFileTypeDefinition;
	order: number;
	token: symbol;
};

type EffectiveDefinition = RegisteredDefinition & {
	scope: number;
};

class FileManagerFileTypeRegistryImpl implements FileManagerFileTypeRegistry {
	readonly #definitions = new Map<string, RegisteredDefinition[]>();
	#order = 0;

	constructor(private readonly parent?: FileManagerFileTypeRegistry) {}

	register(definition: FileManagerFileTypeDefinition): () => void {
		const normalized = normalizeDefinition(definition);
		const entry: RegisteredDefinition = { definition: normalized, order: ++this.#order, token: Symbol(normalized.id) };
		const stack = this.#definitions.get(normalized.id) ?? [];
		stack.push(entry);
		this.#definitions.set(normalized.id, stack);
		let registered = true;
		return () => {
			if (!registered) return;
			registered = false;
			const current = this.#definitions.get(normalized.id);
			if (!current) return;
			const index = current.findIndex((candidate) => candidate.token === entry.token);
			if (index >= 0) current.splice(index, 1);
			if (current.length === 0) this.#definitions.delete(normalized.id);
		};
	}

	get(id: string): FileManagerFileTypeDefinition | undefined {
		return this.#effective().find((entry) => entry.definition.id === id)?.definition;
	}

	list(): readonly FileManagerFileTypeDefinition[] {
		return this.#effective()
			.sort(compareDefinitions)
			.map((entry) => entry.definition);
	}

	resolve(file: FileManagerFileTypeInput): FileManagerFileTypeDefinition | undefined {
		const input = this.resolveInput(file);
		return this.#effective()
			.flatMap((entry) => {
				const score = getMatchScore(entry.definition, input);
				return score < 0 ? [] : [{ ...entry, score }];
			})
			.sort(compareMatches)[0]?.definition;
	}

	resolveInput(file: FileManagerFileTypeInput): FileManagerFileTypeMatchInput {
		const mimeType = normalizeMimeType(file.mimeType);
		const extension = normalizeExtension(file.extension ?? getRawExtension(file.name || file.path || ''));
		return Object.freeze({ ...file, extension, kind: file.kind ?? 'file', mimeType });
	}

	resolveMimeType(file: FileManagerFileTypeInput): string | undefined {
		const input = this.resolveInput(file);
		if (input.mimeType) return input.mimeType;
		const definition = this.resolve(input);
		const mimeType = typeof definition?.mimeType === 'function' ? definition.mimeType(input) : definition?.mimeType;
		return normalizeMimeType(mimeType) || undefined;
	}

	#effective(): EffectiveDefinition[] {
		const localIds = new Set(this.#definitions.keys());
		const inherited = this.parent
			? this.parent
					.list()
					.filter((definition) => !localIds.has(definition.id))
					.map((definition, index, definitions) => ({
						definition,
						order: definitions.length - index,
						scope: -1,
						token: Symbol.for(definition.id),
					}))
			: [];
		const local = [...this.#definitions.values()].flatMap((stack) => {
			const entry = stack.at(-1);
			return entry ? [{ ...entry, scope: 0 }] : [];
		});
		return [...inherited, ...local];
	}
}

function normalizeDefinition(definition: FileManagerFileTypeDefinition): FileManagerFileTypeDefinition {
	const id = definition.id.trim();
	if (!id) throw new TypeError('File type id cannot be empty');
	const priority = Number.isFinite(definition.priority) ? definition.priority : 0;
	const match = {
		extensions: normalizeUnique(definition.match.extensions, normalizeExtension),
		mimeTypes: normalizeUnique(definition.match.mimeTypes, normalizeMimeType),
		mimeWildcards: normalizeUnique(definition.match.mimeWildcards, normalizeMimeType),
		predicate: definition.match.predicate,
	};
	if (!match.extensions.length && !match.mimeTypes.length && !match.mimeWildcards.length && !match.predicate) {
		throw new TypeError(`File type ${id} requires at least one matcher`);
	}
	return Object.freeze({ ...definition, id, match: Object.freeze(match), priority });
}

function getMatchScore(definition: FileManagerFileTypeDefinition, file: FileManagerFileTypeMatchInput): number {
	const match = definition.match;
	let score = -1;
	if (file.extension && match.extensions?.includes(file.extension)) score = Math.max(score, 100);
	if (file.mimeType && match.mimeWildcards?.some((pattern) => matchWildcard(file.mimeType, pattern))) {
		score = Math.max(score, 200);
	}
	if (file.mimeType && match.mimeTypes?.includes(file.mimeType)) score = Math.max(score, 300);
	try {
		if (match.predicate?.(file)) score = Math.max(score, 400);
	} catch {
		// A consumer predicate is an optional matcher and fails closed.
	}
	return score;
}

function compareDefinitions(left: EffectiveDefinition, right: EffectiveDefinition): number {
	return (
		(right.definition.priority ?? 0) - (left.definition.priority ?? 0) ||
		right.scope - left.scope ||
		right.order - left.order ||
		left.definition.id.localeCompare(right.definition.id)
	);
}

function compareMatches(
	left: EffectiveDefinition & { score: number },
	right: EffectiveDefinition & { score: number },
): number {
	return (
		(right.definition.priority ?? 0) - (left.definition.priority ?? 0) ||
		right.score - left.score ||
		right.scope - left.scope ||
		right.order - left.order ||
		left.definition.id.localeCompare(right.definition.id)
	);
}

function normalizeUnique(
	values: readonly string[] | undefined,
	normalize: (value: string) => string,
): readonly string[] {
	return Object.freeze([...new Set((values ?? []).map(normalize).filter(Boolean))]);
}

function normalizeExtension(value: string): string {
	return value.trim().replace(/^\.+/, '').toLowerCase();
}

function normalizeMimeType(value: string | undefined): string {
	return value?.split(';', 1)[0].trim().toLowerCase() ?? '';
}

function getRawExtension(value: string): string {
	const name = value.replaceAll('\\', '/').replace(/\/+$/, '').split('/').at(-1) ?? '';
	const dot = name.lastIndexOf('.');
	return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1) : '';
}

function matchWildcard(value: string, pattern: string): boolean {
	if (!pattern.includes('*')) return value === pattern;
	const parts = pattern.split('*').filter(Boolean);
	if (!parts.length) return true;
	let offset = 0;
	let start = 0;
	let end = parts.length;
	if (!pattern.startsWith('*')) {
		if (!value.startsWith(parts[0])) return false;
		offset = parts[0].length;
		start = 1;
	}
	if (!pattern.endsWith('*')) end -= 1;
	for (let index = start; index < end; index += 1) {
		const found = value.indexOf(parts[index], offset);
		if (found < 0) return false;
		offset = found + parts[index].length;
	}
	if (pattern.endsWith('*')) return true;
	const suffix = parts.at(-1) ?? '';
	return value.endsWith(suffix) && value.length - suffix.length >= offset;
}

function isFileManagerRegistry(value: CreateFileManagerOptions | FileManagerRegistry): value is FileManagerRegistry {
	return Object.hasOwn(value, 'fileTypes');
}
