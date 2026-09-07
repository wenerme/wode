'use client';

import {
	ChevronDown,
	ChevronRight,
	CircleSlash2,
	File,
	Folder,
	FolderOpen,
	LoaderCircle,
	RotateCcw,
	TriangleAlert,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import type { NodeRendererProps, RowRendererProps } from 'react-arborist';
import { formatFileTreeDirectoryError } from './file-tree-model';
import type { FileTreeDropTarget, FileTreeMessages, FileTreeProps, FileTreeRenderNode } from './file-tree-types';

export function FileTreeRow({ node, attrs, innerRef, children }: RowRendererProps<FileTreeRenderNode>) {
	const handleClick = (event: MouseEvent<HTMLDivElement>) => {
		if ((event.metaKey || event.ctrlKey) && !node.tree.props.disableMultiSelection) {
			if (node.isSelected) node.deselect();
			else node.selectMulti();
		} else if (event.shiftKey && !node.tree.props.disableMultiSelection) {
			node.selectContiguous();
		} else {
			node.select();
		}
	};
	return (
		<div
			{...attrs}
			aria-current={node.data.isCurrent ? 'location' : undefined}
			aria-expanded={node.isInternal ? node.isOpen : undefined}
			ref={innerRef}
			onClick={handleClick}
			onDoubleClick={() => node.activate()}
			onFocus={(event) => event.stopPropagation()}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' || event.target !== event.currentTarget) return;
				event.preventDefault();
				node.activate();
			}}
		>
			{children}
		</div>
	);
}

export type FileTreeNodeProps = NodeRendererProps<FileTreeRenderNode> & {
	dropTarget?: FileTreeDropTarget;
	isEntryDraggable?: FileTreeProps['isEntryDraggable'];
	messages: FileTreeMessages;
	onEntryDragEnd?: FileTreeProps['onEntryDragEnd'];
	onEntryDragLeave?: FileTreeProps['onEntryDragLeave'];
	onEntryDragOver?: FileTreeProps['onEntryDragOver'];
	onEntryDragStart?: FileTreeProps['onEntryDragStart'];
	onEntryDrop?: FileTreeProps['onEntryDrop'];
	onRetry: (path: string) => void;
	renderIcon?: FileTreeProps['renderIcon'];
	renderLabel?: FileTreeProps['renderLabel'];
};

export function FileTreeNode({
	dragHandle,
	dropTarget,
	isEntryDraggable,
	messages,
	node,
	onEntryDragEnd,
	onEntryDragLeave,
	onEntryDragOver,
	onEntryDragStart,
	onEntryDrop,
	onRetry,
	renderIcon,
	renderLabel,
	style,
}: FileTreeNodeProps) {
	const data = node.data;
	const draggable = typeof isEntryDraggable === 'function' ? isEntryDraggable(data.entry) : isEntryDraggable;
	const directoryError = data.status === 'error';
	const activeDropTarget = dropTarget?.path === data.path ? dropTarget : undefined;
	const rejectedDropTarget = activeDropTarget?.state === 'rejected' ? activeDropTarget : undefined;
	const renderState = { isCurrent: data.isCurrent, isOpen: node.isOpen, isSelected: node.isSelected };
	const defaultIcon =
		data.status === 'loading' || data.status === 'queued' ? (
			<LoaderCircle aria-hidden='true' className='text-info size-4 shrink-0 animate-spin' />
		) : data.kind === 'directory' ? (
			node.isOpen ? (
				<FolderOpen aria-hidden='true' className='text-warning size-4 shrink-0' />
			) : (
				<Folder aria-hidden='true' className='text-warning size-4 shrink-0' />
			)
		) : (
			<File aria-hidden='true' className='text-base-content/60 size-4 shrink-0' />
		);
	return (
		<div
			ref={dragHandle}
			style={style}
			className='hover:bg-base-200 data-[current=true]:bg-info/15 data-[current=true]:text-base-content data-[drop-state=accepted]:bg-info/20 data-[drop-state=accepted]:ring-info data-[drop-state=rejected]:bg-error/10 data-[drop-state=rejected]:text-base-content/45 data-[drop-state=rejected]:ring-error/60 flex h-full min-w-max items-center gap-1 px-1 text-sm data-[current=true]:font-medium data-[drop-state=accepted]:ring-1 data-[drop-state=accepted]:ring-inset data-[drop-state=rejected]:cursor-not-allowed data-[drop-state=rejected]:ring-1 data-[drop-state=rejected]:ring-inset'
			aria-disabled={rejectedDropTarget ? true : undefined}
			data-current={data.isCurrent || undefined}
			data-drop-state={activeDropTarget?.state}
			data-drop-target={activeDropTarget ? true : undefined}
			data-kind={data.kind}
			data-path={data.path}
			title={rejectedDropTarget?.reason}
			draggable={draggable || undefined}
			onDragEnd={(event) => onEntryDragEnd?.(data.entry, event)}
			onDragLeave={(event) => onEntryDragLeave?.(data.entry, event)}
			onDragOver={(event) => onEntryDragOver?.(data.entry, event)}
			onDragStart={(event) => onEntryDragStart?.(data.entry, event)}
			onDrop={(event) => onEntryDrop?.(data.entry, event)}
		>
			{data.kind === 'directory' && node.isInternal ? (
				<button
					type='button'
					tabIndex={-1}
					className='hover:bg-base-300 inline-flex size-6 shrink-0 items-center justify-center rounded-sm'
					aria-label={node.isOpen ? messages.collapse : messages.expand}
					title={node.isOpen ? messages.collapse : messages.expand}
					onClick={(event) => {
						event.stopPropagation();
						node.toggle();
					}}
					onDoubleClick={(event) => event.stopPropagation()}
				>
					{node.isOpen ? (
						<ChevronDown aria-hidden='true' className='size-4' />
					) : (
						<ChevronRight aria-hidden='true' className='size-4' />
					)}
				</button>
			) : (
				<span
					className='inline-flex size-6 shrink-0'
					title={data.kind === 'directory' ? messages.maxDepth : undefined}
				/>
			)}
			{renderIcon?.(data.entry, renderState) ?? defaultIcon}
			<span className='max-w-80 truncate'>{renderLabel?.(data.entry, renderState) ?? data.name}</span>
			{rejectedDropTarget ? (
				<CircleSlash2 aria-label={rejectedDropTarget.reason} className='text-error ml-1 size-3.5 shrink-0' />
			) : null}
			{directoryError ? (
				<>
					<TriangleAlert
						aria-label={formatFileTreeDirectoryError(data, messages)}
						className='text-error ml-1 size-4 shrink-0'
					/>
					<button
						type='button'
						className='hover:bg-base-300 inline-flex size-6 shrink-0 items-center justify-center rounded-sm'
						aria-label={messages.retry}
						title={messages.retry}
						onClick={(event) => {
							event.stopPropagation();
							onRetry(data.path);
						}}
						onDoubleClick={(event) => event.stopPropagation()}
					>
						<RotateCcw aria-hidden='true' className='size-3.5' />
					</button>
				</>
			) : null}
		</div>
	);
}
