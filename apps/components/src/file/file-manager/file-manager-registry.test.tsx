import type { FileManagerFileTypeDefinition } from '@components/file-type-registry/file-manager-file-type-types';
import {
	createFileManager,
	FileManagerRegistryProvider,
	getFileManager,
	useFileManagerRegistry,
} from '@components/file-viewer/file-manager-registry';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

function definition(
	id: string,
	extension: string,
	options: Partial<FileManagerFileTypeDefinition> = {},
): FileManagerFileTypeDefinition {
	return {
		id,
		label: id,
		match: { extensions: [extension] },
		...options,
	};
}

describe('FileManager file type registry', () => {
	it('restores stack-like same-id registrations and keeps unregister idempotent', () => {
		const manager = createFileManager({ includeBuiltins: false });
		const unregisterBase = manager.fileTypes.register(definition('custom', 'one'));
		const unregisterOverride = manager.fileTypes.register(definition('custom', 'two'));
		expect(manager.fileTypes.resolve({ name: 'value.two' })?.label).toBe('custom');
		expect(manager.fileTypes.resolve({ name: 'value.one' })).toBeUndefined();

		unregisterOverride();
		unregisterOverride();
		expect(manager.fileTypes.resolve({ name: 'value.one' })?.id).toBe('custom');
		unregisterBase();
		expect(manager.fileTypes.get('custom')).toBeUndefined();
	});

	it('inherits a live parent while a child definition shadows the same id completely', () => {
		const parent = createFileManager({ includeBuiltins: false });
		parent.fileTypes.register(definition('shared', 'parent'));
		const child = createFileManager(parent);
		const unregisterChild = child.fileTypes.register(definition('shared', 'child'));
		parent.fileTypes.register(definition('later', 'live'));

		expect(child.fileTypes.resolve({ name: 'value.parent' })).toBeUndefined();
		expect(child.fileTypes.resolve({ name: 'value.child' })?.id).toBe('shared');
		expect(child.fileTypes.resolve({ name: 'value.live' })?.id).toBe('later');
		unregisterChild();
		expect(child.fileTypes.resolve({ name: 'value.parent' })?.id).toBe('shared');
	});

	it('resolves by priority, match specificity, scope, and registration order', () => {
		const parent = createFileManager({ includeBuiltins: false });
		parent.fileTypes.register({
			id: 'mime-wildcard',
			label: 'wildcard',
			match: { mimeWildcards: ['application/*+json'] },
			priority: 10,
		});
		parent.fileTypes.register({
			id: 'mime-exact',
			label: 'exact',
			match: { mimeTypes: ['application/json'] },
			priority: 10,
		});
		expect(parent.fileTypes.resolve({ name: 'value.bin', mimeType: 'Application/JSON; charset=utf-8' })?.id).toBe(
			'mime-exact',
		);
		expect(parent.fileTypes.resolve({ name: 'value.bin', mimeType: 'application/problem+json' })?.id).toBe(
			'mime-wildcard',
		);

		parent.fileTypes.register(definition('high-priority', 'bin', { priority: 20 }));
		expect(parent.fileTypes.resolve({ name: 'value.bin', mimeType: 'application/json' })?.id).toBe('high-priority');

		const child = createFileManager(parent);
		child.fileTypes.register(definition('child-late', 'same', { priority: 5 }));
		parent.fileTypes.register(definition('parent-late', 'same', { priority: 5 }));
		expect(child.fileTypes.resolve({ name: 'value.same' })?.id).toBe('child-late');

		child.fileTypes.register(definition('child-latest', 'same', { priority: 5 }));
		expect(child.fileTypes.resolve({ name: 'value.same' })?.id).toBe('child-latest');
	});

	it('provides all builtin semantic families and keeps MIME authoritative over a misleading extension', () => {
		const manager = createFileManager(undefined);
		const ids = new Set(manager.fileTypes.list().map((item) => item.id));
		expect(ids).toEqual(
			new Set([
				'archive',
				'audio',
				'code',
				'database',
				'directory',
				'document',
				'executable',
				'font',
				'generic-file',
				'image',
				'pdf',
				'sheet',
				'slide',
				'text',
				'video',
			]),
		);
		expect(manager.fileTypes.resolve({ kind: 'directory', name: 'src' })?.id).toBe('directory');
		expect(manager.fileTypes.resolve({ name: 'report.pdf', mimeType: 'text/plain' })?.id).toBe('text');
		expect(manager.fileTypes.resolve({ name: 'notes.txt', mimeType: 'video/mp4' })?.id).toBe('video');
		expect(manager.fileTypes.resolve({ name: 'schema.ts', mimeType: 'text/plain' })?.id).toBe('code');
		expect(manager.fileTypes.resolve({ name: 'budget.xlsx' })?.id).toBe('sheet');
		expect(manager.fileTypes.resolve({ name: 'unknown.data' })?.id).toBe('generic-file');
	});

	it('normalizes MIME and extension inputs and fails closed for throwing predicates', () => {
		const manager = createFileManager({ includeBuiltins: false });
		manager.fileTypes.register({
			id: 'safe',
			label: 'safe',
			match: { extensions: ['.SAFE'] },
			mimeType: 'Application/X-Safe; version=1',
		});
		manager.fileTypes.register({
			id: 'throwing',
			label: 'throwing',
			match: {
				predicate: () => {
					throw new Error('consumer failure');
				},
			},
		});
		manager.fileTypes.register({
			id: 'mutating',
			label: 'mutating',
			match: {
				predicate: (file) => {
					(file as { extension: string }).extension = 'mutated';
					return true;
				},
			},
			priority: 100,
		});
		expect(manager.fileTypes.resolve({ name: 'value.safe' })?.id).toBe('safe');
		expect(manager.fileTypes.resolveMimeType({ name: 'value.safe' })).toBe('application/x-safe');
		expect(manager.fileTypes.resolve({ name: 'value.other' })).toBeUndefined();
	});

	it('exposes one lazy app-global manager and a scoped React override', () => {
		expect(getFileManager()).toBe(getFileManager());
		const scoped = createFileManager({ includeBuiltins: false });
		scoped.fileTypes.register(definition('scoped', 'scope'));
		function Probe() {
			return <span>{useFileManagerRegistry().fileTypes.resolve({ name: 'value.scope' })?.id}</span>;
		}
		const markup = renderToStaticMarkup(
			<FileManagerRegistryProvider manager={scoped}>
				<Probe />
			</FileManagerRegistryProvider>,
		);
		expect(markup).toContain('<span>scoped</span>');
	});
});
