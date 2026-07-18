'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FileManagerFileStat } from '../file-manager';
import type { WindowManagerCapabilities, WindowManagerOpenOptions, WindowManagerStore } from '../window-manager';
import { DirectoryPicker, FilePicker, SaveFilePicker } from './file-picker';
import type {
	DirectoryPickerProps,
	DirectoryPickerResult,
	FilePickerMode,
	FilePickerProps,
	SaveFilePickerProps,
	SaveFilePickerResult,
} from './file-picker-types';

export const FILE_PICKER_WINDOW_KIND = 'file-picker';

type PickerWindowOptions = Omit<
	WindowManagerOpenOptions,
	'capabilities' | 'data' | 'duplicate' | 'id' | 'key' | 'kind' | 'persistence' | 'title'
> & { capabilities?: Omit<Partial<WindowManagerCapabilities>, 'close'>; title?: string };

type ShowFilePickerBaseOptions = Omit<FilePickerProps, 'onCancel' | 'onConfirm'> & {
	window?: PickerWindowOptions;
	windowManager: WindowManagerStore;
};

export type ShowFilePickerOptions = ShowFilePickerBaseOptions & { multiple?: false };
export type ShowMultipleFilePickerOptions = ShowFilePickerBaseOptions & { multiple: true };
export type ShowDirectoryPickerOptions = Omit<DirectoryPickerProps, 'onCancel' | 'onConfirm'> & {
	window?: PickerWindowOptions;
	windowManager: WindowManagerStore;
};
export type ShowSaveFilePickerOptions = Omit<SaveFilePickerProps, 'onCancel' | 'onConfirm'> & {
	window?: PickerWindowOptions;
	windowManager: WindowManagerStore;
};

export type FilePickerWindowData =
	| { mode: 'directory'; picker: DirectoryPickerProps; type: typeof FILE_PICKER_WINDOW_KIND }
	| { mode: 'open'; picker: FilePickerProps; type: typeof FILE_PICKER_WINDOW_KIND }
	| { mode: 'save'; picker: SaveFilePickerProps; type: typeof FILE_PICKER_WINDOW_KIND };

export type FilePickerWindowDescriptor = { data?: unknown; kind: string };

let pickerWindowSequence = 0;

export function showFilePicker(options: ShowMultipleFilePickerOptions): Promise<FileManagerFileStat[] | undefined>;
export function showFilePicker(options: ShowFilePickerOptions): Promise<FileManagerFileStat | undefined>;
export function showFilePicker(
	options: ShowFilePickerOptions | ShowMultipleFilePickerOptions,
): Promise<FileManagerFileStat | FileManagerFileStat[] | undefined> {
	const { windowManager, window, ...picker } = options;
	const common = { mode: 'open' as const, picker, title: window?.title ?? '打开文件', window, windowManager };
	return options.multiple
		? showPickerWindow<FileManagerFileStat[]>({ ...common, validateResult: isFileStatArray })
		: showPickerWindow<FileManagerFileStat>({ ...common, validateResult: isFileStat });
}

export function showDirectoryPicker(options: ShowDirectoryPickerOptions): Promise<DirectoryPickerResult | undefined> {
	const { windowManager, window, ...picker } = options;
	return showPickerWindow({
		mode: 'directory',
		picker,
		title: window?.title ?? '选择文件夹',
		window,
		windowManager,
		validateResult: isDirectoryResult,
	});
}

export function showSaveFilePicker(options: ShowSaveFilePickerOptions): Promise<SaveFilePickerResult | undefined> {
	const { windowManager, window, ...picker } = options;
	return showPickerWindow({
		mode: 'save',
		picker,
		title: window?.title ?? '保存文件',
		window,
		windowManager,
		validateResult: isSaveResult,
	});
}

export function renderFilePickerWindow(window: FilePickerWindowDescriptor): ReactNode {
	return window.kind === FILE_PICKER_WINDOW_KIND && isFilePickerWindowData(window.data) ? (
		<FilePickerWindow data={window.data} />
	) : null;
}

export function FilePickerWindow({ data }: { data: FilePickerWindowData }) {
	const props = {
		...data.picker,
		className: cn('size-full min-h-0 rounded-none border-0', data.picker.className),
		showHeader: data.picker.showHeader ?? false,
	};
	if (data.mode === 'directory') return <DirectoryPicker {...(props as DirectoryPickerProps)} />;
	if (data.mode === 'save') return <SaveFilePicker {...(props as SaveFilePickerProps)} />;
	return <FilePicker {...(props as FilePickerProps)} />;
}

