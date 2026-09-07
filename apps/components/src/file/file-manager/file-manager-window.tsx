'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FileManager, type FileManagerProps } from './file-manager';

export const FILE_MANAGER_WINDOW_KIND = 'file-manager';

export type FileManagerWindowOpenOptions = {
	bounds?: { height?: number; width?: number; x?: number; y?: number };
	capabilities?: Partial<{
		close: boolean;
		fullscreen: boolean;
		maximize: boolean;
		minimize: boolean;
		move: boolean;
		resize: boolean;
	}>;
	chrome?: 'default' | 'none';
	duplicate?: 'focus-existing' | 'replace' | 'allow';
	icon?: string;
	id?: string;
	key?: string;
	mode?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
	pinned?: boolean;
	showInDock?: boolean;
	size?: { maxHeight?: number; maxWidth?: number; minHeight?: number; minWidth?: number };
	title?: string;
};

export type FileManagerWindowActions = {
	open: (options: {
		bounds?: FileManagerWindowOpenOptions['bounds'];
		capabilities?: FileManagerWindowOpenOptions['capabilities'];
		chrome?: FileManagerWindowOpenOptions['chrome'];
		data: FileManagerWindowData;
		duplicate?: FileManagerWindowOpenOptions['duplicate'];
		icon?: string;
		id?: string;
		key?: string;
		kind: typeof FILE_MANAGER_WINDOW_KIND;
		mode?: FileManagerWindowOpenOptions['mode'];
		persistence: 'none';
		pinned?: boolean;
		showInDock?: boolean;
		size?: FileManagerWindowOpenOptions['size'];
		title: string;
	}) => string;
};

export type ShowFileManagerOptions = {
	fileManager: FileManagerProps;
	window?: FileManagerWindowOpenOptions;
	windowManager: FileManagerWindowActions;
};

export type FileManagerWindowDescriptor = {
	data?: unknown;
	kind: string;
};

export type FileManagerWindowData = {
	fileManager: FileManagerProps;
	type: typeof FILE_MANAGER_WINDOW_KIND;
};

export function showFileManager({ fileManager, window, windowManager }: ShowFileManagerOptions): string {
	const { bounds, size, title: windowTitle, ...windowOptions } = window ?? {};
	const title = windowTitle ?? (typeof fileManager.title === 'string' ? fileManager.title : '文件管理器');
	return windowManager.open({
		key: FILE_MANAGER_WINDOW_KIND,
		icon: 'folder',
		duplicate: 'focus-existing',
		showInDock: true,
		...windowOptions,
		bounds: { width: 960, height: 640, ...bounds },
		data: { type: FILE_MANAGER_WINDOW_KIND, fileManager },
		kind: FILE_MANAGER_WINDOW_KIND,
		persistence: 'none',
		size: { minWidth: 560, minHeight: 420, ...size },
		title,
	});
}

export function renderFileManagerWindow(window: FileManagerWindowDescriptor): ReactNode {
	return isFileManagerWindowData(window.data) && window.kind === FILE_MANAGER_WINDOW_KIND ? (
		<FileManagerWindow data={window.data} />
	) : null;
}

export function FileManagerWindow({ className, data }: { className?: string; data: FileManagerWindowData }) {
	return (
		<FileManager
			{...data.fileManager}
			className={cn('size-full min-h-0 rounded-none border-0', data.fileManager.className, className)}
			showHeader={data.fileManager.showHeader ?? false}
		/>
	);
}

function isFileManagerWindowData(value: unknown): value is FileManagerWindowData {
	if (typeof value !== 'object' || value === null || (value as { type?: unknown }).type !== FILE_MANAGER_WINDOW_KIND)
		return false;
	const fileManager = (value as { fileManager?: unknown }).fileManager;
	if (typeof fileManager !== 'object' || fileManager === null) return false;
	const fileSystem = (fileManager as { fileSystem?: unknown }).fileSystem;
	if (typeof fileSystem !== 'object' || fileSystem === null) return false;
	const methods = fileSystem as Record<string, unknown>;
	return ['copy', 'exists', 'mkdir', 'readFile', 'readdir', 'rename', 'rm', 'stat', 'writeFile'].every(
		(method) => typeof methods[method] === 'function',
	);
}
