'use client';

import { type DragEvent, useRef, useState } from 'react';
import type { FileManagerCapabilities, FileManagerFileStat, FileManagerOperation } from './file-manager-types';
import { fileManagerUploadHardFileLimit } from './file-manager-types';
import { getFileManagerParentPath, isFileManagerDescendantPath, normalizeFileManagerPath } from './file-manager-utils';

export const fileManagerDragDataType = 'application/x-wode-file-manager';
const fileManagerDataTransferTypeLimit = 64;

export type FileManagerExternalDrop = {
	files: File[];
	rejected: Array<{ name: string; reason: 'directory' | 'too-many' | 'unreadable' }>;
};

export type FileManagerDropTarget = Pick<FileManagerFileStat, 'kind' | 'path'>;

export type FileManagerDropFeedback =
	| { mode: 'copy' | 'move' | 'upload'; path: string; state: 'accepted' }
	| { path: string; reason: string; state: 'rejected' };

export type FileManagerDropEvaluation =
	| { mode: 'copy' | 'move' | 'upload'; state: 'accepted' }
	| { reason: string; state: 'rejected' }
	| { state: 'ignored' };

export type EvaluateFileManagerDropTargetOptions = {
	busy: boolean;
	capabilities: Pick<FileManagerCapabilities, 'copy' | 'move' | 'upload'>;
	internalPaths: readonly string[];
	modifiers: Pick<DragEvent<HTMLElement>, 'altKey' | 'ctrlKey'>;
	source: 'external' | 'internal' | 'unknown';
	target: FileManagerDropTarget;
};

export type UseFileManagerDragAndDropOptions = {
	busy: boolean;
	capabilities: FileManagerCapabilities;
	clearIssue: () => void;
	reportIssue: (message: string) => void;
	requestOperation: (operation: FileManagerOperation) => void;
	selectedPaths: readonly string[];
	selectPath: (path: string) => void;
};

