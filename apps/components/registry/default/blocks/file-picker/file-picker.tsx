'use client';

import { FolderOpen, Save, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { LeftCenterRightLayout } from '@/components/ui/left-center-right-layout';
import { createFileManagerStore, FileManager, type FileManagerStore } from '../file-manager';
import { FilePickerProvider, useFilePickerActions, useFilePickerStore } from './file-picker-context';
import { matchesFilePickerAccept } from './file-picker-model';
import { FilePickerRuntime } from './file-picker-runtime';
import { createFilePickerStore } from './file-picker-store';
import type {
	DirectoryPickerProps,
	FilePickerAcceptType,
	FilePickerCoreProps,
	FilePickerMessages,
	FilePickerProps,
	SaveFilePickerProps,
} from './file-picker-types';

const defaultMessages: FilePickerMessages = {
	cancel: '取消',
	confirmDirectory: '选择文件夹',
	confirmOpen: '打开',
	confirmSave: '保存',
	emptyDirectory: '当前目录没有子目录',
	emptyFiles: '没有符合条件的文件',
	fileName: '文件名',
	fileType: '文件类型',
	noFile: '请选择文件',
	openingDirectory: '正在打开目录…',
	overwrite: '替换',
	overwriteDescription: (name) => `“${name}”已存在。是否替换现有文件？`,
	overwriteTitle: '确认替换文件',
	savingTarget: '正在检查保存目标…',
};

export function FilePicker(props: FilePickerProps) {
	if (props.multiple) {
		const { onConfirm, ...pickerProps } = props;
		return (
			<FilePickerCore
				{...pickerProps}
				mode='open'
				onConfirm={(result) => onConfirm(result as Parameters<typeof onConfirm>[0])}
			/>
		);
	}
	const { onConfirm, ...pickerProps } = props;
	return (
		<FilePickerCore
			{...pickerProps}
			mode='open'
			onConfirm={(result) => onConfirm(result as Parameters<typeof onConfirm>[0])}
		/>
	);
}

export function DirectoryPicker(props: DirectoryPickerProps) {
	const { onConfirm, ...pickerProps } = props;
	return (
		<FilePickerCore
			{...pickerProps}
			mode='directory'
			multiple={false}
			onConfirm={(result) => onConfirm(result as Parameters<typeof onConfirm>[0])}
		/>
	);
}

export function SaveFilePicker(props: SaveFilePickerProps) {
	const { onConfirm, ...pickerProps } = props;
	return (
		<FilePickerCore
			{...pickerProps}
			mode='save'
			multiple={false}
			onConfirm={(result) => onConfirm(result as Parameters<typeof onConfirm>[0])}
		/>
	);
}

function FilePickerCore({
	accept,
	allowCreateDirectory = true,
	fileSystem,
	messages: messageOverrides,
	mode,
	multiple = false,
	onCancel,
	onConfirm,
	preview = true,
	showHeader = true,
	suggestedName,
	title,
	...fileManagerProps
}: FilePickerCoreProps) {
	const pickerCapabilities = createPickerCapabilities(allowCreateDirectory, preview);
	const [managerStore] = useState(() =>
		createFileManagerStore({
			capabilities: pickerCapabilities,
			fileSystem,
			initialPath: fileManagerProps.initialPath,
			rootPath: fileManagerProps.rootPath,
			viewMode: fileManagerProps.viewMode,
		}),
	);
	const [pickerStore] = useState(() => createFilePickerStore({ suggestedName }));
	const messages = useMemo(() => ({ ...defaultMessages, ...messageOverrides }), [messageOverrides]);
	return (
		<FilePickerProvider store={pickerStore}>
			<FilePickerRuntime
				accept={accept}
				fileManagerStore={managerStore}
				fileSystem={fileSystem}
				messages={messages}
				mode={mode}
				multiple={multiple}
				onCancel={onCancel}
				onConfirm={onConfirm}
				pickerStore={pickerStore}
			/>
			<FilePickerWorkspace
				{...fileManagerProps}
				accept={accept}
				capabilities={pickerCapabilities}
				fileSystem={fileSystem}
				managerStore={managerStore}
				messages={messages}
				mode={mode}
				multiple={multiple}
				showHeader={showHeader}
				title={title}
			/>
		</FilePickerProvider>
	);
}

function FilePickerWorkspace({
	accept,
	capabilities,
	fileSystem,
	managerStore,
	messages,
	mode,
	multiple = false,
	showHeader,
	title,
	...props
}: Omit<FilePickerCoreProps, 'onCancel' | 'onConfirm' | 'suggestedName'> & {
	capabilities: ReturnType<typeof createPickerCapabilities>;
	managerStore: FileManagerStore;
	messages: FilePickerMessages;
}) {
	const actions = useFilePickerActions();
	const acceptIndex = useFilePickerStore((state) => state.filter.acceptIndex);
	const safeAcceptIndex = accept?.length ? Math.min(acceptIndex, accept.length - 1) : 0;
	const activeAccept = accept?.[safeAcceptIndex];
	const acceptedTypes = useMemo(() => (activeAccept ? [activeAccept] : accept), [accept, activeAccept]);
	useEffect(() => {
		if (acceptIndex !== safeAcceptIndex) actions.setAcceptIndex(safeAcceptIndex);
	}, [acceptIndex, actions, safeAcceptIndex]);
	const filterEntry = useMemo(
		() =>
			mode === 'directory'
				? (entry: Parameters<typeof matchesFilePickerAccept>[0]) => entry.kind === 'directory'
				: (entry: Parameters<typeof matchesFilePickerAccept>[0]) => matchesFilePickerAccept(entry, acceptedTypes),
		[acceptedTypes, mode],
	);
	const listingEntries = useStore(managerStore, (state) => state.listing.entries);
	const selectedPaths = useStore(managerStore, (state) => state.selection.paths);
	useEffect(() => {
		const allowed = new Set(listingEntries.filter(filterEntry).map((entry) => entry.path));
		const next = selectedPaths.filter((path) => allowed.has(path));
		if (next.length !== selectedPaths.length) managerStore.getState().actions.selectAll(next);
	}, [filterEntry, listingEntries, managerStore, selectedPaths]);
	const emptyState = (
		<div className='grid min-h-full place-items-center p-6 text-center'>
			<div>
				<FolderOpen className='text-base-content/30 mx-auto size-9' />
				<div className='mt-2 text-sm font-medium'>
					{mode === 'directory' ? messages.emptyDirectory : messages.emptyFiles}
				</div>
			</div>
		</div>
	);
	return (
		<>
			<FileManager
				{...props}
				capabilities={capabilities}
				emptyState={emptyState}
				fileSystem={fileSystem}
				filterEntry={filterEntry}
				footer={
					<FilePickerFooter
						accept={accept}
						acceptIndex={safeAcceptIndex}
						managerStore={managerStore}
						messages={messages}
						mode={mode}
						multiple={multiple}
					/>
				}
				onOpenFile={(entry) => {
					if (mode === 'save') actions.setName(entry.name);
					actions.confirm();
				}}
				onActivateEntry={(entry) => {
					if (entry.kind === 'directory') actions.beginNavigation();
				}}
				selectionMode={mode === 'open' && multiple ? 'multiple' : 'single'}
				showHeader={showHeader}
				store={managerStore}
				title={title ?? getDefaultTitle(mode, multiple)}
			/>
			<FilePickerOverwriteDialog messages={messages} />
		</>
	);
}

function FilePickerFooter({
	accept,
	acceptIndex,
	managerStore,
	messages,
	mode,
	multiple,
}: {
	accept?: FilePickerCoreProps['accept'];
	acceptIndex: number;
	managerStore: FileManagerStore;
	messages: FilePickerMessages;
	mode: FilePickerCoreProps['mode'];
	multiple: boolean;
}) {
	const actions = useFilePickerActions();
	const name = useFilePickerStore((state) => state.input.name);
	const request = useFilePickerStore((state) => state.request);
	const navigationPending = useFilePickerStore((state) => state.navigation.pending);
	const fileManager = useStore(managerStore, (state) => state);
	const selectedEntries = fileManager.listing.entries.filter((entry) =>
		fileManager.selection.paths.includes(entry.path),
	);
	const activeAccept = accept?.[acceptIndex];
	const acceptedTypes = activeAccept ? [activeAccept] : accept;
	const acceptEntries = withFilePickerAcceptKeys(accept ?? []);
	const selectedFiles = selectedEntries.filter(
		(entry) => entry.kind === 'file' && matchesFilePickerAccept(entry, acceptedTypes),
	);
	const selectedDirectory = selectedEntries.find((entry) => entry.kind === 'directory');
	const selectedFilePath = selectedFiles[0]?.path;
	useEffect(() => {
		if (mode === 'save' && selectedFiles[0]) actions.setName(selectedFiles[0].name);
	}, [actions, mode, selectedFilePath]);
	const disabled =
		request.status === 'checking' ||
		navigationPending ||
		fileManager.listing.status === 'loading' ||
		(mode === 'open' && selectedFiles.length === 0 && !selectedDirectory) ||
		(mode === 'save' && !selectedDirectory && !name.trim());
	const selectionSummary =
		mode === 'directory'
			? (selectedDirectory?.path ?? fileManager.navigation.path)
			: selectedFiles.length
				? multiple
					? `已选择 ${selectedFiles.length} 个文件`
					: selectedFiles[0].name
				: '';
	const fileManagerError = fileManager.operation.error ?? fileManager.listing.error;
	const statusMessage = navigationPending
		? (fileManager.listing.requestedPath ?? messages.openingDirectory)
		: request.status === 'checking'
			? messages.savingTarget
			: (request.error ?? fileManagerError ?? fileManager.listing.requestedPath ?? selectionSummary);
	return (
		<footer className='border-base-300 bg-base-100 shrink-0 border-t px-3 py-2'>
			{mode === 'save' ? (
				<label className='mb-2 flex items-center gap-2 text-xs'>
					<span className='shrink-0 font-medium'>{messages.fileName}</span>
					<input
						aria-label={messages.fileName}
						className='input input-sm min-w-0 flex-1'
						value={name}
						onChange={(event) => actions.setName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && !disabled) {
								event.preventDefault();
								actions.confirm();
							}
						}}
					/>
				</label>
			) : null}
			<LeftCenterRightLayout
				className={accept?.length ? 'gap-2 max-sm:grid-cols-[minmax(0,1fr)_auto]' : 'gap-2'}
				leftClassName={accept?.length ? 'max-sm:row-start-2' : undefined}
				left={
					<span
						role={request.error || fileManagerError ? 'alert' : request.status === 'checking' ? 'status' : undefined}
						className='text-base-content/55 min-w-0 truncate text-[11px]'
					>
						{statusMessage}
					</span>
				}
				center={
					accept?.length ? (
						<label className='flex items-center gap-1.5 text-[11px]'>
							<span className='text-base-content/55 shrink-0 whitespace-nowrap'>{messages.fileType}</span>
							<select
								aria-label={messages.fileType}
								className='select select-xs max-w-44'
								value={acceptIndex}
								onChange={(event) => actions.setAcceptIndex(event.target.selectedIndex)}
							>
								{acceptEntries.map(({ group, key }, index) => (
									<option key={key} value={index}>
										{group.description ?? `类型 ${index + 1}`}
									</option>
								))}
							</select>
						</label>
					) : null
				}
				centerClassName={
					accept?.length
						? 'max-sm:col-span-2 max-sm:col-start-1 max-sm:row-start-1 max-sm:justify-self-stretch'
						: undefined
				}
				right={
					<div className='flex items-center gap-2'>
						<button type='button' className='btn btn-ghost btn-sm' onClick={actions.cancel}>
							{messages.cancel}
						</button>
						<button type='button' className='btn btn-neutral btn-sm' disabled={disabled} onClick={actions.confirm}>
							{mode === 'directory'
								? messages.confirmDirectory
								: mode === 'save'
									? messages.confirmSave
									: messages.confirmOpen}
						</button>
					</div>
				}
				rightClassName={accept?.length ? 'max-sm:col-start-2 max-sm:row-start-2' : undefined}
			/>
		</footer>
	);
}

