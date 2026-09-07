import { expect, userEvent, waitFor, within } from 'storybook/test';

export async function navigateTo(canvas: ReturnType<typeof within>, path: string) {
	await userEvent.click(canvas.getByRole('button', { name: '编辑路径' }));
	const address = canvas.getByRole('textbox', { name: '当前位置' });
	await userEvent.clear(address);
	await userEvent.type(address, path);
	await userEvent.keyboard('{Enter}');
}

export async function waitForOperation(canvas: ReturnType<typeof within>) {
	await waitFor(() => expect(canvas.queryByText(/正在执行/)).not.toBeInTheDocument());
}

export async function ensureSelected(canvas: ReturnType<typeof within>, name: string) {
	const checkbox = canvas.getByRole('checkbox', { name: `选择 ${name}` }) as HTMLInputElement;
	if (!checkbox.checked) await userEvent.click(checkbox);
}

export function createStoryDataTransfer(files: File[] = []): DataTransfer {
	const dataTransfer = new DataTransfer();
	for (const file of files) dataTransfer.items.add(file);
	if (files.length && !Array.from(dataTransfer.types).includes('Files')) {
		Object.defineProperty(dataTransfer, 'types', { configurable: true, value: ['Files'] });
	}
	return dataTransfer;
}

export function dispatchStoryDrag(
	target: HTMLElement,
	type: 'dragover' | 'dragstart' | 'drop',
	dataTransfer: DataTransfer,
	init: Pick<DragEventInit, 'altKey' | 'ctrlKey'> = {},
): boolean {
	const DragEventConstructor = target.ownerDocument.defaultView?.DragEvent ?? DragEvent;
	return target.dispatchEvent(
		new DragEventConstructor(type, { ...init, bubbles: true, cancelable: true, dataTransfer }),
	);
}

export function getDirectPanels(group: HTMLElement | null): HTMLElement[] {
	return Array.from(group?.children ?? []).filter(
		(element): element is HTMLElement => element instanceof HTMLElement && element.dataset.slot === 'resizable-panel',
	);
}

export function getDirectSeparators(group: HTMLElement | null): HTMLElement[] {
	return Array.from(group?.children ?? []).filter(
		(element): element is HTMLElement => element instanceof HTMLElement && element.getAttribute('role') === 'separator',
	);
}

export function getResizeHandle(root: HTMLElement, idFragment: string): HTMLElement {
	const handle = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]')).find((element) =>
		element.dataset.testid?.includes(idFragment),
	);
	if (!handle) throw new Error(`Missing resize handle containing ${idFragment}`);
	return handle;
}

export function getResizePanel(root: HTMLElement, idFragment: string): HTMLElement {
	const panel = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')).find((element) =>
		element.dataset.testid?.endsWith(idFragment),
	);
	if (!panel) throw new Error(`Missing resize panel ending with ${idFragment}`);
	return panel;
}

export function hasOrientation(orientation: 'horizontal' | 'vertical') {
	return (element: HTMLElement) => element.getAttribute('aria-orientation') === orientation;
}
