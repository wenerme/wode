'use client';

import { useFileManagerRegistry } from '@components/file-viewer/file-manager-registry';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@ui/resizable';
import { type ReactNode, type RefObject, useRef } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import type { FileManagerProps } from './file-manager';
import { useFileManagerActions, useFileManagerStore } from './file-manager-context';
import type { FileManagerDragAndDropController } from './file-manager-drag-drop';
import { FileManagerListing } from './file-manager-listing';
import { FileManagerPreview } from './file-manager-preview';
import { FileManagerSidebar } from './file-manager-sidebar';
import type { FileManagerFileStat, FileManagerPlace } from './file-manager-types';

export type FileManagerWorkspaceProps = {
	busy: boolean;
	dragAndDrop: FileManagerDragAndDropController;
	emptyState?: ReactNode;
	entries: FileManagerFileStat[];
	maxPreviewBytes?: number;
	onActivateEntry?: FileManagerProps['onActivateEntry'];
	onOpen: (entry: FileManagerFileStat) => void;
	onSelect: (entry: FileManagerFileStat, options?: { range?: boolean; toggle?: boolean }) => void;
	orientation: 'horizontal' | 'vertical';
	panelId: string;
	places?: FileManagerPlace[];
	previewPanelRef: RefObject<PanelImperativeHandle | null>;
	renderPreview?: FileManagerProps['renderPreview'];
	saveRunning: boolean;
	selectedEntry?: FileManagerFileStat;
	selectionMode: 'multiple' | 'single';
	showFileTree: boolean;
	sidebarPanelRef: RefObject<PanelImperativeHandle | null>;
	treeDirectoriesOnly: boolean;
	visiblePaths: string[];
	workspaceRef: RefObject<HTMLDivElement | null>;
};

