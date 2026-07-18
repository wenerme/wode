import { describe, expect, it, vi } from 'vite-plus/test';
import { createFilePickerStore, FilePickerEventType } from './file-picker-store';

describe('file picker store', () => {
	it('groups mutable state and emits typed confirm/cancel requests', async () => {
		const store = createFilePickerStore({ suggestedName: 'draft.txt' });
		const confirm = vi.fn();
		const cancel = vi.fn();
		const offConfirm = store.getState().events.on(FilePickerEventType.Confirm, confirm);
		const offCancel = store.getState().events.on(FilePickerEventType.Cancel, cancel);
		store.getState().actions.confirm();
		store.getState().actions.cancel();
		await vi.waitFor(() => {
			expect(confirm).toHaveBeenCalledOnce();
			expect(cancel).toHaveBeenCalledOnce();
		});
		expect(store.getState().input.name).toBe('draft.txt');
		offConfirm();
		offCancel();
	});

	it('invalidates stale save checks when the filename changes', () => {
		const store = createFilePickerStore();
		const requestId = store.getState().actions.beginRequest();
		store.getState().actions.setName('next.txt');
		store.getState().actions.failRequest(requestId, 'stale');
		expect(store.getState().request.status).toBe('idle');
		expect(store.getState().request.error).toBeUndefined();
	});
});
