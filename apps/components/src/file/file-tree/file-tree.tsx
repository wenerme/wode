'use client';

import { LoaderCircle, RotateCcw, TriangleAlert } from 'lucide-react';
import { type ComponentPropsWithRef, forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { type NodeRendererProps, Tree, type TreeApi } from 'react-arborist';
import { cn } from '@/lib/utils';
import { FileTreeProvider, useFileTreeStore, useFileTreeStoreContext } from './file-tree-context';
import { FileTreeEventType } from './file-tree-events';
import {
	buildFileTreeData,
	formatFileTreeDirectoryError,
	normalizeFileTreeLimits,
	resolveFileTreeMessages,
} from './file-tree-model';
import { normalizeFileTreePath } from './file-tree-path';
import { FileTreeNode, FileTreeRow } from './file-tree-row';
import { createFileTreeRuntime } from './file-tree-runtime';
import type {
	FileTreeDirectoryState,
	FileTreeDropTarget,
	FileTreeFileStat,
	FileTreeFileSystem,
	FileTreeLimits,
	FileTreeMessages,
	FileTreeProps,
	FileTreeRenderNode,
	FileTreeStoreState,
} from './file-tree-types';

export const FileTree = forwardRef<HTMLDivElement, FileTreeProps>(function FileTree(props, ref) {
	const selectedControlled = Object.hasOwn(props, 'selectedPath');
	const currentControlled = Object.hasOwn(props, 'currentPath');
	const {
		['aria-label']: ariaLabel,
		className,
		currentPath,
		defaultCurrentPath,
		defaultSelectedPath,
		directoriesOnly = false,
		dropTarget,
		dropTargetPath,
		fileSystem,
		height: requestedHeight = 320,
		indent: requestedIndent = 20,
		limits: limitOptions,
		messages: messageOptions,
		onActivate,
		onEntryDragEnd,
		onEntryDragLeave,
		onEntryDragOver,
		onEntryDragStart,
		onEntryDrop,
		onNavigate,
		onSelectionChange,
		rootPath = '/',
		isEntryDraggable,
		rowHeight: requestedRowHeight = 30,
		renderIcon,
		renderLabel,
		selectedPath,
		store,
		style,
		...divProps
	} = props;
	const limits = useMemo(
		() => normalizeFileTreeLimits(limitOptions),
		[limitOptions?.maxCachedDirectories, limitOptions?.maxConcurrency, limitOptions?.maxDepth, limitOptions?.maxNodes],
	);
	const messages = useMemo(() => resolveFileTreeMessages(messageOptions), [messageOptions]);
	const normalizedRoot = normalizeFileTreePath(rootPath);
	const height = normalizeSize(requestedHeight, 320, 1, 4_096);
	const indent = normalizeSize(requestedIndent, 20, 8, 64);
	const rowHeight = normalizeSize(requestedRowHeight, 30, 20, 80);
	const resolvedDropTarget = useMemo<FileTreeDropTarget | undefined>(() => {
		if (dropTarget) return { ...dropTarget, path: normalizeFileTreePath(dropTarget.path) };
		if (dropTargetPath) return { path: normalizeFileTreePath(dropTargetPath), state: 'accepted' };
		return undefined;
	}, [dropTarget, dropTargetPath]);

	return (
		<FileTreeProvider
			store={store}
			options={{
				currentPath: currentControlled ? (currentPath ?? normalizedRoot) : (defaultCurrentPath ?? normalizedRoot),
				directoriesOnly,
				fileSystem,
				limits,
				rootPath: normalizedRoot,
				selectedPath: selectedControlled ? selectedPath : defaultSelectedPath,
			}}
		>
			<FileTreeSidecar
				currentControlled={currentControlled}
				currentPath={currentPath}
				directoriesOnly={directoriesOnly}
				fileSystem={fileSystem}
				limits={limits}
				onActivate={onActivate}
				onNavigate={onNavigate}
				onSelectionChange={onSelectionChange}
				rootPath={normalizedRoot}
				selectedControlled={selectedControlled}
				selectedPath={selectedPath}
			/>
			<FileTreeView
				{...divProps}
				ariaLabel={ariaLabel ?? messages.treeLabel}
				className={className}
				dropTarget={resolvedDropTarget}
				height={height}
				indent={indent}
				isEntryDraggable={isEntryDraggable}
				messages={messages}
				onEntryDragEnd={onEntryDragEnd}
				onEntryDragLeave={onEntryDragLeave}
				onEntryDragOver={onEntryDragOver}
				onEntryDragStart={onEntryDragStart}
				onEntryDrop={onEntryDrop}
				ref={ref}
				renderIcon={renderIcon}
				renderLabel={renderLabel}
				rowHeight={rowHeight}
				style={style}
			/>
		</FileTreeProvider>
	);
});

type FileTreeSidecarProps = {
	currentControlled: boolean;
	currentPath?: string;
	directoriesOnly: boolean;
	fileSystem: FileTreeFileSystem;
	limits: FileTreeLimits;
	onActivate?: (entry: FileTreeFileStat) => void;
	onNavigate?: (path: string) => void;
	onSelectionChange?: (path?: string) => void;
	rootPath: string;
	selectedControlled: boolean;
	selectedPath?: string;
};

function FileTreeSidecar({
	currentControlled,
	currentPath,
	directoriesOnly,
	fileSystem,
	limits,
	onActivate,
	onNavigate,
	onSelectionChange,
	rootPath,
	selectedControlled,
	selectedPath,
}: FileTreeSidecarProps) {
	const store = useFileTreeStoreContext();
	const callbacks = useRef({ currentControlled, onActivate, onNavigate, onSelectionChange, selectedControlled });
	callbacks.current = { currentControlled, onActivate, onNavigate, onSelectionChange, selectedControlled };

	useEffect(() => {
		store.getState().actions.replaceSource({ directoriesOnly, fileSystem, limits, rootPath });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		return runtime.dispose;
	}, [directoriesOnly, fileSystem, limits, rootPath, store]);

	useEffect(() => {
		if (selectedControlled) store.getState().actions.syncSelectedPath(selectedPath);
	}, [selectedControlled, selectedPath, store]);

	useEffect(() => {
		if (currentControlled) store.getState().actions.syncCurrentPath(currentPath ?? rootPath);
	}, [currentControlled, currentPath, rootPath, store]);

	useEffect(() => {
		const events = store.getState().events;
		const offSelection = events.on(FileTreeEventType.SelectionRequested, ({ data }) => {
			if (!callbacks.current.selectedControlled) store.getState().actions.syncSelectedPath(data.path);
			callbacks.current.onSelectionChange?.(data.path);
		});
		const offNavigate = events.on(FileTreeEventType.NavigateRequested, ({ data }) => {
			if (!callbacks.current.currentControlled) store.getState().actions.syncCurrentPath(data.path);
			const entry = findFileTreeEntry(store.getState(), data.path);
			if (entry) callbacks.current.onActivate?.(entry);
			callbacks.current.onNavigate?.(data.path);
		});
		return () => {
			offSelection();
			offNavigate();
		};
	}, [store]);

	return null;
}

type FileTreeViewProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	ariaLabel: string;
	dropTarget?: FileTreeDropTarget;
	height: number;
	indent: number;
	isEntryDraggable?: FileTreeProps['isEntryDraggable'];
	messages: FileTreeMessages;
	onEntryDragEnd?: FileTreeProps['onEntryDragEnd'];
	onEntryDragLeave?: FileTreeProps['onEntryDragLeave'];
	onEntryDragOver?: FileTreeProps['onEntryDragOver'];
	onEntryDragStart?: FileTreeProps['onEntryDragStart'];
	onEntryDrop?: FileTreeProps['onEntryDrop'];
	renderIcon?: FileTreeProps['renderIcon'];
	renderLabel?: FileTreeProps['renderLabel'];
	rowHeight: number;
};