export function useFileManagerDragAndDrop({
	busy,
	capabilities,
	clearIssue,
	reportIssue,
	requestOperation,
	selectedPaths,
	selectPath,
}: UseFileManagerDragAndDropOptions) {
	const internalPaths = useRef<string[]>([]);
	const [drop, setDrop] = useState<FileManagerDropFeedback>();

	const startEntryDrag = (entry: FileManagerFileStat, event: DragEvent<HTMLElement>, select = true) => {
		if (busy || (!capabilities.copy && !capabilities.move)) {
			event.preventDefault();
			return;
		}
		const paths = selectedPaths.includes(entry.path) ? [...selectedPaths] : [entry.path];
		clearIssue();
		internalPaths.current = paths;
		if (select && !selectedPaths.includes(entry.path)) selectPath(entry.path);
		event.dataTransfer.effectAllowed =
			capabilities.copy && capabilities.move ? 'copyMove' : capabilities.copy ? 'copy' : 'move';
		event.dataTransfer.setData(fileManagerDragDataType, '1');
	};

	const finishEntryDrag = () => {
		internalPaths.current = [];
		setDrop(undefined);
	};

	const getDropTargetProps = (target: FileManagerDropTarget) => ({
		onDragEnter: (event: DragEvent<HTMLElement>) => updateDropTarget(target, event),
		onDragLeave: (event: DragEvent<HTMLElement>) => {
			if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
			setDrop((current) => (current?.path === target.path ? undefined : current));
		},
		onDragOver: (event: DragEvent<HTMLElement>) => updateDropTarget(target, event),
		onDrop: (event: DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			const source = resolveFileManagerDragSource(event.dataTransfer, internalPaths.current);
			const evaluation = evaluateFileManagerDropTarget({
				busy,
				capabilities,
				internalPaths: internalPaths.current,
				modifiers: event,
				source,
				target,
			});
			if (evaluation.state === 'rejected') {
				reportIssue(evaluation.reason);
				finishEntryDrag();
				return;
			}
			if (evaluation.state === 'ignored') {
				reportIssue('无法识别拖入内容');
				finishEntryDrag();
				return;
			}
			if (evaluation.mode === 'copy' || evaluation.mode === 'move') {
				clearIssue();
				requestOperation({
					type: evaluation.mode,
					paths: [...internalPaths.current],
					destination: normalizeFileManagerPath(target.path),
				});
			} else {
				const payload = extractFileManagerExternalDrop(event.dataTransfer);
				if (payload.files.length || payload.rejected.length) {
					clearIssue();
					requestOperation({ type: 'upload', directory: normalizeFileManagerPath(target.path), ...payload });
				} else {
					reportIssue('拖入内容中没有可上传的文件');
				}
			}
			finishEntryDrag();
		},
	});

	function updateDropTarget(target: FileManagerDropTarget, event: DragEvent<HTMLElement>) {
		const source = resolveFileManagerDragSource(event.dataTransfer, internalPaths.current);
		const evaluation = evaluateFileManagerDropTarget({
			busy,
			capabilities,
			internalPaths: internalPaths.current,
			modifiers: event,
			source,
			target,
		});
		if (evaluation.state === 'ignored') {
			setDrop(undefined);
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect =
			evaluation.state === 'accepted' ? (evaluation.mode === 'move' ? 'move' : 'copy') : 'none';
		const next: FileManagerDropFeedback =
			evaluation.state === 'accepted'
				? { mode: evaluation.mode, path: normalizeFileManagerPath(target.path), state: 'accepted' }
				: { path: normalizeFileManagerPath(target.path), reason: evaluation.reason, state: 'rejected' };
		setDrop((current) => (isSameFileManagerDropFeedback(current, next) ? current : next));
	}

	return {
		canDrag: !busy && (capabilities.copy || capabilities.move),
		drop,
		finishEntryDrag,
		getDropTargetProps,
		startEntryDrag,
	};
}

export type FileManagerDragAndDropController = ReturnType<typeof useFileManagerDragAndDrop>;

export function evaluateFileManagerDropTarget({
	busy,
	capabilities,
	internalPaths,
	modifiers,
	source,
	target,
}: EvaluateFileManagerDropTargetOptions): FileManagerDropEvaluation {
	if (source === 'unknown') return { state: 'ignored' };
	if (busy) return { reason: '当前有文件操作正在执行，请稍后重试', state: 'rejected' };
	if (target.kind !== 'directory') return { reason: '只能拖放到目录', state: 'rejected' };
	if (source === 'external') {
		return capabilities.upload
			? { mode: 'upload', state: 'accepted' }
			: { reason: '当前文件系统为只读或未启用上传', state: 'rejected' };
	}
	const mode = resolveFileManagerDropMode(modifiers, capabilities);
	if (!mode) return { reason: '当前不支持请求的复制或移动操作', state: 'rejected' };
	const destination = normalizeFileManagerPath(target.path);
	for (const sourcePath of internalPaths) {
		const normalizedSource = normalizeFileManagerPath(sourcePath);
		if (destination === normalizedSource || isFileManagerDescendantPath(normalizedSource, destination)) {
			return { reason: '不能将目录拖放到自身或其子目录', state: 'rejected' };
		}
		if (getFileManagerParentPath(normalizedSource) === destination) {
			return {
				reason: mode === 'move' ? '项目已位于目标目录' : '目标目录中已存在同名项目',
				state: 'rejected',
			};
		}
	}
	return { mode, state: 'accepted' };
}

export function extractFileManagerExternalDrop(dataTransfer: DataTransfer): FileManagerExternalDrop {
	const files: File[] = [];
	const rejected: FileManagerExternalDrop['rejected'] = [];
	const items = dataTransfer.items;
	const candidateCount = Math.max(items.length, dataTransfer.files.length);
	const overLimit = candidateCount > fileManagerUploadHardFileLimit;
	const itemLimit = Math.min(items.length, fileManagerUploadHardFileLimit - (overLimit ? 1 : 0));
	let containsDirectory = false;
	let unreadable = 0;
	for (let index = 0; index < itemLimit; index += 1) {
		const item = items[index];
		if (!item) continue;
		if (item.kind !== 'file') continue;
		try {
			const entry = (
				item as DataTransferItem & { webkitGetAsEntry?: () => { isDirectory: boolean; name: string } | null }
			).webkitGetAsEntry?.();
			if (entry?.isDirectory) {
				containsDirectory = true;
				rejected.push({ name: entry.name || '本地目录', reason: 'directory' });
				continue;
			}
			const file = item.getAsFile();
			if (file) files.push(file);
			else unreadable += 1;
		} catch {
			unreadable += 1;
		}
	}
	if (!files.length && !containsDirectory) {
		const fallbackLimit = Math.min(
			dataTransfer.files.length,
			Math.max(0, fileManagerUploadHardFileLimit - rejected.length - (overLimit ? 1 : 0)),
		);
		for (let index = 0; index < fallbackLimit; index += 1) {
			const file = dataTransfer.files[index];
			if (file) files.push(file);
		}
		unreadable = Math.max(0, unreadable - files.length);
	}
	if (unreadable) {
		rejected.push({
			name: unreadable === 1 ? '无法读取的拖入项目' : `${unreadable} 个无法读取的拖入项目`,
			reason: 'unreadable',
		});
	}
	if (overLimit) {
		rejected.push({
			name: `其余 ${candidateCount - fileManagerUploadHardFileLimit + 1} 个项目`,
			reason: 'too-many',
		});
	}
	return { files, rejected };
}

export function resolveFileManagerDropMode(
	modifiers: Pick<DragEvent<HTMLElement>, 'altKey' | 'ctrlKey'>,
	capabilities: Pick<FileManagerCapabilities, 'copy' | 'move'>,
): 'copy' | 'move' | undefined {
	if (modifiers.altKey || modifiers.ctrlKey) return capabilities.copy ? 'copy' : undefined;
	if (capabilities.move) return 'move';
	return capabilities.copy ? 'copy' : undefined;
}

function hasExternalFiles(dataTransfer: DataTransfer): boolean {
	if (hasBoundedDataTransferType(dataTransfer.types, 'files', true)) return true;
	if (dataTransfer.files.length > 0) return true;
	const limit = Math.min(dataTransfer.items.length, fileManagerUploadHardFileLimit);
	for (let index = 0; index < limit; index += 1) {
		if (dataTransfer.items[index]?.kind === 'file') return true;
	}
	return false;
}

function isInternalDrag(dataTransfer: DataTransfer): boolean {
	return hasBoundedDataTransferType(dataTransfer.types, fileManagerDragDataType);
}

function resolveFileManagerDragSource(
	dataTransfer: DataTransfer,
	internalPaths: readonly string[],
): EvaluateFileManagerDropTargetOptions['source'] {
	if (internalPaths.length > 0 && isInternalDrag(dataTransfer)) return 'internal';
	if (hasExternalFiles(dataTransfer)) return 'external';
	return 'unknown';
}

function isSameFileManagerDropFeedback(
	left: FileManagerDropFeedback | undefined,
	right: FileManagerDropFeedback,
): boolean {
	if (!left || left.path !== right.path || left.state !== right.state) return false;
	if (left.state === 'accepted' && right.state === 'accepted') return left.mode === right.mode;
	if (left.state === 'rejected' && right.state === 'rejected') return left.reason === right.reason;
	return false;
}

export function hasBoundedDataTransferType(
	types: Pick<DOMStringList, 'length'> & { [index: number]: string | undefined },
	target: string,
	ignoreCase = false,
): boolean {
	const expected = ignoreCase ? target.toLowerCase() : target;
	const limit = Math.min(types.length, fileManagerDataTransferTypeLimit);
	for (let index = 0; index < limit; index += 1) {
		const type = types[index];
		if (type && (ignoreCase ? type.toLowerCase() : type) === expected) return true;
	}
	return false;
}
