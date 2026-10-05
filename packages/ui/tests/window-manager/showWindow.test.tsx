// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { getRootWindow, type ShownWindow, showWindow } from '../../src/components/window-manager/showWindow';
import { WindowManagerProvider } from '../../src/components/window-manager/WindowManagerContext';
import { WindowManagerHost } from '../../src/components/window-manager/WindowManagerHost';
import { createWindowManagerStore } from '../../src/components/window-manager/WindowManagerStore';

afterEach(cleanup);

test('opens rendered windows through the generic showWindow registry', () => {
	const store = createWindowManagerStore();
	const fallback = vi.fn(() => <div>Host content</div>);
	render(<WindowManagerProvider root store={store}><WindowManagerHost renderContent={fallback} /></WindowManagerProvider>);
	const options = { key: 'edit:1', title: 'Edit record', icon: <span data-testid='window-icon'>Icon</span>, render: () => <div>Edit form</div> };
	let win!: ShownWindow;
	act(() => { win = showWindow(options); });
	expect(screen.getByText('Edit form')).toBeTruthy();
	expect(screen.getAllByTestId('window-icon')).toHaveLength(2);
	expect(fallback).not.toHaveBeenCalled();
	expect(store.getState().windows[win.id]?.persistence).toBe('none');
	act(() => win.minimize());
	act(() => { expect(getRootWindow().open(options).id).toBe(win.id); });
	expect(store.getState().windows[win.id]?.mode).toBe('normal');
	act(() => win.close());
	expect(screen.queryByText('Edit form')).toBeNull();
});

test('supports StrictMode mount timing and clears the root after unmount', () => {
	expect(() => getRootWindow()).toThrow('requires a mounted root');
	const store = createWindowManagerStore();
	function OpenOnMount() { useEffect(() => { showWindow({ key: 'mounted', title: 'Mounted', render: () => <div>Window content</div> }); }, []); return null; }
	const mounted = render(<StrictMode><WindowManagerProvider root store={store}><OpenOnMount /><WindowManagerHost /></WindowManagerProvider></StrictMode>);
	expect(screen.getByText('Window content')).toBeTruthy();
	expect(store.getState().order).toHaveLength(1);
	mounted.unmount();
	expect(() => showWindow({ title: 'Unmounted', render: () => null })).toThrow('requires a mounted root');
});
