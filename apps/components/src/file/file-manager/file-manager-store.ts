import Emittery from 'emittery';
import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';
import {
	getFileManagerOperationAdmissionError,
	normalizeRequestedFileManagerOperation,
} from './file-manager-operation-utils';
import {
	type CreateFileManagerStoreOptions,
	defaultFileManagerCapabilities,
	type FileManagerCapabilities,
	type FileManagerEventMap,
	type FileManagerHistoryMode,
	type FileManagerRequest,
	type FileManagerStoreState,
} from './file-manager-types';
import { getFileManagerParentPath, isFileManagerPathWithinRoot, normalizeFileManagerPath } from './file-manager-utils';

export function createFileManagerStore(options: CreateFileManagerStoreOptions) {
	const rootPath = normalizeFileManagerPath(options.rootPath ?? '/');
	const requestedPath = normalizeFileManagerPath(options.initialPath ?? rootPath);
	const initialPath = isFileManagerPathWithinRoot(requestedPath, rootPath) ? requestedPath : rootPath;
	const events = new Emittery<FileManagerEventMap>();

	return createStore(
		mutative<FileManagerStoreState>((setState, getState) => {
			const emitRequest = (request: FileManagerRequest) => {
				void events.emit('request', request);
			};
			const emitSelection = () => {
				void events.emit('event', { type: 'selection-changed', paths: [...getState().selection.paths] });
			};

			return {
				fileSystem: options.fileSystem,
				rootPath,
				capabilities: { ...defaultFileManagerCapabilities, ...options.capabilities },
				navigation: { path: initialPath, address: initialPath, history: [initialPath], index: 0 },
				listing: { entries: [], status: 'idle', requestId: 0 },
				selection: { paths: [] },
				view: {
					mode: options.viewMode ?? 'list',
					previewOpen: options.capabilities?.preview ?? true,
					query: '',
					sidebarOpen: true,
					sortBy: 'name',
					sortDirection: 'asc',
				},
				operation: { nextRequestId: 0, status: 'idle' },
				preview: {},
				dialog: null,
				events,
				actions: {
					back: () => {
						const { history, index } = getState().navigation;
						if (index <= 0) return;
						emitRequest({ type: 'load', path: history[index - 1], history: { type: 'traverse', index: index - 1 } });
					},
					beginListing: (path) => {
						let requestId = 0;
						setState((state) => {
							state.listing.requestId += 1;
							requestId = state.listing.requestId;
							state.listing.requestedPath = path;
							state.listing.status = 'loading';
							state.listing.error = undefined;
						});
						return requestId;
					},
					cancelOperation: () => {
						const state = getState();
						if (state.operation.status !== 'running' || state.operation.activeRequestId === undefined) return;
						emitRequest({
							type: 'cancel-operation',
							fileSystem: state.fileSystem,
							requestId: state.operation.activeRequestId,
						});
					},
					clearError: () => {
						setState((state) => {
							state.listing.error = undefined;
							state.operation.error = undefined;
							state.operation.notice = undefined;
							if (state.operation.status === 'error') state.operation.status = 'idle';
						});
					},
					closeDialog: () => setState((state) => void (state.dialog = null)),
					completeListing: (requestId, path, entries, history) => {
						if (getState().listing.requestId !== requestId) return false;
						let selectionChanged = false;
						setState((state) => {
							const previousSelection = state.selection.paths;
							const availablePaths = new Set(entries.map((entry) => entry.path));
							const nextSelection =
								state.navigation.path === path ? previousSelection.filter((item) => availablePaths.has(item)) : [];
							state.listing.entries = entries;
							state.listing.status = 'ready';
							state.listing.error = undefined;
							state.listing.requestedPath = undefined;
							state.navigation.path = path;
							state.navigation.address = path;
							applyHistory(state.navigation, path, history);
							selectionChanged =
								previousSelection.length !== nextSelection.length ||
								previousSelection.some((item, index) => item !== nextSelection[index]);
							state.selection.paths = nextSelection;
							if (!nextSelection.includes(state.selection.anchorPath ?? ''))
								state.selection.anchorPath = nextSelection[0];
						});
						void events.emit('event', { type: 'navigated', path });
						if (selectionChanged) emitSelection();
						return true;
					},
					failListing: (requestId, error) => {
						if (getState().listing.requestId !== requestId) return false;
						setState((state) => {
							state.listing.status = 'error';
							state.listing.error = error;
							state.listing.requestedPath = undefined;
						});
						return true;
					},
					dismissOperationFeedback: () => {
						setState((state) => {
							state.operation.feedback = undefined;
							state.operation.error = undefined;
							if (state.operation.status === 'error') state.operation.status = 'idle';
						});
					},
					finishOperation: (requestId, operation, outcome, options = {}) => {
						setState((state) => {
							if (state.operation.status !== 'running' || state.operation.activeRequestId !== requestId) return;
							const operationKind = operation.type;
							state.operation.status = outcome === 'failed' ? 'error' : 'idle';
							state.operation.error = options.error ? getOperationErrorMessage(options.error) : undefined;
							state.operation.active = undefined;
							state.operation.activeRequestId = undefined;
							state.operation.kind = undefined;
							state.operation.feedback = {
								error: options.error,
								operation,
								outcome,
								result: options.result,
							};
							if (operationKind === 'save-text' && state.preview.pendingSavePath) {
								const path = state.preview.pendingSavePath;
								state.preview.pendingSavePath = undefined;
								if (outcome === 'succeeded') {
									if (state.preview.draft?.path === path) state.preview.draft = undefined;
									state.preview.saveError = undefined;
								} else {
									state.preview.saveError = {
										message:
											outcome === 'cancelled'
												? '保存已取消'
												: options.error
													? getOperationErrorMessage(options.error)
													: '保存失败',
										path,
									};
								}
							}
						});
					},
					forward: () => {
						const { history, index } = getState().navigation;
						if (index >= history.length - 1) return;
						emitRequest({ type: 'load', path: history[index + 1], history: { type: 'traverse', index: index + 1 } });
					},
					open: (entry) => {
						const state = getState();
						emitRequest({
							type: 'open',
							directory: state.navigation.path,
							entry,
							fileSystem: state.fileSystem,
							listingRequestId: state.listing.requestId,
							rootPath: state.rootPath,
						});
					},
					openDialog: (dialog) => setState((state) => void (state.dialog = dialog)),
					refresh: () => emitRequest({ type: 'load', path: getState().navigation.path, history: { type: 'none' } }),
					replaceFileSystem: (fileSystem, nextRootPath, nextInitialPath) => {
						const normalizedRoot = normalizeFileManagerPath(nextRootPath);
						const normalizedInitial = normalizeFileManagerPath(nextInitialPath ?? normalizedRoot);
						const path = isFileManagerPathWithinRoot(normalizedInitial, normalizedRoot)
							? normalizedInitial
							: normalizedRoot;
						const hadSelection = getState().selection.paths.length > 0;
						setState((state) => {
							const nextOperationRequestId = state.operation.nextRequestId;
							state.fileSystem = fileSystem;
							state.rootPath = normalizedRoot;
							state.navigation = { path, address: path, history: [path], index: 0 };
							state.listing = { entries: [], status: 'idle', requestId: state.listing.requestId + 1 };
							state.selection = { paths: [] };
							state.operation = { nextRequestId: nextOperationRequestId, status: 'idle' };
							state.preview = {};
							state.dialog = null;
						});
						if (hadSelection) emitSelection();
						emitRequest({ type: 'load', path, history: { type: 'replace' } });
					},
					requestNavigate: (path, history = { type: 'push' }) => {
						const normalized = normalizeFileManagerPath(path);
						if (!isFileManagerPathWithinRoot(normalized, getState().rootPath)) {
							setState((state) => {
								state.listing.error = `路径超出根目录：${normalized}`;
								state.listing.status = 'error';
							});
							return;
						}
						emitRequest({ type: 'load', path: normalized, history });
					},
					requestOperation: (requestedOperation) => {
						if (getState().operation.status === 'running') return;
						const admissionError = getFileManagerOperationAdmissionError(requestedOperation);
						if (admissionError) {
							setState((state) => {
								state.operation.notice = admissionError;
							});
							return;
						}
						const operation = normalizeRequestedFileManagerOperation(requestedOperation);
						setState((state) => {
							state.operation.nextRequestId += 1;
							state.operation = {
								active: operation,
								activeRequestId: state.operation.nextRequestId,
								kind: operation.type,
								nextRequestId: state.operation.nextRequestId,
								status: 'running',
							};
							if (operation.type === 'save-text') {
								state.preview.pendingSavePath = operation.path;
								state.preview.saveError = undefined;
							}
							state.dialog = null;
						});
						const state = getState();
						emitRequest({
							type: 'operation',
							fileSystem: state.fileSystem,
							operation,
							requestId: state.operation.activeRequestId as number,
							rootPath: state.rootPath,
						});
					},
					select: (path, selectOptions = {}) => {
						setState((state) => {
							const visiblePaths = selectOptions.visiblePaths ?? state.listing.entries.map((entry) => entry.path);
							if (selectOptions.range && state.selection.anchorPath) {
								const start = visiblePaths.indexOf(state.selection.anchorPath);
								const end = visiblePaths.indexOf(path);
								if (start >= 0 && end >= 0) {
									const [from, to] = start < end ? [start, end] : [end, start];
									state.selection.paths = visiblePaths.slice(from, to + 1);
									return;
								}
							}
							if (selectOptions.toggle) {
								const index = state.selection.paths.indexOf(path);
								if (index >= 0) state.selection.paths.splice(index, 1);
								else state.selection.paths.push(path);
							} else {
								state.selection.paths = [path];
							}
							state.selection.anchorPath = path;
						});
						emitSelection();
					},
					selectAll: (paths) => {
						setState((state) => {
							state.selection.paths = [...paths];
							state.selection.anchorPath = paths[0];
						});
						emitSelection();
					},
					setAddress: (value) => setState((state) => void (state.navigation.address = value)),
					setCapabilities: (capabilities: Partial<FileManagerCapabilities>) => {
						setState((state) => {
							Object.assign(state.capabilities, capabilities);
							if (!state.capabilities.preview) state.view.previewOpen = false;
						});
					},
					setDialogValue: (value) => {
						setState((state) => {
							if (state.dialog && 'value' in state.dialog) state.dialog.value = value;
							else if (state.dialog?.type === 'transfer') state.dialog.destination = value;
						});
					},
					setOperationNotice: (notice) => {
						setState((state) => {
							state.operation.notice = notice;
						});
					},
					setPreviewDraft: (draft) => setState((state) => void (state.preview.draft = draft)),
					setPreviewOpen: (open) => setState((state) => void (state.view.previewOpen = open)),
					setPreviewSaveError: (path, message) => {
						setState((state) => {
							state.preview.saveError = message ? { message, path } : undefined;
						});
					},
					setQuery: (query) => setState((state) => void (state.view.query = query)),
					setSidebarOpen: (open) => setState((state) => void (state.view.sidebarOpen = open)),
					setSort: (by, direction) => {
						setState((state) => {
							if (state.view.sortBy === by && !direction) {
								state.view.sortDirection = state.view.sortDirection === 'asc' ? 'desc' : 'asc';
							} else {
								state.view.sortBy = by;
								state.view.sortDirection = direction ?? 'asc';
							}
						});
					},
					setViewMode: (mode) => setState((state) => void (state.view.mode = mode)),
					up: () => {
						const state = getState();
						if (state.navigation.path === state.rootPath) return;
						const parent = getFileManagerParentPath(state.navigation.path);
						emitRequest({
							type: 'load',
							path: isFileManagerPathWithinRoot(parent, state.rootPath) ? parent : state.rootPath,
							history: { type: 'push' },
						});
					},
				},
			};
		}),
	);
}

function applyHistory(navigation: FileManagerStoreState['navigation'], path: string, history: FileManagerHistoryMode) {
	if (history.type === 'none') return;
	if (history.type === 'replace') {
		navigation.history = [path];
		navigation.index = 0;
		return;
	}
	if (history.type === 'traverse') {
		navigation.index = Math.max(0, Math.min(history.index, navigation.history.length - 1));
		return;
	}
	if (navigation.history[navigation.index] === path) return;
	navigation.history = navigation.history.slice(0, navigation.index + 1);
	navigation.history.push(path);
	navigation.index = navigation.history.length - 1;
}

function getOperationErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
