'use client';

import { ArrowDownAZ, FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import {
	FileManagerFileTypeIcon,
	getFileManagerFileTypeLabel,
	renderFileManagerFileType,
	useFileManagerRegistry,
} from '@components/file-viewer/file-manager-registry';
import { useFileManagerActions, useFileManagerStore } from './file-manager-context';
import type { FileManagerDragAndDropController } from './file-manager-drag-drop';
import type { FileManagerFileStat } from './file-manager-types';
import { formatFileManagerBytes, toFileManagerFileTypeInput } from './file-manager-utils';

export type FileManagerListingProps = {
	disabled: boolean;
	dragAndDrop: FileManagerDragAndDropController;
	emptyState?: ReactNode;
	entries: FileManagerFileStat[];
	multiple: boolean;
	onOpen: (entry: FileManagerFileStat) => void;
	onSelect: (entry: FileManagerFileStat, options?: { range?: boolean; toggle?: boolean }) => void;
	selectedPaths: string[];
	visiblePaths: string[];
};

export function FileManagerListing({
	disabled,
	dragAndDrop,
	emptyState,
	entries,
	multiple,
	onOpen,
	onSelect,
	selectedPaths,
	visiblePaths,
}: FileManagerListingProps) {
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
					const dropFeedback = dragAndDrop.drop?.path === entry.path ? dragAndDrop.drop : undefined;
					const dropProps = entry.kind === 'directory' ? dragAndDrop.getDropTargetProps(entry) : {};
					return (
						<div
							key={entry.path}
							{...dropProps}
							data-file-manager-entry-path={entry.path}
							data-file-manager-grid-item=''
							data-drop-state={dropFeedback?.state}
							data-drop-target={dropFeedback ? true : undefined}
							className={cn(
								'border-base-300 bg-base-100 data-[drop-state=accepted]:border-info data-[drop-state=accepted]:bg-info/15 data-[drop-state=accepted]:ring-info data-[drop-state=rejected]:border-error/60 data-[drop-state=rejected]:bg-error/10 data-[drop-state=rejected]:ring-error/50 relative h-28 w-36 flex-none rounded-md border p-2 data-[drop-target=true]:ring-1',
								selected ? 'border-primary bg-primary/8' : 'hover:bg-base-200/45',
							)}
							title={dropFeedback?.state === 'rejected' ? dropFeedback.reason : undefined}
							draggable={dragAndDrop.canDrag || undefined}
							onDragEnd={dragAndDrop.finishEntryDrag}
							onDragStart={(event) => dragAndDrop.startEntryDrag(entry, event)}
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
								<FileManagerEntryDisplay
									entry={entry}
									mode='grid'
									defaultDisplay={
										<>
											<FileManagerFileTypeIcon file={toFileManagerFileTypeInput(entry)} className='size-8' />
											<span className='mt-2 line-clamp-2 w-full text-xs font-medium break-all'>{entry.name}</span>
											<span className='text-base-content/45 mt-1 text-[10px]'>
												{entry.kind === 'directory' ? '目录' : formatFileManagerBytes(entry.size)}
											</span>
										</>
									}
								/>
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
					const dropFeedback = dragAndDrop.drop?.path === entry.path ? dragAndDrop.drop : undefined;
					const dropProps = entry.kind === 'directory' ? dragAndDrop.getDropTargetProps(entry) : {};
					return (
						<tr
							key={entry.path}
							{...dropProps}
							data-file-manager-entry-path={entry.path}
							data-drop-state={dropFeedback?.state}
							data-drop-target={dropFeedback ? true : undefined}
							className={cn(
								'data-[drop-state=accepted]:bg-info/15 data-[drop-state=accepted]:ring-info data-[drop-state=rejected]:bg-error/10 data-[drop-state=rejected]:text-base-content/50 data-[drop-state=rejected]:ring-error/50 data-[drop-target=true]:ring-1 data-[drop-target=true]:ring-inset',
								selected ? 'bg-primary/8' : 'hover:bg-base-200/45',
							)}
							title={dropFeedback?.state === 'rejected' ? dropFeedback.reason : undefined}
							draggable={dragAndDrop.canDrag || undefined}
							onDragEnd={dragAndDrop.finishEntryDrag}
							onDragStart={(event) => dragAndDrop.startEntryDrag(entry, event)}
						>
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
									<FileManagerEntryDisplay
										entry={entry}
										mode='list'
										defaultDisplay={
											<>
												<FileManagerFileTypeIcon file={toFileManagerFileTypeInput(entry)} className='size-4' />
												<span className='min-w-0 flex-1 truncate font-medium'>{entry.name}</span>
											</>
										}
									/>
								</button>
							</td>
							<td className='text-base-content/70 px-3 py-1.5 tabular-nums'>
								{entry.kind === 'directory' ? '—' : formatFileManagerBytes(entry.size)}
							</td>
							<td className='text-base-content/70 px-3 py-1.5'>
								<FileManagerEntryTypeLabel entry={entry} />
							</td>
							<td className='text-base-content/70 px-3 py-1.5 tabular-nums'>
								{entry.mtime ? new Date(entry.mtime).toLocaleString() : '—'}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

function FileManagerEntryDisplay({
	defaultDisplay,
	entry,
	mode,
}: {
	defaultDisplay: ReactNode;
	entry: FileManagerFileStat;
	mode: 'grid' | 'list';
}) {
	const manager = useFileManagerRegistry();
	const file = manager.fileTypes.resolveInput(toFileManagerFileTypeInput(entry));
	const fileType = manager.fileTypes.resolve(file);
	if (!fileType?.display) return defaultDisplay;
	return renderFileManagerFileType(fileType.display, { defaultDisplay, file, fileType, mode });
}

function FileManagerEntryTypeLabel({ entry }: { entry: FileManagerFileStat }) {
	const manager = useFileManagerRegistry();
	const file = manager.fileTypes.resolveInput(toFileManagerFileTypeInput(entry));
	const fileType = manager.fileTypes.resolve(file);
	return fileType ? getFileManagerFileTypeLabel(fileType, file) : '文件';
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
