'use client';

import { useEffect, useRef } from 'react';
import {
	type FileManagerFileStat,
	type FileManagerFileSystem,
	type FileManagerStore,
	sanitizeFileManagerStat,
} from '../file-manager';
import { createSaveFilePickerTarget, getSelectedFilePickerEntries, matchesFilePickerAccept } from './file-picker-model';
import { FilePickerEventType, type FilePickerStore } from './file-picker-store';
import type {
	DirectoryPickerResult,
	FilePickerAcceptType,
	FilePickerMode,
	SaveFilePickerResult,
} from './file-picker-types';

type FilePickerRuntimeProps = {
	accept?: readonly FilePickerAcceptType[];
	fileManagerStore: FileManagerStore;
	fileSystem: FileManagerFileSystem;
	mode: FilePickerMode;
	messages: { noFile: string };
	multiple: boolean;
	onCancel?: () => void;
	onConfirm: (
		result: DirectoryPickerResult | FileManagerFileStat | FileManagerFileStat[] | SaveFilePickerResult,
	) => void;
	pickerStore: FilePickerStore;
};

export function FilePickerRuntime({
	accept,
	fileManagerStore,
	fileSystem,
	mode,
	messages,
	multiple,
	onCancel,
	onConfirm,
	pickerStore,
}: FilePickerRuntimeProps) {
	const callbacks = useRef({ onCancel, onConfirm });
	callbacks.current = { onCancel, onConfirm };

	useEffect(() => {
		const picker = pickerStore.getState();
		const offCancel = picker.events.on(FilePickerEventType.Cancel, () => {
			pickerStore.getState().actions.invalidate();
			callbacks.current.onCancel?.();
		});
		const offConfirm = picker.events.on(FilePickerEventType.Confirm, () => void confirm());
		const offOverwrite = picker.events.on(FilePickerEventType.ConfirmOverwrite, () => {
			const target = pickerStore.getState().overwrite.target;
			if (!target) return;
			pickerStore.getState().actions.clearOverwrite();
			callbacks.current.onConfirm(target);
		});
		const offFileManager = fileManagerStore.getState().events.on('request', ({ data }) => {
			if (data.type === 'load') pickerStore.getState().actions.beginNavigation();
		});
		const offFileManagerEvent = fileManagerStore.getState().events.on('event', ({ data }) => {
			if (data.type === 'navigated' || (data.type === 'error' && data.action === 'navigate')) {
				pickerStore.getState().actions.finishNavigation();
			}
		});

		async function confirm() {
			const fileManager = fileManagerStore.getState();
			const pickerState = pickerStore.getState();
			if (pickerState.navigation.pending || fileManager.listing.status === 'loading') return;
			const activeAccept = accept?.[pickerState.filter.acceptIndex];
			const acceptedTypes = activeAccept ? [activeAccept] : accept;
			const selectedDirectories = getSelectedFilePickerEntries(
				fileManager.listing.entries,
				fileManager.selection.paths,
				'directory',
			);
			if (mode === 'open') {
				const selected = getSelectedFilePickerEntries(
					fileManager.listing.entries.filter((entry) => matchesFilePickerAccept(entry, acceptedTypes)),
					fileManager.selection.paths,
					'file',
				);
				if (!selected.length) {
					if (selectedDirectories[0]) {
						pickerState.actions.beginNavigation();
						fileManager.actions.requestNavigate(selectedDirectories[0].path);
						return;
					}
					const id = pickerState.actions.beginRequest();
					pickerState.actions.failRequest(id, messages.noFile);
					return;
				}
				callbacks.current.onConfirm(multiple ? selected : selected[0]);
				return;
			}
			if (mode === 'directory') {
				callbacks.current.onConfirm({
					kind: 'directory',
					path: selectedDirectories[0]?.path ?? fileManager.navigation.path,
				});
				return;
			}
			if (selectedDirectories[0]) {
				pickerState.actions.beginNavigation();
				fileManager.actions.requestNavigate(selectedDirectories[0].path);
				return;
			}
			const id = pickerState.actions.beginRequest();
			const target = createSaveFilePickerTarget(fileManager.navigation.path, pickerStore.getState().input.name);
			if (target.error || !target.result) {
				pickerStore.getState().actions.failRequest(id, target.error ?? '文件名无效');
				return;
			}
			try {
				const exists = await fileSystem.exists(target.result.path);
				if (!isCurrent(id)) return;
				if (!exists) {
					pickerStore.getState().actions.finishRequest(id);
					callbacks.current.onConfirm(target.result);
					return;
				}
				const existing = sanitizeFileManagerStat(await fileSystem.stat(target.result.path), target.result.path);
				if (!isCurrent(id)) return;
				const checked = createSaveFilePickerTarget(fileManager.navigation.path, target.result.name, existing);
				if (checked.error || !checked.result) {
					pickerStore.getState().actions.failRequest(id, checked.error ?? '保存目标无效');
					return;
				}
				pickerStore.getState().actions.showOverwrite(id, checked.result);
			} catch (error) {
				if (isCurrent(id)) pickerStore.getState().actions.failRequest(id, getErrorMessage(error));
			}
		}

		function isCurrent(id: number) {
			return pickerStore.getState().request.id === id;
		}

		return () => {
			pickerStore.getState().actions.invalidate();
			offCancel();
			offConfirm();
			offOverwrite();
			offFileManager();
			offFileManagerEvent();
		};
	}, [accept, fileManagerStore, fileSystem, messages, mode, multiple, pickerStore]);
	return null;
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error && error.message ? error.message : '无法检查保存目标';
}