function showPickerWindow<Result>({
	mode,
	picker,
	title,
	validateResult,
	window,
	windowManager,
}: {
	mode: FilePickerMode;
	picker: Omit<DirectoryPickerProps | FilePickerProps | SaveFilePickerProps, 'onCancel' | 'onConfirm'>;
	title: string;
	validateResult: (value: unknown) => value is Result;
	window?: PickerWindowOptions;
	windowManager: WindowManagerStore;
}): Promise<Result | undefined> {
	const id = createPickerWindowId();
	return new Promise<Result | undefined>((resolve, reject) => {
		let activeId = id;
		let opened = false;
		let settled = false;
		let unsubscribeEvents: () => void = () => {};
		let unsubscribeState: () => void = () => {};
		const settle = (result: Result | undefined) => {
			if (settled) return;
			settled = true;
			unsubscribeEvents();
			unsubscribeState();
			resolve(result);
		};
		unsubscribeEvents = windowManager.subscribeEvents((event) => {
			if (event.type !== 'closed' || event.id !== activeId) return;
			settle(validateResult(event.result) ? event.result : undefined);
		});
		unsubscribeState = windowManager.subscribe((state) => {
			const exists = Boolean(state.windows[activeId]);
			if (exists) opened = true;
			if (!opened || exists || settled) return;
			queueMicrotask(() => {
				if (!settled && !windowManager.getState().windows[activeId]) settle(undefined);
			});
		});
		const actions = windowManager.getState().actions;
		const close = (result?: Result) => actions.close(activeId, result);
		const data = {
			mode,
			picker: {
				...picker,
				onCancel: () => {
					close();
				},
				onConfirm: (result: Result) => {
					close(result);
				},
			},
			type: FILE_PICKER_WINDOW_KIND,
		} as unknown as FilePickerWindowData;
		try {
			activeId = actions.open({
				icon: mode === 'save' ? 'save' : 'folder-open',
				showInDock: true,
				...window,
				bounds: { width: 920, height: 640, ...window?.bounds },
				capabilities: { ...window?.capabilities, close: true },
				data,
				duplicate: 'allow',
				id,
				key: id,
				kind: FILE_PICKER_WINDOW_KIND,
				persistence: 'none',
				size: { minWidth: 560, minHeight: 440, ...window?.size },
				title,
			});
			opened = Boolean(windowManager.getState().windows[activeId]);
		} catch (error) {
			if (!settled) {
				settled = true;
				unsubscribeEvents();
				unsubscribeState();
				reject(error);
			}
		}
	});
}

function createPickerWindowId(): string {
	pickerWindowSequence += 1;
	return `file-picker-${Date.now().toString(36)}-${pickerWindowSequence.toString(36)}`;
}

function isFilePickerWindowData(value: unknown): value is FilePickerWindowData {
	if (!isRecord(value) || value.type !== FILE_PICKER_WINDOW_KIND) return false;
	if (value.mode !== 'open' && value.mode !== 'directory' && value.mode !== 'save') return false;
	if (!isRecord(value.picker) || !isFileSystem(value.picker.fileSystem)) return false;
	if (value.picker.accept !== undefined && !isAccept(value.picker.accept)) return false;
	if (value.picker.messages !== undefined && !isMessages(value.picker.messages)) return false;
	if (value.picker.multiple !== undefined && typeof value.picker.multiple !== 'boolean') return false;
	if (value.picker.suggestedName !== undefined && typeof value.picker.suggestedName !== 'string') return false;
	return typeof value.picker.onCancel === 'function' && typeof value.picker.onConfirm === 'function';
}

function isFileSystem(value: unknown): boolean {
	if (!isRecord(value)) return false;
	return ['copy', 'exists', 'mkdir', 'readFile', 'readdir', 'rename', 'rm', 'stat', 'writeFile'].every(
		(method) => typeof value[method] === 'function',
	);
}

function isFileStat(value: unknown): value is FileManagerFileStat {
	return (
		isRecord(value) &&
		value.kind === 'file' &&
		typeof value.path === 'string' &&
		typeof value.name === 'string' &&
		typeof value.directory === 'string' &&
		isRecord(value.meta) &&
		typeof value.mtime === 'number' &&
		Number.isFinite(value.mtime) &&
		typeof value.size === 'number' &&
		Number.isFinite(value.size)
	);
}

function isFileStatArray(value: unknown): value is FileManagerFileStat[] {
	return Array.isArray(value) && value.length > 0 && value.every(isFileStat);
}

function isDirectoryResult(value: unknown): value is DirectoryPickerResult {
	return isRecord(value) && value.kind === 'directory' && typeof value.path === 'string';
}

function isSaveResult(value: unknown): value is SaveFilePickerResult {
	return (
		isRecord(value) &&
		value.kind === 'file' &&
		typeof value.path === 'string' &&
		typeof value.name === 'string' &&
		typeof value.directory === 'string' &&
		(value.existing === undefined || isFileStat(value.existing))
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isAccept(value: unknown): boolean {
	return (
		Array.isArray(value) &&
		value.every(
			(group) =>
				isRecord(group) &&
				(group.description === undefined || typeof group.description === 'string') &&
				isRecord(group.accept) &&
				Object.entries(group.accept).every(
					([mime, extensions]) =>
						mime.length > 0 && Array.isArray(extensions) && extensions.every((item) => typeof item === 'string'),
				),
		)
	);
}

function isMessages(value: unknown): boolean {
	if (!isRecord(value)) return false;
	return Object.entries(value).every(([key, item]) =>
		key === 'overwriteDescription' ? typeof item === 'function' : typeof item === 'string',
	);
}
