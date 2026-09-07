/** @vitest-environment jsdom */

import { act, Suspense, startTransition } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { useStableListEntries } from './use-stable-list-entries';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe('useStableListEntries', () => {
	it('preserves committed keys across edits, reorder, deletion, and an abandoned render', async () => {
		const first = { name: 'first' };
		const second = { name: 'second' };
		const blocked = new Promise<void>(() => undefined);
		const render = (items: readonly { name: string }[], suspend = false) => (
			<Suspense fallback={<span>pending</span>}>
				<List items={items} />
				<SuspendAfter enabled={suspend} promise={blocked} />
			</Suspense>
		);

		await act(async () => root.render(render([first, second])));
		const firstNode = row('first');
		const secondNode = row('second');
		await act(async () => root.render(render([{ ...first, name: 'edited' }, second])));
		expect(row('edited')).toBe(firstNode);
		await act(async () => {
			startTransition(() => root.render(render([second], true)));
			await Promise.resolve();
		});
		await act(async () => root.render(render([first, second])));
		expect(row('first')).toBe(firstNode);
		expect(row('second')).toBe(secondNode);
		await act(async () => root.render(render([second])));
		expect(row('second')).toBe(secondNode);
	});
});

function List({ items }: { items: readonly { name: string }[] }) {
	const entries = useStableListEntries(items, 'test-row');
	return entries.map(({ item, key }) => <input key={key} aria-label={item.name} value={item.name} readOnly />);
}

function SuspendAfter({ enabled, promise }: { enabled: boolean; promise: Promise<void> }) {
	if (enabled) throw promise;
	return null;
}

function row(label: string) {
	const element = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
	if (!element) throw new Error(`row ${label} missing`);
	return element;
}