export function FileManagerWorkspace({
	busy,
	dragAndDrop,
	emptyState,
	entries,
	maxPreviewBytes,
	onActivateEntry,
	onOpen,
	onSelect,
	orientation,
	panelId,
	places,
	previewPanelRef,
	renderPreview,
	saveRunning,
	selectedEntry,
	selectionMode,
	showFileTree,
	sidebarPanelRef,
	treeDirectoriesOnly,
	visiblePaths,
	workspaceRef,
}: FileManagerWorkspaceProps) {
	const manager = useFileManagerRegistry();
	const actions = useFileManagerActions();
	const state = useFileManagerStore((current) => current);
	const sidebarResizeOrientationRef = useRef<string | undefined>(undefined);
	const previewResizeOrientationRef = useRef<string | undefined>(undefined);
	const preview = <FileManagerPreview entry={selectedEntry} manager={manager} maxPreviewBytes={maxPreviewBytes} />;
	const currentDirectoryDropProps = dragAndDrop.getDropTargetProps({
		kind: 'directory',
		path: state.navigation.path,
	});
	return (
		<div ref={workspaceRef} className='min-h-0 min-w-0 flex-1'>
			<ResizablePanelGroup id={`${panelId}-workspace-${orientation}`} orientation={orientation}>
				<ResizablePanel
					id={`${panelId}-places-${orientation}`}
					className='relative'
					style={{ overflow: 'hidden' }}
					collapsible
					collapsedSize={0}
					defaultSize={state.view.sidebarOpen ? (orientation === 'horizontal' ? '15rem' : '42%') : 0}
					minSize={orientation === 'horizontal' ? '11rem' : '30%'}
					maxSize={orientation === 'horizontal' ? '24rem' : '60%'}
					groupResizeBehavior='preserve-pixel-size'
					panelRef={sidebarPanelRef}
					onResize={(size) => {
						if (sidebarResizeOrientationRef.current !== orientation) {
							sidebarResizeOrientationRef.current = orientation;
							return;
						}
						const open = size.inPixels > 0;
						if (open !== state.view.sidebarOpen) actions.setSidebarOpen(open);
					}}
				>
					<div
						className='size-full min-h-0 overflow-hidden'
						aria-hidden={!state.view.sidebarOpen}
						inert={!state.view.sidebarOpen}
					>
						<FileManagerSidebar
							busy={busy}
							directoriesOnly={treeDirectoriesOnly}
							dragAndDrop={dragAndDrop}
							onActivateEntry={onActivateEntry}
							orientation={orientation}
							panelId={panelId}
							places={places}
							showTree={showFileTree}
						/>
					</div>
				</ResizablePanel>
				<ResizableHandle id={`${panelId}-places-handle-${orientation}`} />
				<ResizablePanel
					id={`${panelId}-listing-${orientation}`}
					className='relative'
					style={{ overflow: 'hidden' }}
					defaultSize={orientation === 'vertical' ? '42%' : undefined}
					minSize={orientation === 'horizontal' ? '18rem' : '25%'}
				>
					<div
						{...currentDirectoryDropProps}
						data-file-manager-drop-zone=''
						className='relative h-full min-h-0 min-w-0 overflow-auto'
					>
						<FileManagerListing
							dragAndDrop={dragAndDrop}
							disabled={busy}
							emptyState={emptyState}
							entries={entries}
							multiple={selectionMode === 'multiple'}
							onOpen={onOpen}
							onSelect={onSelect}
							selectedPaths={state.selection.paths}
							visiblePaths={visiblePaths}
						/>
						{dragAndDrop.drop?.path === state.navigation.path ? (
							<div
								className={cn(
									'pointer-events-none absolute inset-1 z-20 grid place-items-center rounded-sm ring-2 ring-inset',
									dragAndDrop.drop.state === 'accepted' ? 'bg-info/12 ring-info' : 'bg-error/10 ring-error/60',
								)}
							>
								<div
									className={cn(
										'bg-base-100/95 rounded-md border px-3 py-2 text-sm font-medium shadow-sm',
										dragAndDrop.drop.state === 'accepted' ? 'border-info/35' : 'border-error/35 text-error',
									)}
								>
									{dragAndDrop.drop.state === 'accepted'
										? `${getDropActionLabel(dragAndDrop.drop.mode)}到当前目录`
										: dragAndDrop.drop.reason}
								</div>
							</div>
						) : null}
					</div>
				</ResizablePanel>
				{state.capabilities.preview ? (
					<>
						<ResizableHandle id={`${panelId}-preview-handle-${orientation}`} disabled={saveRunning} />
						<ResizablePanel
							id={`${panelId}-preview-${orientation}`}
							className='relative'
							style={{ overflow: 'hidden' }}
							collapsible
							collapsedSize={0}
							defaultSize={state.view.previewOpen ? (orientation === 'horizontal' ? '19rem' : '40%') : 0}
							minSize={orientation === 'horizontal' ? '16rem' : '30%'}
							maxSize={orientation === 'horizontal' ? '36rem' : '60%'}
							groupResizeBehavior='preserve-pixel-size'
							disabled={saveRunning}
							panelRef={previewPanelRef}
							onResize={(size) => {
								if (previewResizeOrientationRef.current !== orientation) {
									previewResizeOrientationRef.current = orientation;
									return;
								}
								const open = size.inPixels > 0;
								if (open !== state.view.previewOpen) actions.setPreviewOpen(open);
							}}
						>
							<div
								className='size-full min-h-0 overflow-hidden'
								aria-hidden={!state.view.previewOpen}
								inert={!state.view.previewOpen}
							>
								<aside aria-label='文件预览' className='h-full min-h-0 overflow-hidden'>
									{renderPreview && selectedEntry
										? renderPreview({
												entry: selectedEntry,
												fileSystem: state.fileSystem,
												manager,
												defaultPreview: preview,
											})
										: preview}
								</aside>
							</div>
						</ResizablePanel>
					</>
				) : null}
			</ResizablePanelGroup>
		</div>
	);
}

function getDropActionLabel(mode: 'copy' | 'move' | 'upload'): string {
	return mode === 'copy' ? '复制' : mode === 'move' ? '移动' : '上传';
}