const FileTreeView = forwardRef<HTMLDivElement, FileTreeViewProps>(function FileTreeView(
	{
		ariaLabel,
		className,
		dropTarget,
		height,
		indent,
		isEntryDraggable,
		messages,
		onEntryDragEnd,
		onEntryDragLeave,
		onEntryDragOver,
		onEntryDragStart,
		onEntryDrop,
		renderIcon,
		renderLabel,
		rowHeight,
		style,
		...props
	},
	ref,
) {
	const state = useFileTreeStore((current) => current);
	const treeRef = useRef<TreeApi<FileTreeRenderNode> | undefined>(undefined);
	const data = useMemo(() => buildFileTreeData(state), [state]);
	const initialOpenState = useMemo(() => Object.fromEntries([...state.tree.expanded].map((path) => [path, true])), []);
	const renderNode = useCallback(
		(nodeProps: NodeRendererProps<FileTreeRenderNode>) => (
			<FileTreeNode
				{...nodeProps}
				dropTarget={dropTarget}
				isEntryDraggable={isEntryDraggable}
				messages={messages}
				onEntryDragEnd={onEntryDragEnd}
				onEntryDragLeave={onEntryDragLeave}
				onEntryDragOver={onEntryDragOver}
				onEntryDragStart={onEntryDragStart}
				onEntryDrop={onEntryDrop}
				onRetry={state.actions.retry}
				renderIcon={renderIcon}
				renderLabel={renderLabel}
			/>
		),
		[
			dropTarget,
			isEntryDraggable,
			messages,
			onEntryDragEnd,
			onEntryDragLeave,
			onEntryDragOver,
			onEntryDragStart,
			onEntryDrop,
			renderIcon,
			renderLabel,
			state.actions.retry,
		],
	);
	const rootDirectory = state.tree.directories.get(state.source.rootPath);

	useEffect(() => {
		const tree = treeRef.current;
		if (!tree) return;
		let changed = false;
		for (const [path, open] of Object.entries(tree.openState)) {
			if (open && !state.tree.expanded.has(path)) {
				tree.close(path, false);
				changed = true;
			}
		}
		const expanded = [...state.tree.expanded].sort((left, right) => left.length - right.length);
		for (const path of expanded) {
			if (!tree.isOpen(path)) {
				tree.open(path, false);
				changed = true;
			}
		}
		if (changed) tree.redrawList();
	}, [data, state.tree.expanded]);

	useEffect(() => {
		const tree = treeRef.current;
		if (tree && state.navigation.currentPath !== state.source.rootPath)
			void tree.scrollTo(state.navigation.currentPath);
	}, [data, state.navigation.currentPath, state.source.rootPath]);

	return (
		<div
			{...props}
			ref={ref}
			data-slot='file-tree'
			className={cn('border-base-300 bg-base-100 relative min-w-0 overflow-hidden rounded-md border', className)}
			style={{ height, ...style }}
		>
			<Tree<FileTreeRenderNode>
				ref={treeRef}
				aria-label={ariaLabel}
				childrenAccessor='children'
				data={data}
				dndBackend={fileTreeNoopDndBackend}
				disableDrag
				disableDrop
				disableEdit
				disableMultiSelection
				height={height}
				idAccessor='id'
				indent={indent}
				initialOpenState={initialOpenState}
				onActivate={(node) => state.actions.requestNavigate(node.data.path)}
				onSelect={(nodes) => {
					const path = nodes[0]?.data.path;
					if (path !== state.selection.path) state.actions.requestSelection(path);
				}}
				onToggle={(path) => {
					if (treeRef.current?.isOpen(path)) state.actions.expand(path);
					else state.actions.collapse(path);
				}}
				openByDefault={false}
				outerElementType={FileTreeScrollArea}
				overscanCount={6}
				renderRow={FileTreeRow}
				rowClassName='outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info/60'
				rowHeight={rowHeight}
				selection={state.selection.path}
				width='100%'
			>
				{renderNode}
			</Tree>
			{dropTarget?.state === 'rejected' ? (
				<div className='sr-only' role='status'>
					{dropTarget.reason}
				</div>
			) : null}
			<FileTreeStatus
				directory={rootDirectory}
				messages={messages}
				onRetry={() => state.actions.retry(state.source.rootPath)}
			/>
		</div>
	);
});

