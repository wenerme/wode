'use client';

import {
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Copy,
	Download,
	FilePlus2,
	FolderPlus,
	Grid2X2,
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
import type { RefObject } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { PathAddressBar } from '@components/path-address-bar';
import { PathAddressBarMenuItem } from '@components/path-address-bar/path-address-bar-menu-item';
import { useFileManagerActions, useFileManagerStore } from './file-manager-context';
import { FileManagerCommandButton, FileManagerNavigationButton, FileManagerViewButton } from './file-manager-controls';
import type { FileManagerFileStat } from './file-manager-types';
import type { FileManagerProps } from './file-manager';

export type FileManagerToolbarProps = {
	busy: boolean;
	compactNavigation: boolean;
	embeddedSearchOpen: boolean;
	embeddedSearchRef: RefObject<HTMLInputElement | null>;
	isEmbedded: boolean;
	listingStatus: 'error' | 'idle' | 'loading' | 'ready';
	previewPanelRef: RefObject<PanelImperativeHandle | null>;
	renderAddressBar?: FileManagerProps['renderAddressBar'];
	requestUpload: (files: FileList | File[]) => void;
	saveRunning: boolean;
	selectedEntries: FileManagerFileStat[];
	selectedEntry?: FileManagerFileStat;
	setEmbeddedSearchOpen: (open: boolean) => void;
	sidebarPanelRef: RefObject<PanelImperativeHandle | null>;
	uploadRef: RefObject<HTMLInputElement | null>;
};

export function FileManagerToolbar({
	busy,
	compactNavigation,
	embeddedSearchOpen,
	embeddedSearchRef,
	isEmbedded,
	listingStatus,
	previewPanelRef,
	renderAddressBar,
	requestUpload,
	saveRunning,
	selectedEntries,
	selectedEntry,
	setEmbeddedSearchOpen,
	sidebarPanelRef,
	uploadRef,
}: FileManagerToolbarProps) {
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	const canGoBack = state.navigation.index > 0;
	const canGoForward = state.navigation.index < state.navigation.history.length - 1;
	const navigate = (path: string) => actions.requestNavigate(path);
	const currentMenu = (
		<>
			<PathAddressBarMenuItem disabled={busy} onClick={actions.refresh}>
				<RefreshCw aria-hidden='true' className='size-4' />
				<span>刷新目录</span>
			</PathAddressBarMenuItem>
			{state.capabilities.createDirectory ? (
				<PathAddressBarMenuItem
					disabled={busy}
					onClick={() => actions.openDialog({ type: 'create', kind: 'directory', value: '' })}
				>
					<FolderPlus aria-hidden='true' className='size-4' />
					<span>新建目录</span>
				</PathAddressBarMenuItem>
			) : null}
			{state.capabilities.createFile ? (
				<PathAddressBarMenuItem
					disabled={busy}
					onClick={() => actions.openDialog({ type: 'create', kind: 'file', value: '' })}
				>
					<FilePlus2 aria-hidden='true' className='size-4' />
					<span>新建文件</span>
				</PathAddressBarMenuItem>
			) : null}
			{state.capabilities.upload ? (
				<PathAddressBarMenuItem disabled={busy} onClick={() => uploadRef.current?.click()}>
					<Upload aria-hidden='true' className='size-4' />
					<span>上传文件</span>
				</PathAddressBarMenuItem>
			) : null}
			{isEmbedded && selectedEntries.length ? (
				<>
					<div className='bg-base-300 my-1 h-px' />
					<div className='text-base-content/55 px-2 py-1 text-[11px]'>已选择 {selectedEntries.length} 个项目</div>
					{state.capabilities.rename && selectedEntry ? (
						<PathAddressBarMenuItem
							disabled={busy}
							onClick={() => actions.openDialog({ type: 'rename', value: selectedEntry.name })}
						>
							<Pencil aria-hidden='true' className='size-4' />
							<span>重命名</span>
						</PathAddressBarMenuItem>
					) : null}
					{state.capabilities.copy ? (
						<PathAddressBarMenuItem
							disabled={busy}
							onClick={() => actions.openDialog({ type: 'transfer', mode: 'copy', destination: state.navigation.path })}
						>
							<Copy aria-hidden='true' className='size-4' />
							<span>复制到</span>
						</PathAddressBarMenuItem>
					) : null}
					{state.capabilities.move ? (
						<PathAddressBarMenuItem
							disabled={busy}
							onClick={() => actions.openDialog({ type: 'transfer', mode: 'move', destination: state.navigation.path })}
						>
							<Move aria-hidden='true' className='size-4' />
							<span>移动到</span>
						</PathAddressBarMenuItem>
					) : null}
					{state.capabilities.download ? (
						<PathAddressBarMenuItem
							disabled={busy || selectedEntries.some((entry) => entry.kind === 'directory')}
							onClick={() => actions.requestOperation({ type: 'download', paths: [...state.selection.paths] })}
						>
							<Download aria-hidden='true' className='size-4' />
							<span>下载</span>
						</PathAddressBarMenuItem>
					) : null}
					{state.capabilities.delete ? (
						<PathAddressBarMenuItem
							className='text-error'
							disabled={busy}
							onClick={() => actions.openDialog({ type: 'delete' })}
						>
							<Trash2 aria-hidden='true' className='size-4' />
							<span>删除</span>
						</PathAddressBarMenuItem>
					) : null}
				</>
			) : null}
		</>
	);
	const defaultAddressBar = (
		<PathAddressBar
			aria-label='文件路径地址栏'
			className='mx-1 h-8 min-w-0 flex-1'
			currentMenu={currentMenu}
			disabled={busy}
			loading={listingStatus === 'loading'}
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
			loading: listingStatus === 'loading',
			onPathChange: navigate,
			onValueChange: actions.setAddress,
			onValueCommit: navigate,
			path: state.navigation.path,
			rootPath: state.rootPath,
			value: state.navigation.address,
		}) ?? defaultAddressBar;
	return (
		<>
			<div
				data-slot='file-manager-navigation'
				className='border-base-300 bg-base-200/45 flex min-h-11 shrink-0 items-center gap-1 border-b px-2 py-1.5'
			>
				<FileManagerNavigationButton label='后退' disabled={!canGoBack || busy} onClick={actions.back}>
					<ArrowLeft className='size-4' />
				</FileManagerNavigationButton>
				<FileManagerNavigationButton label='前进' disabled={!canGoForward || busy} onClick={actions.forward}>
					<ArrowRight className='size-4' />
				</FileManagerNavigationButton>
				<FileManagerNavigationButton
					label='上一级'
					disabled={state.navigation.path === state.rootPath || busy}
					onClick={actions.up}
				>
					<ArrowUp className='size-4' />
				</FileManagerNavigationButton>
				{!isEmbedded || !compactNavigation ? (
					<FileManagerNavigationButton label='刷新' disabled={busy} onClick={actions.refresh}>
						<RefreshCw className={cn('size-4', listingStatus === 'loading' && 'animate-spin')} />
					</FileManagerNavigationButton>
				) : null}
				{isEmbedded && embeddedSearchOpen ? (
					<label className='border-base-300 bg-base-100 mx-1 flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2'>
						<Search aria-hidden='true' className='text-base-content/45 size-3.5 shrink-0' />
						<input
							ref={embeddedSearchRef}
							aria-label='搜索当前目录'
							placeholder='搜索当前目录'
							className='min-w-0 flex-1 bg-transparent text-xs outline-none'
							value={state.view.query}
							onChange={(event) => actions.setQuery(event.target.value)}
						/>
						<button
							type='button'
							aria-label='关闭搜索'
							title='关闭搜索'
							className='hover:bg-base-200 grid size-6 place-items-center rounded-sm'
							onClick={() => setEmbeddedSearchOpen(false)}
						>
							<X aria-hidden='true' className='size-3.5' />
						</button>
					</label>
				) : (
					addressBar
				)}
				{isEmbedded ? (
					<EmbeddedViewControls
						busy={busy}
						embeddedSearchOpen={embeddedSearchOpen}
						previewPanelRef={previewPanelRef}
						saveRunning={saveRunning}
						setEmbeddedSearchOpen={setEmbeddedSearchOpen}
						sidebarPanelRef={sidebarPanelRef}
					/>
				) : null}
			</div>
			{isEmbedded ? (
				<UploadInput requestUpload={requestUpload} uploadRef={uploadRef} />
			) : (
				<CommandToolbar
					busy={busy}
					previewPanelRef={previewPanelRef}
					requestUpload={requestUpload}
					saveRunning={saveRunning}
					selectedEntries={selectedEntries}
					selectedEntry={selectedEntry}
					sidebarPanelRef={sidebarPanelRef}
					uploadRef={uploadRef}
				/>
			)}
		</>
	);
}

