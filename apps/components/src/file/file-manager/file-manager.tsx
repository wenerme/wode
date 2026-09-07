'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { FileManagerProvider, useFileManagerActions } from './file-manager-context';
import type { FileManagerRegistry } from '@components/file-type-registry/file-manager-file-type-types';
import { FileManagerRegistryProvider, useFileManagerRegistry } from '@components/file-viewer/file-manager-registry';
import { FileManagerRuntime, type FileManagerRuntimeProps } from './file-manager-runtime';
import { FileManagerSurface, type FileManagerSurfaceProps } from './file-manager-surface';
import { createFileManagerStore } from './file-manager-store';
import type {
	FileManagerAddressBarRenderProps,
	FileManagerCapabilities,
	FileManagerEvent,
	FileManagerFileStat,
	FileManagerFileSystem,
	FileManagerPlace,
	FileManagerPreviewRenderProps,
	FileManagerStore,
	FileManagerViewMode,
} from './file-manager-types';

export type FileManagerProps = Omit<ComponentPropsWithRef<'section'>, 'onError' | 'title'> & {
	capabilities?: Partial<FileManagerCapabilities>;
	emptyState?: ReactNode;
	fileSystem: FileManagerFileSystem;
	filterEntry?: (entry: FileManagerFileStat) => boolean;
	footer?: ReactNode;
	initialPath?: string;
	manager?: FileManagerRegistry;
	maxDownloadBytes?: number;
	maxDownloadTotalBytes?: number;
	maxListingEntries?: number;
	maxPreviewBytes?: number;
	maxUploadBytes?: number;
	maxUploadFiles?: number;
	maxUploadTotalBytes?: number;
	onActivateEntry?: (entry: FileManagerFileStat) => void;
	onDownload?: FileManagerRuntimeProps['onDownload'];
	onEvent?: (event: FileManagerEvent) => void;
	onOpenFile?: FileManagerRuntimeProps['onOpenFile'];
	places?: FileManagerPlace[];
	readOnly?: boolean;
	renderAddressBar?: (props: FileManagerAddressBarRenderProps) => ReactNode;
	renderPreview?: (props: FileManagerPreviewRenderProps) => ReactNode;
	rootPath?: string;
	selectionMode?: 'multiple' | 'single';
	showHeader?: boolean;
	showFileTree?: boolean;
	surfaceVariant?: FileManagerSurfaceVariant;
	store?: FileManagerStore;
	title?: ReactNode;
	treeDirectoriesOnly?: boolean;
	viewMode?: FileManagerViewMode;
};

export type FileManagerSurfaceVariant = 'workspace' | 'embedded';
export { FileManagerSurface } from './file-manager-surface';

export function FileManager({
	capabilities,
	className,
	emptyState,
	fileSystem,
	filterEntry,
	footer,
	initialPath,
	manager: managerOverride,
	maxDownloadBytes,
	maxDownloadTotalBytes,
	maxListingEntries,
	maxPreviewBytes,
	maxUploadBytes,
	maxUploadFiles,
	maxUploadTotalBytes,
	onActivateEntry,
	onDownload,
	onEvent,
	onOpenFile,
	places,
	readOnly = false,
	renderAddressBar,
	renderPreview,
	rootPath = '/',
	selectionMode = 'multiple',
	showHeader = true,
	showFileTree = true,
	surfaceVariant = 'workspace',
	store,
	title = '文件管理器',
	treeDirectoriesOnly = false,
	viewMode,
	...props
}: FileManagerProps) {
	const manager = useFileManagerRegistry(managerOverride);
	const resolvedCapabilities = resolveFileManagerCapabilities(capabilities, readOnly);
	const [localStore] = useState(
		() =>
			store ??
			createFileManagerStore({
				capabilities: resolvedCapabilities,
				fileSystem,
				initialPath,
				rootPath,
				viewMode,
			}),
	);
	const surfaceProps: FileManagerSurfaceProps = {
		className,
		emptyState,
		filterEntry,
		footer,
		maxPreviewBytes,
		onActivateEntry,
		places,
		renderAddressBar,
		renderPreview,
		selectionMode,
		showHeader,
		showFileTree,
		surfaceVariant,
		title,
		treeDirectoriesOnly,
		...props,
	};
	return (
		<FileManagerRegistryProvider manager={manager}>
			<FileManagerProvider store={store ?? localStore}>
				<FileManagerConfiguration capabilities={resolvedCapabilities} />
				<FileManagerRuntime
					fileSystem={fileSystem}
					initialPath={initialPath}
					maxDownloadBytes={maxDownloadBytes}
					maxDownloadTotalBytes={maxDownloadTotalBytes}
					maxListingEntries={maxListingEntries}
					maxUploadBytes={maxUploadBytes}
					maxUploadFiles={maxUploadFiles}
					maxUploadTotalBytes={maxUploadTotalBytes}
					rootPath={rootPath}
					onDownload={onDownload}
					onEvent={onEvent}
					onOpenFile={onOpenFile}
				/>
				<FileManagerSurface {...surfaceProps} />
			</FileManagerProvider>
		</FileManagerRegistryProvider>
	);
}

function FileManagerConfiguration({ capabilities }: { capabilities: FileManagerCapabilities }) {
	const actions = useFileManagerActions();
	useEffect(() => actions.setCapabilities(capabilities), [actions, capabilities]);
	return null;
}

function resolveFileManagerCapabilities(
	capabilities: Partial<FileManagerCapabilities> | undefined,
	readOnly: boolean,
): FileManagerCapabilities {
	const defaults: FileManagerCapabilities = {
		copy: true,
		createDirectory: true,
		createFile: true,
		delete: true,
		download: true,
		edit: true,
		move: true,
		preview: true,
		rename: true,
		upload: true,
	};
	const resolved = { ...defaults, ...capabilities };
	if (!readOnly) return resolved;
	return {
		...resolved,
		copy: false,
		createDirectory: false,
		createFile: false,
		delete: false,
		edit: false,
		move: false,
		rename: false,
		upload: false,
	};
}
