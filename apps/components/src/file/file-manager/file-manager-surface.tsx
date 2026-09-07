'use client';

import { FolderOpen } from 'lucide-react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import {
	type ComponentPropsWithRef,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useFileManagerActions, useFileManagerListing, useFileManagerStore } from './file-manager-context';
import { useFileManagerDragAndDrop } from './file-manager-drag-drop';
import { FileManagerDialog } from './file-manager-dialog';
import { FileManagerOperationFeedbackPanel } from './file-manager-operation-feedback';
import { collectFileManagerUploadFiles } from './file-manager-operation-utils';
import { FileManagerToolbar } from './file-manager-toolbar';
import type { FileManagerProps, FileManagerSurfaceVariant } from './file-manager';
import type { FileManagerFileStat, FileManagerOperation, FileManagerPlace } from './file-manager-types';
import { sortFileManagerEntries } from './file-manager-utils';
import { FileManagerWorkspace } from './file-manager-workspace';

export type FileManagerSurfaceProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
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
	showFileTree: boolean;
	surfaceVariant: FileManagerSurfaceVariant;
	title: ReactNode;
	treeDirectoriesOnly: boolean;
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
	showFileTree,
	surfaceVariant,
	tabIndex,
	title,
	treeDirectoriesOnly,
	...props
}: FileManagerSurfaceProps) {
	const actions = useFileManagerActions();
	const listing = useFileManagerListing();
	const state = useFileManagerStore((current) => current);
	const panelId = useId();
	const previewPanelRef = useRef<PanelImperativeHandle | null>(null);
	const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
	const workspaceRef = useRef<HTMLDivElement>(null);
	const embeddedSearchRef = useRef<HTMLInputElement>(null);
	const uploadRef = useRef<HTMLInputElement>(null);
	const [panelOrientation, setPanelOrientation] = useState<'horizontal' | 'vertical'>('vertical');
	const [compactNavigation, setCompactNavigation] = useState(false);
	const [embeddedSearchOpen, setEmbeddedSearchOpen] = useState(false);
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
	const isEmbedded = surfaceVariant === 'embedded';
	const dragAndDrop = useFileManagerDragAndDrop({
		busy,
		capabilities: state.capabilities,
		clearIssue: () => actions.setOperationNotice(undefined),
		reportIssue: actions.setOperationNotice,
		requestOperation: actions.requestOperation,
		selectedPaths: state.selection.paths,
		selectPath: (path) => actions.select(path, { visiblePaths }),
	});

	useEffect(() => {
		const element = workspaceRef.current;
		if (!element) return;
		const update = () => {
			const { width } = element.getBoundingClientRect();
			setPanelOrientation(width >= 768 ? 'horizontal' : 'vertical');
			setCompactNavigation(width <= 352);
		};
		update();
		if (typeof ResizeObserver === 'function') {
			const observer = new ResizeObserver(update);
			observer.observe(element);
			return () => observer.disconnect();
		}
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	useEffect(() => {
		if (!isEmbedded || !embeddedSearchOpen) return;
		embeddedSearchRef.current?.focus();
	}, [embeddedSearchOpen, isEmbedded]);

	useEffect(
		() => syncPanel(sidebarPanelRef.current, state.view.sidebarOpen),
		[panelOrientation, state.view.sidebarOpen],
	);
	useEffect(
		() => syncPanel(previewPanelRef.current, state.view.previewOpen),
		[panelOrientation, state.view.previewOpen],
	);

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
		actions.requestOperation({
			type: 'upload',
			directory: state.navigation.path,
			...collectFileManagerUploadFiles(files),
		});
	};
	const handleKeyboard = (event: KeyboardEvent<HTMLElement>) => {
		if (event.defaultPrevented || busy || isInteractiveTarget(event.target)) return;
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
			data-file-manager-surface={surfaceVariant}
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
			{showHeader && !isEmbedded ? (
				<header className='border-base-300 flex min-h-11 shrink-0 items-center gap-2 border-b px-2.5 py-2'>
					<div className='bg-neutral text-neutral-content grid size-7 shrink-0 place-items-center rounded-md'>
						<FolderOpen className='size-4' />
					</div>
					<h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>{title}</h2>
					<span className='text-base-content/55 hidden text-[11px] sm:inline'>{state.rootPath}</span>
				</header>
			) : null}
			<FileManagerToolbar
				busy={busy}
				compactNavigation={compactNavigation}
				embeddedSearchOpen={embeddedSearchOpen}
				embeddedSearchRef={embeddedSearchRef}
				isEmbedded={isEmbedded}
				listingStatus={listing.status}
				previewPanelRef={previewPanelRef}
				renderAddressBar={renderAddressBar}
				requestUpload={requestUpload}
				saveRunning={saveRunning}
				selectedEntries={selectedEntries}
				selectedEntry={selectedEntry}
				setEmbeddedSearchOpen={setEmbeddedSearchOpen}
				sidebarPanelRef={sidebarPanelRef}
				uploadRef={uploadRef}
			/>
			<FileManagerWorkspace
				busy={busy}
				dragAndDrop={dragAndDrop}
				emptyState={emptyState}
				entries={visibleEntries}
				maxPreviewBytes={maxPreviewBytes}
				onActivateEntry={onActivateEntry}
				onOpen={openEntry}
				onSelect={selectEntry}
				orientation={panelOrientation}
				panelId={panelId}
				places={places}
				previewPanelRef={previewPanelRef}
				renderPreview={renderPreview}
				saveRunning={saveRunning}
				selectedEntry={selectedEntry}
				selectionMode={selectionMode}
				showFileTree={showFileTree}
				sidebarPanelRef={sidebarPanelRef}
				treeDirectoriesOnly={treeDirectoriesOnly}
				visiblePaths={visiblePaths}
				workspaceRef={workspaceRef}
			/>
			<FileManagerOperationFeedbackPanel />
			{footer === undefined ? <DefaultFooter busy={busy} listing={listing} /> : footer}
			<FileManagerDialog dialog={state.dialog} path={state.navigation.path} selectedEntries={selectedEntries} />
		</section>
	);
}

function DefaultFooter({ busy, listing }: { busy: boolean; listing: ReturnType<typeof useFileManagerListing> }) {
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	return (
		<footer className='border-base-300 text-base-content/70 flex min-h-8 shrink-0 items-center gap-3 border-t px-2.5 text-[11px]'>
			<span>{listing.entries.length} 个项目</span>
			{state.selection.paths.length ? <span>已选择 {state.selection.paths.length} 个</span> : null}
			<span className='min-w-0 flex-1 truncate'>
				{listing.requesting ?? state.operation.error ?? listing.error ?? ''}
			</span>
			{busy ? (
				<>
					<span role='status'>正在执行 {getOperationLabel(state.operation.kind)}…</span>
					<button type='button' className='btn btn-ghost btn-xs' onClick={actions.cancelOperation}>
						取消
					</button>
				</>
			) : null}
		</footer>
	);
}

function syncPanel(panel: PanelImperativeHandle | null, open: boolean) {
	if (!panel || panel.isCollapsed() === !open) return;
	if (open) panel.expand();
	else panel.collapse();
}

function getOperationLabel(type: FileManagerOperation['type'] | undefined): string {
	return {
		copy: '复制',
		'create-directory': '新建目录',
		'create-file': '新建文件',
		delete: '删除',
		download: '下载',
		move: '移动',
		rename: '重命名',
		'save-text': '保存',
		upload: '上传',
	}[type ?? 'upload'];
}

function isInteractiveTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		Boolean(target.closest('a, button, input, select, summary, textarea, [contenteditable="true"], [role="button"]'))
	);
}