function EmbeddedViewControls({
	busy,
	embeddedSearchOpen,
	previewPanelRef,
	saveRunning,
	setEmbeddedSearchOpen,
	sidebarPanelRef,
}: Pick<
	FileManagerToolbarProps,
	'busy' | 'embeddedSearchOpen' | 'previewPanelRef' | 'saveRunning' | 'setEmbeddedSearchOpen' | 'sidebarPanelRef'
>) {
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	return (
		<>
			<FileManagerNavigationButton
				label='搜索当前目录'
				active={embeddedSearchOpen || Boolean(state.view.query)}
				disabled={busy}
				onClick={() => setEmbeddedSearchOpen(true)}
			>
				<Search className='size-4' />
			</FileManagerNavigationButton>
			<FileManagerNavigationButton
				label={state.view.sidebarOpen ? '关闭位置面板' : '打开位置面板'}
				active={state.view.sidebarOpen}
				onClick={() => togglePanel(sidebarPanelRef, state.view.sidebarOpen, actions.setSidebarOpen)}
			>
				{state.view.sidebarOpen ? <PanelLeftClose className='size-4' /> : <PanelLeftOpen className='size-4' />}
			</FileManagerNavigationButton>
			<div className='border-base-300 flex h-7 items-center rounded-md border p-0.5' aria-label='显示模式'>
				<FileManagerViewButton
					label='列表视图'
					active={state.view.mode === 'list'}
					onClick={() => actions.setViewMode('list')}
				>
					<List className='size-3.5' />
				</FileManagerViewButton>
				<FileManagerViewButton
					label='网格视图'
					active={state.view.mode === 'grid'}
					onClick={() => actions.setViewMode('grid')}
				>
					<Grid2X2 className='size-3.5' />
				</FileManagerViewButton>
			</div>
			{state.capabilities.preview ? (
				<FileManagerNavigationButton
					label={state.view.previewOpen ? '关闭预览' : '打开预览'}
					active={state.view.previewOpen}
					disabled={saveRunning && state.view.previewOpen}
					onClick={() => togglePanel(previewPanelRef, state.view.previewOpen, actions.setPreviewOpen)}
				>
					{state.view.previewOpen ? <PanelRightClose className='size-4' /> : <PanelRightOpen className='size-4' />}
				</FileManagerNavigationButton>
			) : null}
		</>
	);
}

