'use client';

import { FileTree } from '@components/file-tree';
import { createFileTreeStore } from '@components/file-tree/file-tree-store';
import type { FileTreeFileStat } from '@components/file-tree/file-tree-types';
import { FileManagerFileTypeIcon, useFileManagerRegistry } from '@components/file-viewer/file-manager-registry';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable';
import { Folder, FolderTree, HardDrive } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { useFileManagerActions, useFileManagerStore, useFileManagerStoreContext } from './file-manager-context';
import type { FileManagerDragAndDropController } from './file-manager-drag-drop';
import { getFileManagerOperationRefreshPlan } from './file-manager-operation-utils';
import type { FileManagerFileStat, FileManagerPlace } from './file-manager-types';
import { normalizeFileManagerPath, toFileManagerFileTypeInput } from './file-manager-utils';

export type FileManagerSidebarProps = {
	busy: boolean;
	directoriesOnly?: boolean;
	dragAndDrop?: FileManagerDragAndDropController;
	onActivateEntry?: (entry: FileManagerFileStat) => void;
	orientation: 'horizontal' | 'vertical';
	panelId: string;
	places?: FileManagerPlace[];
	showTree?: boolean;
};

export function FileManagerSidebar({
	busy,
	directoriesOnly = false,
	dragAndDrop,
	onActivateEntry,
	orientation,
	panelId,
	places,
	showTree = true,
}: FileManagerSidebarProps) {
	const manager = useFileManagerRegistry();
	const store = useFileManagerStoreContext();
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	const [treeOpen, setTreeOpen] = useState(true);
	const pendingFile = useRef<FileManagerFileStat | undefined>(undefined);
	const treePanelRef = useRef<PanelImperativeHandle | null>(null);
	const resolvedPlaces = places ?? [
		{ id: 'root', label: '根目录', path: state.rootPath, icon: <HardDrive className='size-4' /> },
	];
	const selectedPath = state.selection.paths.length === 1 ? state.selection.paths[0] : undefined;
	const currentTreePath = selectedPath ?? state.navigation.path;
	const [treeStore] = useState(() =>
		createFileTreeStore({
			currentPath: currentTreePath,
			directoriesOnly,
			fileSystem: state.fileSystem,
			rootPath: state.rootPath,
			selectedPath,
		}),
	);

	useEffect(() => {
		const off = store.getState().events.on('event', ({ data }) => {
			if (
				data.type === 'operation-succeeded' ||
				((data.type === 'operation-failed' || data.type === 'operation-cancelled') && data.result?.completed.length)
			) {
				const refresh = getFileManagerOperationRefreshPlan(data.operation, data.result);
				treeStore.getState().actions.requestRefresh(refresh.directories, { removedPaths: refresh.removedPaths });
			}
			if (data.type === 'error' && data.action === 'navigate') pendingFile.current = undefined;
			if (data.type !== 'navigated' || !pendingFile.current) return;
			const pending = pendingFile.current;
			pendingFile.current = undefined;
			const entry = store.getState().listing.entries.find((candidate) => candidate.path === pending.path);
			if (!entry) return;
			store.getState().actions.select(entry.path);
			onActivateEntry?.(entry);
			store.getState().actions.open(entry);
		});
		return off;
	}, [onActivateEntry, store, treeStore]);

	const placesContent = (
		<div className='bg-base-200/25 h-full min-h-0 overflow-auto p-2'>
			<div className='text-base-content/70 flex min-h-6 items-center px-2 text-[10px] font-semibold uppercase'>
				<span className='min-w-0 flex-1'>位置</span>
				{showTree ? (
					<button
						type='button'
						aria-label='展开文件树'
						title='展开文件树'
						className='hover:bg-base-300 grid size-5 place-items-center rounded-sm disabled:opacity-35'
						disabled={treeOpen}
						onClick={() => {
							setTreeOpen(true);
							treePanelRef.current?.expand();
						}}
					>
						<FolderTree aria-hidden='true' className='size-3.5' />
					</button>
				) : null}
			</div>
			<nav aria-label='文件位置' className='grid grid-cols-2 gap-1 lg:grid-cols-1'>
				{resolvedPlaces.map((place) => (
					<button
						key={place.id}
						type='button'
						className={cn(
							'flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs',
							state.navigation.path === normalizeFileManagerPath(place.path)
								? 'bg-primary/12 text-base-content'
								: 'hover:bg-base-200',
						)}
						aria-current={state.navigation.path === normalizeFileManagerPath(place.path) ? 'location' : undefined}
						disabled={busy}
						onClick={() => actions.requestNavigate(place.path)}
					>
						<span className='shrink-0'>{place.icon ?? <Folder className='size-4' />}</span>
						<span className='truncate'>{place.label}</span>
					</button>
				))}
			</nav>
		</div>
	);
	const treeContent = showTree ? (
		<AutoSizedFileTree
			currentPath={currentTreePath}
			directoriesOnly={directoriesOnly}
			dropTarget={dragAndDrop?.drop}
			fileSystem={state.fileSystem}
			isEntryDraggable={dragAndDrop?.canDrag}
			rootPath={state.rootPath}
			store={treeStore}
			onActivate={(entry) => {
				if (busy) return;
				const managerEntry = toFileManagerEntry(entry);
				if (managerEntry.kind === 'directory') {
					onActivateEntry?.(managerEntry);
					actions.requestNavigate(managerEntry.path);
					return;
				}
				if (managerEntry.directory === state.navigation.path) {
					actions.select(managerEntry.path);
					onActivateEntry?.(managerEntry);
					actions.open(managerEntry);
					return;
				}
				pendingFile.current = managerEntry;
				actions.requestNavigate(managerEntry.directory);
			}}
			onEntryDragEnd={() => dragAndDrop?.finishEntryDrag()}
			onEntryDragLeave={(entry, event) => {
				dragAndDrop?.getDropTargetProps({ kind: entry.kind, path: entry.path }).onDragLeave(event);
			}}
			onEntryDragOver={(entry, event) => {
				dragAndDrop?.getDropTargetProps({ kind: entry.kind, path: entry.path }).onDragOver(event);
			}}
			onEntryDragStart={(entry, event) => dragAndDrop?.startEntryDrag(toFileManagerEntry(entry), event, false)}
			onEntryDrop={(entry, event) => {
				dragAndDrop?.getDropTargetProps({ kind: entry.kind, path: entry.path }).onDrop(event);
			}}
			renderIcon={(entry) => (
				<FileManagerFileTypeIcon
					className='size-4'
					file={toFileManagerFileTypeInput(toFileManagerEntry(entry))}
					manager={manager}
				/>
			)}
		/>
	) : null;

	if (!showTree) return <aside className='size-full min-h-0 overflow-hidden'>{placesContent}</aside>;
	const compact = orientation === 'vertical';
	return (
		<aside className='size-full min-h-0 overflow-hidden'>
			<ResizablePanelGroup id={`${panelId}-sidebar`} orientation='vertical'>
				<ResizablePanel
					id={`${panelId}-places`}
					className='h-full min-h-0 overflow-hidden'
					style={{ overflow: 'hidden' }}
					defaultSize='34%'
					minSize={compact ? '2rem' : '5rem'}
					maxSize='100%'
				>
					{placesContent}
				</ResizablePanel>
				<ResizableHandle id={`${panelId}-sidebar-handle`} />
				<ResizablePanel
					id={`${panelId}-tree`}
					className='h-full min-h-0 overflow-hidden'
					style={{ overflow: 'hidden' }}
					collapsible
					collapsedSize={0}
					defaultSize='66%'
					minSize={compact ? '2.5rem' : '8rem'}
					panelRef={treePanelRef}
					onResize={(size) => setTreeOpen(size.inPixels > 0)}
				>
					<div className='flex h-full min-h-0 flex-col overflow-hidden' aria-hidden={!treeOpen} inert={!treeOpen}>
						<div className='border-base-300 shrink-0 border-b px-2 py-1 text-[10px] font-semibold uppercase'>
							文件树
						</div>
						<div className='min-h-0 flex-1 overflow-hidden'>{treeContent}</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</aside>
	);
}

function AutoSizedFileTree(props: Omit<ComponentProps<typeof FileTree>, 'height'>) {
	const ref = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const update = () => setHeight(Math.max(0, Math.floor(element.getBoundingClientRect().height)));
		update();
		if (typeof ResizeObserver !== 'function') return;
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return (
		<div ref={ref} className='size-full min-h-0'>
			{height > 0 ? <FileTree {...props} className='size-full rounded-none border-0' height={height} /> : null}
		</div>
	);
}

function toFileManagerEntry(entry: FileTreeFileStat): FileManagerFileStat {
	return { ...entry, meta: entry.meta ?? {} };
}
