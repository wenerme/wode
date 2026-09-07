import Emittery from 'emittery';
import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';
import type { SaveFilePickerResult } from './file-picker-types';

export const FilePickerEventType = {
	Cancel: 'FilePicker:Cancel',
	Confirm: 'FilePicker:Confirm',
	ConfirmOverwrite: 'FilePicker:ConfirmOverwrite',
} as const;

export type FilePickerEventData = {
	[FilePickerEventType.Cancel]: Record<string, never>;
	[FilePickerEventType.Confirm]: Record<string, never>;
	[FilePickerEventType.ConfirmOverwrite]: Record<string, never>;
};

export type FilePickerStoreState = {
	events: Emittery<FilePickerEventData>;
	filter: { acceptIndex: number };
	input: { name: string };
	navigation: { pending: boolean };
	overwrite: { target?: SaveFilePickerResult };
	request: { error?: string; id: number; status: 'idle' | 'checking' };
	actions: {
		beginRequest: () => number;
		beginNavigation: () => void;
		cancel: () => void;
		clearOverwrite: () => void;
		confirm: () => void;
		confirmOverwrite: () => void;
		failRequest: (id: number, error: string) => void;
		finishRequest: (id: number) => void;
		finishNavigation: () => void;
		invalidate: () => void;
		setAcceptIndex: (index: number) => void;
		setName: (name: string) => void;
		showOverwrite: (id: number, target: SaveFilePickerResult) => void;
	};
};

export type FilePickerStore = ReturnType<typeof createFilePickerStore>;

export function createFilePickerStore(options: { suggestedName?: string } = {}) {
	const events = new Emittery<FilePickerEventData>();
	return createStore(
		mutative<FilePickerStoreState>((setState) => ({
			events,
			filter: { acceptIndex: 0 },
			input: { name: options.suggestedName ?? '' },
			navigation: { pending: false },
			overwrite: {},
			request: { id: 0, status: 'idle' },
			actions: {
				beginNavigation: () =>
					setState((state) => {
						state.navigation.pending = true;
						state.request.id += 1;
						state.request.status = 'idle';
						state.request.error = undefined;
						state.overwrite.target = undefined;
					}),
				beginRequest: () => {
					let id = 0;
					setState((state) => {
						state.request.id += 1;
						id = state.request.id;
						state.request.status = 'checking';
						state.request.error = undefined;
						state.overwrite.target = undefined;
					});
					return id;
				},
				cancel: () => void events.emit(FilePickerEventType.Cancel, {}),
				clearOverwrite: () => setState((state) => void (state.overwrite.target = undefined)),
				confirm: () => void events.emit(FilePickerEventType.Confirm, {}),
				confirmOverwrite: () => void events.emit(FilePickerEventType.ConfirmOverwrite, {}),
				failRequest: (id, error) =>
					setState((state) => {
						if (state.request.id !== id) return;
						state.request.status = 'idle';
						state.request.error = error;
					}),
				finishRequest: (id) =>
					setState((state) => {
						if (state.request.id !== id) return;
						state.request.status = 'idle';
						state.request.error = undefined;
					}),
				finishNavigation: () => setState((state) => void (state.navigation.pending = false)),
				invalidate: () =>
					setState((state) => {
						state.request.id += 1;
						state.request.status = 'idle';
						state.request.error = undefined;
						state.overwrite.target = undefined;
						state.navigation.pending = false;
					}),
				setAcceptIndex: (index) =>
					setState((state) => {
						state.filter.acceptIndex = Math.max(0, Math.floor(index));
						state.request.id += 1;
						state.request.status = 'idle';
						state.request.error = undefined;
						state.overwrite.target = undefined;
					}),
				setName: (name) =>
					setState((state) => {
						state.input.name = name;
						state.request.id += 1;
						state.request.status = 'idle';
						state.request.error = undefined;
						state.overwrite.target = undefined;
					}),
				showOverwrite: (id, target) =>
					setState((state) => {
						if (state.request.id !== id) return;
						state.request.status = 'idle';
						state.overwrite.target = target;
					}),
			},
		})),
	);
}
