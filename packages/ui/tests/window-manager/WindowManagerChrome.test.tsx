// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WindowManagerFrame, WindowManagerMenu, WindowManagerMenuItem } from '../../src/components/window-manager/WindowManagerChrome';

describe('WindowManagerFrame focus', () => {
	afterEach(cleanup);

	it('can receive mouse focus without entering the tab order', () => {
		const view = render(
			<div>
				<WindowManagerFrame><button type='button'>Inner control</button></WindowManagerFrame>
				<input aria-label='Outside input' />
			</div>,
		);
		const frame = view.container.querySelector('section');
		const inside = view.getByRole('button', { name: 'Inner control' });
		const outside = view.getByRole('textbox', { name: 'Outside input' });
		expect(frame?.tabIndex).toBe(-1);
		if (!frame) throw new Error('WindowManagerFrame was not rendered');
		fireEvent.mouseDown(frame);
		expect(document.activeElement).toBe(frame);
		inside.focus();
		expect(document.activeElement).toBe(inside);
		outside.focus();
		expect(document.activeElement).toBe(outside);
	});

	it('contains workspace fullscreen and extension menu items', () => {
		const onFullscreen = vi.fn();
		render(<WindowManagerMenu onFullscreen={onFullscreen} onPinnedChange={vi.fn()}><WindowManagerMenuItem>Extension action</WindowManagerMenuItem></WindowManagerMenu>);
		fireEvent.click(screen.getByRole('button', { name: 'Window menu' }));
		expect(screen.getByRole('menuitem', { name: 'Workspace fullscreen' })).toBeTruthy();
		expect(screen.getByRole('menuitem', { name: 'Extension action' })).toBeTruthy();
		fireEvent.click(screen.getByRole('menuitem', { name: 'Workspace fullscreen' }));
		expect(onFullscreen).toHaveBeenCalledOnce();
	});

	it('disables fullscreen when the capability is unavailable', () => {
		const onFullscreen = vi.fn();
		render(<WindowManagerMenu canFullscreen={false} onFullscreen={onFullscreen} onPinnedChange={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Window menu' }));
		const item = screen.getByRole('menuitem', { name: 'Workspace fullscreen' });
		expect(item.getAttribute('aria-disabled')).toBe('true');
		fireEvent.click(item);
		expect(onFullscreen).not.toHaveBeenCalled();
	});
});
