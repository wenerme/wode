import type { ResizeDirection } from 're-resizable';
export type WindowManagerMotionBounds = { height: number; width: number; x: number; y: number };
export type WindowManagerDragSession = { maxX: number; maxY: number; minX: number; minY: number; originX: number; originY: number; startX: number; startY: number };
export function getWindowManagerDragPosition(session: WindowManagerDragSession, pointer: { x: number; y: number }) { return { x: clamp(session.originX + pointer.x - session.startX, session.minX, session.maxX), y: clamp(session.originY + pointer.y - session.startY, session.minY, session.maxY) }; }
export function getWindowManagerConstrainedResize({ bounds, direction, maxHeight, maxWidth, minHeight, minWidth, origin, requested }: { bounds: WindowManagerMotionBounds; direction: ResizeDirection; maxHeight: number; maxWidth: number; minHeight: number; minWidth: number; origin: WindowManagerMotionBounds; requested: { height: number; width: number } }): WindowManagerMotionBounds {
	const value = direction.toLowerCase(); const fromLeft = value.includes('left'); const fromTop = value.includes('top'); const horizontal = fromLeft || value.includes('right'); const vertical = fromTop || value.includes('bottom');
	const fixedRight = origin.x + origin.width; const fixedBottom = origin.y + origin.height; const availableWidth = fromLeft ? fixedRight - bounds.x : bounds.x + bounds.width - origin.x; const availableHeight = fromTop ? fixedBottom - bounds.y : bounds.y + bounds.height - origin.y;
	const width = clamp(horizontal ? requested.width : origin.width, Math.min(minWidth, availableWidth), Math.min(maxWidth, availableWidth)); const height = clamp(vertical ? requested.height : origin.height, Math.min(minHeight, availableHeight), Math.min(maxHeight, availableHeight));
	return { x: fromLeft ? fixedRight - width : origin.x, y: fromTop ? fixedBottom - height : origin.y, width, height };
}
export function getWindowManagerResizePosition(origin: { x: number; y: number }, direction: ResizeDirection, delta: { height: number; width: number }) { return { x: origin.x - (direction.toLowerCase().includes('left') ? delta.width : 0), y: origin.y - (direction.toLowerCase().includes('top') ? delta.height : 0) }; }
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), Math.max(min, max)); }
