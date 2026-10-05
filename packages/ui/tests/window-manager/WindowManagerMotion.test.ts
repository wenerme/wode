import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { WindowManagerMotionSurface } from '../../src/components/window-manager/WindowManagerMotion';
import { getWindowManagerConstrainedResize, getWindowManagerDragPosition, getWindowManagerResizePosition } from '../../src/components/window-manager/WindowManagerMotionGeometry';

test('applies window translation from the workspace origin', () => {
	const markup = renderToStaticMarkup(createElement(WindowManagerMotionSurface, {
		children: createElement('div', null, 'Window content'),
		maxHeight: 600,
		maxWidth: 800,
		minHeight: 100,
		minWidth: 100,
		movementBounds: { x: 0, y: 0, width: 800, height: 600 },
		position: { x: 120, y: 72 },
		size: { width: 400, height: 300 },
	}));
	expect(markup).toContain('position:absolute');
	expect(markup).toContain('transform:translate(120px, 72px)');
});

describe('window drag geometry', () => {
	const session = { originX: 100, originY: 80, startX: 300, startY: 200, minX: 0, minY: 0, maxX: 500, maxY: 360 };
	test.each([[{ x: 340, y: 230 }, { x: 140, y: 110 }], [{ x: 0, y: 0 }, { x: 0, y: 0 }], [{ x: 900, y: 900 }, { x: 500, y: 360 }]] as const)('clamps pointer movement to the workspace', (pointer, expected) => {
		expect(getWindowManagerDragPosition(session, pointer)).toEqual(expected);
	});
});

describe('window resize geometry', () => {
	const common = { bounds: { x: 80, y: 20, width: 920, height: 680 }, minWidth: 240, minHeight: 160, maxWidth: 920, maxHeight: 680 };
	test('keeps the right and bottom edges inside the workspace', () => {
		expect(getWindowManagerConstrainedResize({ ...common, direction: 'bottomRight', origin: { x: 700, y: 500, width: 300, height: 200 }, requested: { width: 800, height: 600 } })).toEqual({ x: 700, y: 500, width: 300, height: 200 });
	});
	test('keeps opposite edges fixed for top-left resizing', () => {
		expect(getWindowManagerConstrainedResize({ ...common, direction: 'topLeft', origin: { x: 180, y: 120, width: 300, height: 220 }, requested: { width: 900, height: 700 } })).toEqual({ x: 80, y: 20, width: 400, height: 320 });
	});
	test.each([['right', { x: 100, y: 80 }], ['bottom', { x: 100, y: 80 }], ['bottomRight', { x: 100, y: 80 }], ['left', { x: 60, y: 80 }], ['top', { x: 100, y: 50 }], ['topLeft', { x: 60, y: 50 }], ['bottomLeft', { x: 60, y: 80 }], ['topRight', { x: 100, y: 50 }]] as const)('keeps the opposite edge fixed when resizing from %s', (direction, expected) => {
		expect(getWindowManagerResizePosition({ x: 100, y: 80 }, direction, { width: 40, height: 30 })).toEqual(expected);
	});
});
