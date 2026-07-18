'use client';

import {
	ArrowDownAZ,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Copy,
	Download,
	File,
	FileArchive,
	FileAudio,
	FileImage,
	FilePlus2,
	FileText,
	FileVideo,
	Folder,
	FolderOpen,
	FolderPlus,
	Grid2X2,
	HardDrive,
	List,
	Move,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
	Pencil,
	RefreshCw,
	Search,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import {
	type ComponentPropsWithRef,
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PathAddressBar } from '@/components/path-address-bar/path-address-bar';
import { PathAddressBarMenuItem } from '@/components/path-address-bar/path-address-bar-menu-item';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import {
	FileManagerProvider,
	useFileManagerActions,
	useFileManagerListing,
	useFileManagerStore,
} from './file-manager-context';
import { FileManagerPreview } from './file-manager-preview';
import { FileManagerRuntime, type FileManagerRuntimeProps } from './file-manager-runtime';
import { createFileManagerStore } from './file-manager-store';
import type {
	FileManagerAddressBarRenderProps,
	FileManagerCapabilities,
	FileManagerDialogState,
	FileManagerEvent,
	FileManagerFileStat,
	FileManagerFileSystem,
	FileManagerPlace,
	FileManagerPreviewRenderProps,
	FileManagerStore,
	FileManagerViewMode,
} from './file-manager-types';
import {
	formatFileManagerBytes,
	getFileManagerExtension,
	getFileManagerMediaKind,
	joinFileManagerPath,
	normalizeFileManagerPath,
	sortFileManagerEntries,
	validateFileManagerName,
} from './file-manager-utils';

export type FileManagerProps = Omit<ComponentPropsWithRef<'section'>, 'onError' | 'title'> & {
	capabilities?: Partial<FileManagerCapabilities>;
	emptyState?: ReactNode;
	fileSystem: FileManagerFileSystem;
	filterEntry?: (entry: FileManagerFileStat) => boolean;
	footer?: ReactNode;
	initialPath?: string;
	maxPreviewBytes?: number;
	maxUploadBytes?: number;
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
	store?: FileManagerStore;
	title?: ReactNode;
	viewMode?: FileManagerViewMode;
};

export function FileManager({
	capabilities,
	className,
	emptyState,
	fileSystem,
	filterEntry,
	footer,
	initialPath,
	maxPreviewBytes,
	maxUploadBytes,
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
	store,
	title = '文件管理器',
	viewMode,
	...props
}: FileManagerProps) {
	const resolvedCapabilities = resolveCapabilities(capabilities, readOnly);
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
	return (
		<FileManagerProvider store={store ?? localStore}>
			<FileManagerConfiguration capabilities={resolvedCapabilities} />
			<FileManagerRuntime
				fileSystem={fileSystem}
				initialPath={initialPath}
				maxUploadBytes={maxUploadBytes}
				rootPath={rootPath}
				onDownload={onDownload}
				onEvent={onEvent}
				onOpenFile={onOpenFile}
			/>
			<FileManagerSurface
				className={className}
				emptyState={emptyState}
				filterEntry={filterEntry}
				footer={footer}
				maxPreviewBytes={maxPreviewBytes}
				onActivateEntry={onActivateEntry}
				places={places}
				renderAddressBar={renderAddressBar}
				renderPreview={renderPreview}
				selectionMode={selectionMode}
				showHeader={showHeader}
				title={title}
				{...props}
			/>
		</FileManagerProvider>
	);
}

function FileManagerConfiguration({ capabilities }: { capabilities: FileManagerCapabilities }) {
	const actions = useFileManagerActions();
	useEffect(() => actions.setCapabilities(capabilities), [actions, capabilities]);
	return null;
}

type FileManagerSurfaceProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	emptyState?: ReactNode;
	filterEntry?: FileManagerProps['filterEntry'];
	footer?: ReactNode;
	maxPreviewBytes?: number;
	onActivateEntry?: FileManagerProps['onActivateEntry'];
	places?: FileManagerPlace[];
	renderAddressBar?: FileManagerProps['renderAddressBar'];
	renderPreview?: FileManagerProps['renderPreview'];
	selectionMode: NonNullable<FileManagerProps['selectionMode']>;
	showHeader: boolean;
	title: ReactNode;
};