function CommandToolbar({
	busy,
	previewPanelRef,
	requestUpload,
	saveRunning,
	selectedEntries,
	selectedEntry,
	sidebarPanelRef,
	uploadRef,
}: Pick<
	FileManagerToolbarProps,
	| 'busy'
	| 'previewPanelRef'
	| 'requestUpload'
	| 'saveRunning'
	| 'selectedEntries'
	| 'selectedEntry'
	| 'sidebarPanelRef'
	| 'uploadRef'
>) {
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	return (
		<div className='border-base-300 flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 border-b px-2 py-2'>
			{state.capabilities.createDirectory ? (
				<FileManagerCommandButton
					label='新建目录'
					disabled={busy}
					onClick={() => actions.openDialog({ type: 'create', kind: 'directory', value: '' })}
				>
					<FolderPlus className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.createFile ? (
				<FileManagerCommandButton
					label='新建文件'
					disabled={busy}
					onClick={() => actions.openDialog({ type: 'create', kind: 'file', value: '' })}
				>
					<FilePlus2 className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.upload ? (
				<FileManagerCommandButton label='上传文件' disabled={busy} onClick={() => uploadRef.current?.click()}>
					<Upload className='size-4' />
				</FileManagerCommandButton>
			) : null}
			<UploadInput requestUpload={requestUpload} uploadRef={uploadRef} />
			<div className='border-base-300 mx-0.5 h-5 border-l' />
			{state.capabilities.rename ? (
				<FileManagerCommandButton
					label='重命名'
					disabled={busy || !selectedEntry}
					onClick={() => selectedEntry && actions.openDialog({ type: 'rename', value: selectedEntry.name })}
				>
					<Pencil className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.copy ? (
				<FileManagerCommandButton
					label='复制到'
					disabled={busy || !selectedEntries.length}
					onClick={() => actions.openDialog({ type: 'transfer', mode: 'copy', destination: state.navigation.path })}
				>
					<Copy className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.move ? (
				<FileManagerCommandButton
					label='移动到'
					disabled={busy || !selectedEntries.length}
					onClick={() => actions.openDialog({ type: 'transfer', mode: 'move', destination: state.navigation.path })}
				>
					<Move className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.download ? (
				<FileManagerCommandButton
					label='下载'
					disabled={busy || !selectedEntries.length || selectedEntries.some((entry) => entry.kind === 'directory')}
					onClick={() => actions.requestOperation({ type: 'download', paths: [...state.selection.paths] })}
				>
					<Download className='size-4' />
				</FileManagerCommandButton>
			) : null}
			{state.capabilities.delete ? (
				<FileManagerCommandButton
					label='删除'
					danger
					disabled={busy || !selectedEntries.length}
					onClick={() => actions.openDialog({ type: 'delete' })}
				>
					<Trash2 className='size-4' />
				</FileManagerCommandButton>
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
			<FileManagerNavigationButton
				label={state.view.sidebarOpen ? '关闭位置面板' : '打开位置面板'}
				active={state.view.sidebarOpen}
				onClick={() => togglePanel(sidebarPanelRef, state.view.sidebarOpen, actions.setSidebarOpen)}
			>
				{state.view.sidebarOpen ? <PanelLeftClose className='size-4' /> : <PanelLeftOpen className='size-4' />}
			</FileManagerNavigationButton>
			<div className='border-base-300 flex h-8 items-center rounded-md border p-0.5' aria-label='显示模式'>
				<FileManagerViewButton
					label='列表视图'
					active={state.view.mode === 'list'}
					onClick={() => actions.setViewMode('list')}
				>
					<List className='size-3.5' />
				</FileManagerViewButton>
				<FileManagerViewButton
					label='网格视图'
					active={state.view.mode === 'grid'}
					onClick={() => actions.setViewMode('grid')}
				>
					<Grid2X2 className='size-3.5' />
				</FileManagerViewButton>
			</div>
			{state.capabilities.preview ? (
				<FileManagerNavigationButton
					label={state.view.previewOpen ? '关闭预览' : '打开预览'}
					active={state.view.previewOpen}
					disabled={saveRunning && state.view.previewOpen}
					onClick={() => togglePanel(previewPanelRef, state.view.previewOpen, actions.setPreviewOpen)}
				>
					{state.view.previewOpen ? <PanelRightClose className='size-4' /> : <PanelRightOpen className='size-4' />}
				</FileManagerNavigationButton>
			) : null}
		</div>
	);
}

function UploadInput({ requestUpload, uploadRef }: Pick<FileManagerToolbarProps, 'requestUpload' | 'uploadRef'>) {
	return (
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
	);
}

function togglePanel(
	panelRef: RefObject<PanelImperativeHandle | null>,
	open: boolean,
	setOpen: (open: boolean) => void,
) {
	const nextOpen = !open;
	setOpen(nextOpen);
	if (nextOpen) panelRef.current?.expand();
	else panelRef.current?.collapse();
}
