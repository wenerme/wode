import { describe, expect, it } from 'vite-plus/test';
import {
	getWindowManagerConstrainedResize,
	getWindowManagerDragPosition,
	getWindowManagerResizePosition,
} from './window-manager-motion';

describe('window manager drag geometry', () => {
	const session = { originX: 100, originY: 80, startX: 300, startY: 200, minX: 0, minY: 0, maxX: 500, maxY: 360 };

	it.each([
		[
			{ x: 340, y: 230 },
			{ x: 140, y: 110 },
		],
		[
			{ x: 0, y: 0 },
			{ x: 0, y: 0 },
		],
		[
			{ x: 900, y: 900 },
			{ x: 500, y: 360 },
		],
	] as const)('applies pointer delta and parent bounds', (pointer, expected) => {
		expect(getWindowManagerDragPosition(session, pointer)).toEqual(expected);
	});
});

describe('window manager constrained resize geometry', () => {
	const common = {
		bounds: { x: 80, y: 20, width: 920, height: 680 },
		minWidth: 240,
		minHeight: 160,
		maxWidth: 920,
		maxHeight: 680,
	};

	it('keeps the right and bottom edges inside the workspace', () => {
		expect(
			getWindowManagerConstrainedResize({
				...common,
				direction: 'bottomRight',
				origin: { x: 700, y: 500, width: 300, height: 200 },
				requested: { width: 800, height: 600 },
			}),
		).toEqual({ x: 700, y: 500, width: 300, height: 200 });
	});

	it('anchors fixed right and bottom edges while constraining top-left resize', () => {
		expect(
			getWindowManagerConstrainedResize({
				...common,
				direction: 'topLeft',
				origin: { x: 180, y: 120, width: 300, height: 220 },
				requested: { width: 900, height: 700 },
			}),
		).toEqual({ x: 80, y: 20, width: 400, height: 320 });
	});

	it('honors configured minimum and maximum sizes within directional space', () => {
		expect(
			getWindowManagerConstrainedResize({
				...common,
				direction: 'bottomRight',
				origin: { x: 200, y: 100, width: 300, height: 240 },
				requested: { width: 20, height: 10 },
			}),
		).toEqual({ x: 200, y: 100, width: 240, height: 160 });
	});
});

describe('window manager resize geometry', () => {
	it.each([
		['right', { x: 100, y: 80 }],
		['bottom', { x: 100, y: 80 }],
		['bottomRight', { x: 100, y: 80 }],
		['left', { x: 60, y: 80 }],
		['top', { x: 100, y: 50 }],
		['topLeft', { x: 60, y: 50 }],
		['bottomLeft', { x: 60, y: 80 }],
		['topRight', { x: 100, y: 50 }],
	] as const)('anchors the opposite edges when resizing %s', (direction, expected) => {
		expect(getWindowManagerResizePosition({ x: 100, y: 80 }, direction, { width: 40, height: 30 })).toEqual(expected);
	});
});