export function FileManagerSurface({
	className,
	emptyState,
	filterEntry,
	footer,
	maxPreviewBytes,
	onActivateEntry,
	onKeyDown,
	places,
	renderAddressBar,
	renderPreview,
	selectionMode,
	showHeader,
	tabIndex,
	title,
	...props
}: FileManagerSurfaceProps) {
	const actions = useFileManagerActions();
	const listing = useFileManagerListing();
	const state = useFileManagerStore((current) => current);
	const panelId = useId();
	const workspaceRef = useRef<HTMLDivElement>(null);
	const [panelOrientation, setPanelOrientation] = useState<'horizontal' | 'vertical'>('vertical');
	const uploadRef = useRef<HTMLInputElement>(null);
	const resolvedPlaces = useMemo<FileManagerPlace[]>(
		() => places ?? [{ id: 'root', label: '根目录', path: state.rootPath, icon: <HardDrive className='size-4' /> }],
		[places, state.rootPath],
	);
	const visibleEntries = useMemo(() => {
		const query = listing.query.trim().toLocaleLowerCase();
		const allowed = filterEntry ? listing.entries.filter(filterEntry) : listing.entries;
		const filtered = query ? allowed.filter((entry) => entry.name.toLocaleLowerCase().includes(query)) : allowed;
		return sortFileManagerEntries(filtered, { by: listing.sortBy, direction: listing.sortDirection });
	}, [filterEntry, listing.entries, listing.query, listing.sortBy, listing.sortDirection]);
	const visiblePaths = useMemo(() => visibleEntries.map((entry) => entry.path), [visibleEntries]);
	const entryByPath = useMemo(() => new Map(listing.entries.map((entry) => [entry.path, entry])), [listing.entries]);
	const selectedEntries = state.selection.paths.flatMap((path) => {
		const entry = entryByPath.get(path);
		return entry ? [entry] : [];
	});
	const selectedEntry = selectedEntries.length === 1 ? selectedEntries[0] : undefined;
	const busy = state.operation.status === 'running';
	const saveRunning = busy && state.operation.kind === 'save-text';
	const hasPreview = state.capabilities.preview && state.view.previewOpen;
	const canGoBack = state.navigation.index > 0;
	const canGoForward = state.navigation.index < state.navigation.history.length - 1;
	const preview = <FileManagerPreview entry={selectedEntry} maxPreviewBytes={maxPreviewBytes} />;
	const navigate = (path: string) => actions.requestNavigate(path);
	const currentMenu = (
		<>
			<PathAddressBarMenuItem onClick={actions.refresh}>
				<RefreshCw aria-hidden='true' className='size-4' />
				<span>刷新目录</span>
			</PathAddressBarMenuItem>
			{state.capabilities.createDirectory ? (
				<PathAddressBarMenuItem onClick={() => actions.openDialog({ type: 'create', kind: 'directory', value: '' })}>
					<FolderPlus aria-hidden='true' className='size-4' />
					<span>新建目录</span>
				</PathAddressBarMenuItem>
			) : null}
			{state.capabilities.createFile ? (
				<PathAddressBarMenuItem onClick={() => actions.openDialog({ type: 'create', kind: 'file', value: '' })}>
					<FilePlus2 aria-hidden='true' className='size-4' />
					<span>新建文件</span>
				</PathAddressBarMenuItem>
			) : null}
			{state.capabilities.upload ? (
				<PathAddressBarMenuItem onClick={() => uploadRef.current?.click()}>
					<Upload aria-hidden='true' className='size-4' />
					<span>上传文件</span>
				</PathAddressBarMenuItem>
			) : null}
		</>
	);
	const defaultAddressBar = (
		<PathAddressBar
			aria-label='文件路径地址栏'
			className='mx-1 h-8 min-w-0 flex-1'
			currentMenu={currentMenu}
			disabled={busy}
			loading={listing.status === 'loading'}
			messages={{ inputLabel: '当前位置' }}
			path={state.navigation.path}
			rootLabel='根目录'
			rootPath={state.rootPath}
			value={state.navigation.address}
			onPathChange={navigate}
			onValueChange={actions.setAddress}
			onValueCommit={navigate}
		/>
	);
	const addressBar =
		renderAddressBar?.({
			currentMenu,
			defaultAddressBar,
			disabled: busy,
			loading: listing.status === 'loading',
			onPathChange: navigate,
			onValueChange: actions.setAddress,
			onValueCommit: navigate,
			path: state.navigation.path,
			rootPath: state.rootPath,
			value: state.navigation.address,
		}) ?? defaultAddressBar;

	useEffect(() => {
		const element = workspaceRef.current;
		if (!element) return;
		const update = () => setPanelOrientation(element.getBoundingClientRect().width >= 768 ? 'horizontal' : 'vertical');
		update();
		if (typeof ResizeObserver === 'function') {
			const observer = new ResizeObserver(update);
			observer.observe(element);
			return () => observer.disconnect();
		}
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	const openEntry = (entry: FileManagerFileStat) => {
		if (busy) return;
		actions.select(entry.path, { visiblePaths });
		onActivateEntry?.(entry);
		actions.open(entry);
	};
	const selectEntry = (entry: FileManagerFileStat, options?: { range?: boolean; toggle?: boolean }) => {
		actions.select(entry.path, {
			range: selectionMode === 'multiple' && options?.range,
			toggle: selectionMode === 'multiple' && options?.toggle,
			visiblePaths,
		});
	};
	const requestUpload = (files: FileList | File[]) => {
		if (!state.capabilities.upload || busy || files.length === 0) return;
		actions.requestOperation({ type: 'upload', directory: state.navigation.path, files: Array.from(files) });
	};
	const handleKeyboard = (event: KeyboardEvent<HTMLElement>) => {
		if (event.defaultPrevented) return;
		if (busy) return;
		if (isInteractiveTarget(event.target)) return;
		if (selectionMode === 'multiple' && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
			event.preventDefault();
			actions.selectAll(visiblePaths);
		}
		if (event.key === 'Delete' && state.capabilities.delete && selectedEntries.length) {
			event.preventDefault();
			actions.openDialog({ type: 'delete' });
		}
		if (event.key === 'F2' && state.capabilities.rename && selectedEntry) {
			event.preventDefault();
			actions.openDialog({ type: 'rename', value: selectedEntry.name });
		}
		if (event.key === 'Enter' && selectedEntry) {
			event.preventDefault();
			openEntry(selectedEntry);
		}
	};

	return (
		<section
			data-file-manager=''
			data-console-density=''
			className={cn(
				'border-base-300 bg-base-100 flex h-[min(48rem,calc(100vh-2rem))] min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			tabIndex={tabIndex ?? 0}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				handleKeyboard(event);
			}}
			{...props}
		>
			{showHeader ? (
				<header className='border-base-300 flex min-h-11 shrink-0 items-center gap-2 border-b px-2.5 py-2'>
					<div className='bg-neutral text-neutral-content grid size-7 shrink-0 place-items-center rounded-md'>
						<FolderOpen className='size-4' />
					</div>
					<h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>{title}</h2>
					<span className='text-base-content/55 hidden text-[11px] sm:inline'>{state.rootPath}</span>
				</header>
			) : null}

			<div className='border-base-300 bg-base-200/45 flex min-h-11 shrink-0 items-center gap-1 border-b px-2 py-1.5'>
				<NavigationButton label='后退' disabled={!canGoBack || busy} onClick={actions.back}>
					<ArrowLeft className='size-4' />
				</NavigationButton>
				<NavigationButton label='前进' disabled={!canGoForward || busy} onClick={actions.forward}>
					<ArrowRight className='size-4' />
				</NavigationButton>
				<NavigationButton
					label='上一级'
					disabled={state.navigation.path === state.rootPath || busy}
					onClick={actions.up}
				>
					<ArrowUp className='size-4' />
				</NavigationButton>
				<NavigationButton label='刷新' disabled={busy} onClick={actions.refresh}>
					<RefreshCw className={cn('size-4', listing.status === 'loading' && 'animate-spin')} />
				</NavigationButton>
				{addressBar}
			</div>

			<div className='border-base-300 flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 border-b px-2 py-2'>
				{state.capabilities.createDirectory ? (
					<CommandButton
						label='新建目录'
						disabled={busy}
						onClick={() => actions.openDialog({ type: 'create', kind: 'directory', value: '' })}
					>
						<FolderPlus className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.createFile ? (
					<CommandButton
						label='新建文件'
						disabled={busy}
						onClick={() => actions.openDialog({ type: 'create', kind: 'file', value: '' })}
					>
						<FilePlus2 className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.upload ? (
					<CommandButton label='上传文件' disabled={busy} onClick={() => uploadRef.current?.click()}>
						<Upload className='size-4' />
					</CommandButton>
				) : null}
				<input
					ref={uploadRef}
					type='file'
					aria-label='选择上传文件'
					multiple
					className='hidden'
					onChange={(event) => {
						if (event.target.files) requestUpload(event.target.files);
						event.target.value = '';
					}}
				/>
				<div className='border-base-300 mx-0.5 h-5 border-l' />
				{state.capabilities.rename ? (
					<CommandButton
						label='重命名'
						disabled={busy || !selectedEntry}
						onClick={() => selectedEntry && actions.openDialog({ type: 'rename', value: selectedEntry.name })}
					>
						<Pencil className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.copy ? (
					<CommandButton
						label='复制到'
						disabled={busy || !selectedEntries.length}
						onClick={() => actions.openDialog({ type: 'transfer', mode: 'copy', destination: state.navigation.path })}
					>
						<Copy className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.move ? (
					<CommandButton
						label='移动到'
						disabled={busy || !selectedEntries.length}
						onClick={() => actions.openDialog({ type: 'transfer', mode: 'move', destination: state.navigation.path })}
					>
						<Move className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.download ? (
					<CommandButton
						label='下载'
						disabled={busy || !selectedEntries.length || selectedEntries.some((entry) => entry.kind === 'directory')}
						onClick={() => actions.requestOperation({ type: 'download', paths: [...state.selection.paths] })}
					>
						<Download className='size-4' />
					</CommandButton>
				) : null}
				{state.capabilities.delete ? (
					<CommandButton
						label='删除'
						danger
						disabled={busy || !selectedEntries.length}
						onClick={() => actions.openDialog({ type: 'delete' })}
					>
						<Trash2 className='size-4' />
					</CommandButton>
				) : null}
				<div className='min-w-2 flex-1' />
				<label className='border-base-300 bg-base-100 flex h-8 min-w-36 items-center gap-1.5 rounded-md border px-2 sm:w-52'>
					<Search className='text-base-content/45 size-3.5 shrink-0' />
					<input
						aria-label='搜索当前目录'
						placeholder='搜索'
						className='min-w-0 flex-1 bg-transparent text-xs outline-none'
						value={state.view.query}
						onChange={(event) => actions.setQuery(event.target.value)}
					/>
					{state.view.query ? (
						<button type='button' aria-label='清除搜索' title='清除搜索' onClick={() => actions.setQuery('')}>
							<X className='size-3.5' />
						</button>
					) : null}
				</label>
				<NavigationButton
					label={state.view.sidebarOpen ? '关闭位置面板' : '打开位置面板'}
					active={state.view.sidebarOpen}
					onClick={() => actions.setSidebarOpen(!state.view.sidebarOpen)}
				>
					{state.view.sidebarOpen ? <PanelLeftClose className='size-4' /> : <PanelLeftOpen className='size-4' />}
				</NavigationButton>
				<div className='border-base-300 flex h-8 items-center rounded-md border p-0.5' aria-label='显示模式'>
					<ViewButton label='列表视图' active={state.view.mode === 'list'} onClick={() => actions.setViewMode('list')}>
						<List className='size-3.5' />
					</ViewButton>
					<ViewButton label='网格视图' active={state.view.mode === 'grid'} onClick={() => actions.setViewMode('grid')}>
						<Grid2X2 className='size-3.5' />
					</ViewButton>
				</div>
				{state.capabilities.preview ? (
					<NavigationButton
						label={state.view.previewOpen ? '关闭预览' : '打开预览'}
						active={state.view.previewOpen}
						disabled={saveRunning && state.view.previewOpen}
						onClick={() => actions.setPreviewOpen(!state.view.previewOpen)}
					>
						{state.view.previewOpen ? <PanelRightClose className='size-4' /> : <PanelRightOpen className='size-4' />}
					</NavigationButton>
				) : null}
			</div>

			<div ref={workspaceRef} className='min-h-0 min-w-0 flex-1'>
				<ResizablePanelGroup
					key={panelOrientation}
					id={`${panelId}-workspace-${panelOrientation}`}
					orientation={panelOrientation}
				>
					{state.view.sidebarOpen ? (
						<>
							<ResizablePanel
								id={`${panelId}-places-${panelOrientation}`}
								className='relative'
								defaultSize={panelOrientation === 'horizontal' ? '11rem' : '18%'}
								minSize={panelOrientation === 'horizontal' ? '9rem' : '12%'}
								maxSize={panelOrientation === 'horizontal' ? '20rem' : '30%'}
								groupResizeBehavior='preserve-pixel-size'
							>
								<aside className='bg-base-200/25 h-full min-h-0 overflow-auto p-2'>
									<div className='text-base-content/45 px-2 py-1 text-[10px] font-semibold uppercase'>位置</div>
									<nav aria-label='文件位置' className='grid grid-cols-2 gap-1 lg:grid-cols-1'>
										{resolvedPlaces.map((place) => (
											<button
												key={place.id}
												type='button'
												className={cn(
													'flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs',
													state.navigation.path === normalizeFileManagerPath(place.path)
														? 'bg-primary/12 text-primary'
														: 'hover:bg-base-200',
												)}
												aria-current={
													state.navigation.path === normalizeFileManagerPath(place.path) ? 'location' : undefined
												}
												disabled={busy}
												onClick={() => actions.requestNavigate(place.path)}
											>
												<span className='shrink-0'>{place.icon ?? <Folder className='size-4' />}</span>
												<span className='truncate'>{place.label}</span>
											</button>
										))}
									</nav>
								</aside>
							</ResizablePanel>
							<ResizableHandle id={`${panelId}-places-handle-${panelOrientation}`} />
						</>
					) : null}

					<ResizablePanel
						id={`${panelId}-listing-${panelOrientation}`}
						className='relative'
						defaultSize={panelOrientation === 'vertical' ? '42%' : undefined}
						minSize={panelOrientation === 'horizontal' ? '18rem' : '25%'}
					>
						<div
							className='relative h-full min-h-0 min-w-0 overflow-auto'
							onDragOver={(event) => {
								if (!state.capabilities.upload) return;
								event.preventDefault();
								event.dataTransfer.dropEffect = 'copy';
							}}
							onDrop={(event) => {
								if (!state.capabilities.upload) return;
								event.preventDefault();
								requestUpload(event.dataTransfer.files);
							}}
						>
							<FileManagerListing
								disabled={busy}
								emptyState={emptyState}
								entries={visibleEntries}
								multiple={selectionMode === 'multiple'}
								onOpen={openEntry}
								onSelect={selectEntry}
								selectedPaths={state.selection.paths}
								visiblePaths={visiblePaths}
							/>
						</div>
					</ResizablePanel>

					{hasPreview ? (
						<>
							<ResizableHandle id={`${panelId}-preview-handle-${panelOrientation}`} />
							<ResizablePanel
								id={`${panelId}-preview-${panelOrientation}`}
								className='relative'
								defaultSize={panelOrientation === 'horizontal' ? '19rem' : '40%'}
								minSize={panelOrientation === 'horizontal' ? '16rem' : '30%'}
								maxSize={panelOrientation === 'horizontal' ? '36rem' : '60%'}
								groupResizeBehavior='preserve-pixel-size'
							>
								<aside aria-label='文件预览' className='h-full min-h-0 overflow-hidden'>
									{renderPreview && selectedEntry
										? renderPreview({ entry: selectedEntry, fileSystem: state.fileSystem, defaultPreview: preview })
										: preview}
								</aside>
							</ResizablePanel>
						</>
					) : null}
				</ResizablePanelGroup>
			</div>

			{footer === undefined ? (
				<footer className='border-base-300 text-base-content/60 flex min-h-8 shrink-0 items-center gap-3 border-t px-2.5 text-[11px]'>
					<span>{listing.entries.length} 个项目</span>
					{state.selection.paths.length ? <span>已选择 {state.selection.paths.length} 个</span> : null}
					<span className='min-w-0 flex-1 truncate'>
						{listing.requesting ?? state.operation.error ?? listing.error ?? ''}
					</span>
					{busy ? <span role='status'>正在执行 {state.operation.kind}…</span> : null}
				</footer>
			) : (
				footer
			)}

			<FileManagerDialog dialog={state.dialog} path={state.navigation.path} selectedEntries={selectedEntries} />
		</section>
	);
}

function FileManagerListing({
	disabled,
	emptyState,
	entries,
	multiple,
	onOpen,
	onSelect,
	selectedPaths,
	visiblePaths,
}: {
	disabled: boolean;
	emptyState?: ReactNode;
	entries: FileManagerFileStat[];
	multiple: boolean;
	onOpen: (entry: FileManagerFileStat) => void;
	onSelect: (entry: FileManagerFileStat, options?: { range?: boolean; toggle?: boolean }) => void;
	selectedPaths: string[];
	visiblePaths: string[];
}) {
	const actions = useFileManagerActions();
	const { mode, status, error, sortBy, sortDirection } = useFileManagerStore(
		useShallow((state) => ({
			mode: state.view.mode,
			status: state.listing.status,
			error: state.listing.error,
			sortBy: state.view.sortBy,
			sortDirection: state.view.sortDirection,
		})),
	);
	if (status === 'loading' && entries.length === 0) {
		return (
			<div role='status' className='text-base-content/55 grid min-h-full place-items-center text-xs'>
				正在读取目录…
			</div>
		);
	}
	if (status === 'error' && entries.length === 0) {
		return (
			<div role='alert' className='grid min-h-full place-items-center p-6 text-center'>
				<div>
					<div className='text-error text-sm font-medium'>无法打开目录</div>
					<div className='text-base-content/60 mt-1 max-w-md text-xs'>{error}</div>
					<button type='button' className='btn btn-sm mt-3' onClick={actions.refresh}>
						重试
					</button>
				</div>
			</div>
		);
	}
	if (!entries.length) {
		if (emptyState !== undefined) return emptyState;
		return (
			<div className='grid min-h-full place-items-center p-6 text-center'>
				<div>
					<FolderOpen className='text-base-content/30 mx-auto size-9' />
					<div className='mt-2 text-sm font-medium'>当前目录为空</div>
					<div className='text-base-content/55 mt-1 text-xs'>新建文件、目录或拖入文件开始使用。</div>
				</div>
			</div>
		);
	}
	if (mode === 'grid') {
		return (
			<div data-file-manager-grid='' className='flex flex-wrap content-start items-start gap-2 p-2'>
				{entries.map((entry) => {
					const selected = selectedPaths.includes(entry.path);
					return (
						<div
							key={entry.path}
							data-file-manager-grid-item=''
							className={cn(
								'border-base-300 bg-base-100 relative h-28 w-36 flex-none rounded-md border p-2',
								selected ? 'border-primary bg-primary/8' : 'hover:bg-base-200/45',
							)}
						>
							{multiple ? (
								<input
									type='checkbox'
									aria-label={`选择 ${entry.name}`}
									className='checkbox checkbox-xs absolute top-2 left-2'
									checked={selected}
									disabled={disabled}
									onChange={() => onSelect(entry, { toggle: true })}
								/>
							) : null}
							<button
								type='button'
								disabled={disabled}
								className={cn(
									'flex size-full min-w-0 flex-col items-center justify-center px-2 text-center',
									multiple && 'pt-4',
								)}
								onClick={(event) => onSelect(entry, { range: event.shiftKey, toggle: event.metaKey || event.ctrlKey })}
								onDoubleClick={() => onOpen(entry)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										event.stopPropagation();
										onOpen(entry);
									}
								}}
							>
								<FileManagerEntryIcon entry={entry} className='size-8' />
								<span className='mt-2 line-clamp-2 w-full text-xs font-medium break-all'>{entry.name}</span>
								<span className='text-base-content/45 mt-1 text-[10px]'>
									{entry.kind === 'directory' ? '目录' : formatFileManagerBytes(entry.size)}
								</span>
							</button>
						</div>
					);
				})}
			</div>
		);
	}
	const allSelected = entries.length > 0 && entries.every((entry) => selectedPaths.includes(entry.path));
	return (
		<table className='w-full min-w-[42rem] border-collapse text-left text-xs'>
			<thead className='bg-base-200 text-base-content/65 sticky top-0 z-10'>
				<tr className='border-base-300 border-b'>
					{multiple ? (
						<th className='w-9 px-2 py-2'>
							<input
								type='checkbox'
								aria-label='选择当前列表全部项目'
								className='checkbox checkbox-xs'
								checked={allSelected}
								disabled={disabled}
								onChange={() => actions.selectAll(allSelected ? [] : visiblePaths)}
							/>
						</th>
					) : null}
					<SortableHeader label='名称' by='name' active={sortBy === 'name'} direction={sortDirection} />
					<SortableHeader
						label='大小'
						by='size'
						active={sortBy === 'size'}
						direction={sortDirection}
						className='w-28'
					/>
					<th className='w-28 px-3 py-2 font-medium'>类型</th>
					<SortableHeader
						label='修改时间'
						by='mtime'
						active={sortBy === 'mtime'}
						direction={sortDirection}
						className='w-44'
					/>
				</tr>
			</thead>
			<tbody className='divide-base-300 divide-y'>
				{entries.map((entry) => {
					const selected = selectedPaths.includes(entry.path);
					return (
						<tr key={entry.path} className={selected ? 'bg-primary/8' : 'hover:bg-base-200/45'}>
							{multiple ? (
								<td className='px-2 py-1.5'>
									<input
										type='checkbox'
										aria-label={`选择 ${entry.name}`}
										className='checkbox checkbox-xs'
										checked={selected}
										disabled={disabled}
										onChange={() => onSelect(entry, { toggle: true })}
									/>
								</td>
							) : null}
							<td className='min-w-56 px-3 py-1.5'>
								<button
									type='button'
									disabled={disabled}
									className='flex w-full min-w-0 items-center gap-2 text-left'
									onClick={(event) =>
										onSelect(entry, { range: event.shiftKey, toggle: event.metaKey || event.ctrlKey })
									}
									onDoubleClick={() => onOpen(entry)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											event.stopPropagation();
											onOpen(entry);
										}
									}}
								>
									<FileManagerEntryIcon entry={entry} className='size-4' />
									<span className='min-w-0 flex-1 truncate font-medium'>{entry.name}</span>
								</button>
							</td>
							<td className='text-base-content/60 px-3 py-1.5 tabular-nums'>
								{entry.kind === 'directory' ? '—' : formatFileManagerBytes(entry.size)}
							</td>
							<td className='text-base-content/60 px-3 py-1.5'>
								{entry.kind === 'directory' ? '目录' : getFileManagerExtension(entry.name).toUpperCase() || '文件'}
							</td>
							<td className='text-base-content/60 px-3 py-1.5 tabular-nums'>
								{entry.mtime ? new Date(entry.mtime).toLocaleString() : '—'}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

function FileManagerDialog({
	dialog,
	path,
	selectedEntries,
}: {
	dialog: FileManagerDialogState;
	path: string;
	selectedEntries: FileManagerFileStat[];
}) {
	const actions = useFileManagerActions();
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const [validationError, setValidationError] = useState<string>();
	const dialogType = dialog?.type;
	useEffect(() => {
		const element = ref.current;
		if (!element || !dialogType) return;
		setValidationError(undefined);
		if (!element.open) element.showModal();
		return () => {
			if (element.open) element.close();
		};
	}, [dialogType]);
	if (!dialog) return null;
	const title =
		dialog.type === 'create'
			? dialog.kind === 'directory'
				? '新建目录'
				: '新建文件'
			: dialog.type === 'rename'
				? '重命名'
				: dialog.type === 'transfer'
					? dialog.mode === 'copy'
						? '复制到'
						: '移动到'
					: '确认删除';
	const submit = (event: FormEvent) => {
		event.preventDefault();
		setValidationError(undefined);
		if (dialog.type === 'create' || dialog.type === 'rename') {
			const error = validateFileManagerName(dialog.value);
			if (error) {
				setValidationError(error);
				return;
			}
		}
		if (dialog.type === 'create') {
			actions.requestOperation({
				type: dialog.kind === 'directory' ? 'create-directory' : 'create-file',
				directory: path,
				name: dialog.value.trim(),
			});
		}
		if (dialog.type === 'rename' && selectedEntries[0]) {
			actions.requestOperation({ type: 'rename', path: selectedEntries[0].path, name: dialog.value.trim() });
		}
		if (dialog.type === 'transfer') {
			actions.requestOperation({
				type: dialog.mode,
				paths: selectedEntries.map((entry) => entry.path),
				destination: dialog.destination,
			});
		}
		if (dialog.type === 'delete') {
			actions.requestOperation({ type: 'delete', paths: selectedEntries.map((entry) => entry.path) });
		}
	};
	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			className='bg-base-100 text-base-content m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md p-0 shadow-2xl backdrop:bg-black/35'
			onCancel={(event) => {
				event.preventDefault();
				actions.closeDialog();
			}}
		>
			<form onSubmit={submit} className='flex flex-col'>
				<div className='border-base-300 flex items-center gap-2 border-b px-4 py-3'>
					<h3 id={titleId} className='min-w-0 flex-1 text-sm font-semibold'>
						{title}
					</h3>
					<button
						type='button'
						aria-label='关闭'
						title='关闭'
						className='hover:bg-base-200 grid size-7 place-items-center rounded-md'
						onClick={actions.closeDialog}
					>
						<X className='size-4' />
					</button>
				</div>
				<div className='p-4'>
					{dialog.type === 'delete' ? (
						<div className='text-sm leading-6'>
							确认删除 {selectedEntries.length} 个项目？目录内容将递归删除，此操作无法撤销。
						</div>
					) : dialog.type === 'transfer' ? (
						<label className='grid gap-1.5 text-xs'>
							<span className='font-medium'>目标目录</span>
							<input
								autoFocus
								aria-label='目标目录'
								className='input input-sm w-full font-mono'
								value={dialog.destination}
								onChange={(event) => actions.setDialogValue(event.target.value)}
							/>
							<span className='text-base-content/55'>将处理 {selectedEntries.length} 个项目。</span>
						</label>
					) : (
						<label className='grid gap-1.5 text-xs'>
							<span className='font-medium'>名称</span>
							<input
								autoFocus
								aria-label='名称'
								className='input input-sm w-full'
								value={dialog.value}
								onChange={(event) => actions.setDialogValue(event.target.value)}
							/>
							{dialog.type === 'create' ? (
								<span className='text-base-content/55 truncate font-mono'>
									{joinFileManagerPath(path, dialog.value)}
								</span>
							) : null}
						</label>
					)}
					{validationError ? (
						<div role='alert' className='text-error mt-2 text-xs'>
							{validationError}
						</div>
					) : null}
				</div>
				<div className='border-base-300 flex justify-end gap-2 border-t px-4 py-3'>
					<button type='button' className='btn btn-ghost btn-sm' onClick={actions.closeDialog}>
						取消
					</button>
					<button type='submit' className={cn('btn btn-sm', dialog.type === 'delete' ? 'btn-error' : 'btn-neutral')}>
						确认
					</button>
				</div>
			</form>
		</dialog>
	);
}

function FileManagerEntryIcon({ entry, className }: { entry: FileManagerFileStat; className?: string }) {
	if (entry.kind === 'directory') return <Folder className={cn('text-warning shrink-0', className)} />;
	const kind = getFileManagerMediaKind(entry.name);
	if (kind === 'image') return <FileImage className={cn('text-info shrink-0', className)} />;
	if (kind === 'text') return <FileText className={cn('text-primary shrink-0', className)} />;
	if (kind === 'pdf') return <FileArchive className={cn('text-error shrink-0', className)} />;
	if (kind === 'audio') return <FileAudio className={cn('text-secondary shrink-0', className)} />;
	if (kind === 'video') return <FileVideo className={cn('text-accent shrink-0', className)} />;
	return <File className={cn('text-base-content/50 shrink-0', className)} />;
}

function NavigationButton({
	active,
	children,
	label,
	...props
}: ComponentPropsWithRef<'button'> & { active?: boolean; label: string }) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			aria-pressed={active}
			className={cn(
				'grid size-7 shrink-0 place-items-center rounded-md disabled:cursor-not-allowed disabled:opacity-35',
				active ? 'bg-base-300' : 'hover:bg-base-300/60',
			)}
			{...props}
		>
			{children}
		</button>
	);
}

function CommandButton({
	children,
	danger,
	label,
	...props
}: ComponentPropsWithRef<'button'> & { danger?: boolean; label: string }) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			className={cn(
				'hover:bg-base-200 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs disabled:cursor-not-allowed disabled:opacity-35',
				danger && 'text-error hover:bg-error/10',
			)}
			{...props}
		>
			{children}
			<span className='hidden 2xl:inline'>{label}</span>
		</button>
	);
}

function ViewButton({
	active,
	children,
	label,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			aria-pressed={active}
			className={cn(
				'grid size-6 place-items-center rounded-sm',
				active ? 'bg-neutral text-neutral-content' : 'hover:bg-base-200',
			)}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

function SortableHeader({
	active,
	by,
	className,
	direction,
	label,
}: {
	active: boolean;
	by: 'name' | 'size' | 'mtime';
	className?: string;
	direction: 'asc' | 'desc';
	label: string;
}) {
	const actions = useFileManagerActions();
	return (
		<th className={cn('px-3 py-2 font-medium', className)}>
			<button type='button' className='flex items-center gap-1' onClick={() => actions.setSort(by)}>
				{label}
				<ArrowDownAZ
					className={cn('size-3', !active && 'opacity-25', active && direction === 'desc' && 'rotate-180')}
				/>
			</button>
		</th>
	);
}

function resolveCapabilities(
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

function isInteractiveTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		Boolean(target.closest('a, button, input, select, summary, textarea, [contenteditable="true"], [role="button"]'))
	);
}