function filePickerAcceptKey(group: { accept: Record<string, readonly string[]>; description?: string }) {
	const entries = Object.entries(group.accept)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([type, extensions]) => `${type}:${[...extensions].sort().join(',')}`)
		.join('|');
	return `${group.description ?? ''}:${entries}`;
}

function withFilePickerAcceptKeys(groups: readonly FilePickerAcceptType[]) {
	const occurrences = new Map<string, number>();
	return groups.map((group) => {
		const identity = filePickerAcceptKey(group);
		const occurrence = occurrences.get(identity) ?? 0;
		occurrences.set(identity, occurrence + 1);
		return { group, key: `${identity}:${occurrence}` };
	});
}

function FilePickerOverwriteDialog({ messages }: { messages: FilePickerMessages }) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const target = useFilePickerStore((state) => state.overwrite.target);
	const actions = useFilePickerActions();
	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (target && !dialog.open) dialog.showModal();
		if (!target && dialog.open) dialog.close();
	}, [target]);
	if (!target) return null;
	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			className='bg-base-100 text-base-content m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md p-0 shadow-2xl backdrop:bg-black/35'
			onCancel={(event) => {
				event.preventDefault();
				actions.clearOverwrite();
			}}
		>
			<form
				className='flex flex-col'
				onSubmit={(event: FormEvent) => {
					event.preventDefault();
					actions.confirmOverwrite();
				}}
			>
				<header className='border-base-300 flex items-center gap-2 border-b px-4 py-3'>
					<Save aria-hidden='true' className='size-4' />
					<h3 id={titleId} className='min-w-0 flex-1 text-sm font-semibold'>
						{messages.overwriteTitle}
					</h3>
					<button
						type='button'
						aria-label='关闭'
						className='btn btn-ghost btn-square btn-xs'
						onClick={actions.clearOverwrite}
					>
						<X aria-hidden='true' className='size-4' />
					</button>
				</header>
				<div className='p-4 text-sm leading-6'>{messages.overwriteDescription(target.name)}</div>
				<footer className='border-base-300 flex justify-end gap-2 border-t px-4 py-3'>
					<button type='button' className='btn btn-ghost btn-sm' onClick={actions.clearOverwrite}>
						{messages.cancel}
					</button>
					<button type='submit' className='btn btn-error btn-sm'>
						{messages.overwrite}
					</button>
				</footer>
			</form>
		</dialog>
	);
}

function getDefaultTitle(mode: FilePickerCoreProps['mode'], multiple: boolean): ReactNode {
	if (mode === 'directory') return '选择文件夹';
	if (mode === 'save') return '保存文件';
	return multiple ? '打开文件' : '打开文件';
}

function createPickerCapabilities(createDirectory: boolean, preview: boolean) {
	return {
		copy: false,
		createDirectory,
		createFile: false,
		delete: false,
		download: false,
		edit: false,
		move: false,
		preview,
		rename: false,
		upload: false,
	};
}