function FileTreeStatus({
	directory,
	messages,
	onRetry,
}: {
	directory?: FileTreeDirectoryState;
	messages: FileTreeMessages;
	onRetry: () => void;
}) {
	if (!directory || directory.status === 'idle' || directory.status === 'loading' || directory.status === 'queued') {
		return (
			<div
				className='bg-base-100/90 pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm'
				role='status'
			>
				<LoaderCircle aria-hidden='true' className='text-info size-4 animate-spin' />
				{messages.loading}
			</div>
		);
	}
	if (directory.status === 'error') {
		return (
			<div
				className='bg-base-100/95 absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm'
				role='alert'
			>
				<TriangleAlert aria-hidden='true' className='text-error size-5' />
				<span>{formatFileTreeDirectoryError(directory, messages)}</span>
				<button type='button' className='btn btn-ghost btn-sm' onClick={onRetry}>
					<RotateCcw aria-hidden='true' className='size-4' />
					{messages.retry}
				</button>
			</div>
		);
	}
	if (directory.entries.length === 0) {
		return (
			<div
				className='text-base-content/60 pointer-events-none absolute inset-0 flex items-center justify-center text-sm'
				role='status'
			>
				{messages.empty}
			</div>
		);
	}
	return null;
}

const FileTreeScrollArea = forwardRef<HTMLDivElement, ComponentPropsWithRef<'div'>>(
	function FileTreeScrollArea(props, ref) {
		return <div {...props} ref={ref} />;
	},
);

function normalizeSize(value: number, fallback: number, minimum: number, maximum: number) {
	return Number.isFinite(value) ? Math.max(minimum, Math.min(Math.round(value), maximum)) : fallback;
}

function fileTreeNoopDndBackend() {
	const disconnect = () => undefined;
	return {
		connectDragPreview: () => disconnect,
		connectDragSource: () => disconnect,
		connectDropTarget: () => disconnect,
		profile: () => ({}),
		setup: () => undefined,
		teardown: () => undefined,
	};
}

function findFileTreeEntry(state: FileTreeStoreState, path: string) {
	for (const directory of state.tree.directories.values()) {
		const entry = directory.entries.find((candidate) => candidate.path === path);
		if (entry) return entry;
	}
	return undefined;
}
