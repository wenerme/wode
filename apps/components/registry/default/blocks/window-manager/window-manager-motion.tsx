'use client';

import { Resizable, type ResizeDirection } from 're-resizable';
import {
	type CSSProperties,
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useRef,
	useState,
} from 'react';

export type WindowManagerMotionBounds = {
	height: number;
	width: number;
	x: number;
	y: number;
};

export type WindowManagerMotionSurfaceProps = {
	cancel?: string;
	children: ReactNode;
	disableDragging?: boolean;
	dragHandleClassName?: string;
	enableResizing?: boolean;
	interactionKey?: string | number;
	maxHeight: number;
	maxWidth: number;
	minHeight: number;
	minWidth: number;
	movementBounds: WindowManagerMotionBounds;
	onMoveStart?: () => void;
	onMoveStop?: (position: { x: number; y: number }) => void;
	onResizeStart?: () => void;
	onResizeStop?: (value: WindowManagerMotionBounds) => void;
	position: { x: number; y: number };
	size: { height: number; width: number };
	style?: CSSProperties;
};

type DragSession = {
	maxX: number;
	maxY: number;
	minX: number;
	minY: number;
	originX: number;
	originY: number;
	pointerId: number;
	startX: number;
	startY: number;
};

export function WindowManagerMotionSurface({
	cancel,
	children,
	disableDragging = false,
	dragHandleClassName,
	enableResizing = true,
	interactionKey = 'default',
	maxHeight,
	maxWidth,
	minHeight,
	minWidth,
	movementBounds,
	onMoveStart,
	onMoveStop,
	onResizeStart,
	onResizeStop,
	position,
	size,
	style,
}: WindowManagerMotionSurfaceProps) {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const activity = useRef<'drag' | 'resize' | undefined>(undefined);
	const dragSession = useRef<DragSession | undefined>(undefined);
	const latestPosition = useRef(position);
	const previousInteractionKey = useRef(interactionKey);
	const resizeOrigin = useRef<WindowManagerMotionBounds>({ ...position, ...size });
	const [visualPosition, setVisualPosition] = useState(position);
	const [visualSize, setVisualSize] = useState(size);

	useEffect(() => {
		if (previousInteractionKey.current === interactionKey) return;
		previousInteractionKey.current = interactionKey;
		const pointerId = dragSession.current?.pointerId;
		dragSession.current = undefined;
		activity.current = undefined;
		if (pointerId !== undefined && nodeRef.current?.hasPointerCapture(pointerId)) {
			nodeRef.current.releasePointerCapture(pointerId);
		}
		latestPosition.current = position;
		setVisualPosition(position);
		setVisualSize(size);
	}, [interactionKey, position, size]);
	useEffect(() => {
		if (activity.current) return;
		latestPosition.current = position;
		setVisualPosition(position);
	}, [position]);
	useEffect(() => {
		if (!activity.current) setVisualSize(size);
	}, [size]);

	const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (disableDragging || event.button !== 0 || !nodeRef.current) return;
		const target = event.target instanceof Element ? event.target : undefined;
		if (!target) return;
		if (dragHandleClassName && !target.closest(`.${dragHandleClassName}`)) return;
		if (cancel && target.closest(cancel)) return;
		event.preventDefault();
		nodeRef.current.setPointerCapture(event.pointerId);
		dragSession.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: visualPosition.x,
			originY: visualPosition.y,
			minX: movementBounds.x,
			minY: movementBounds.y,
			maxX: Math.max(movementBounds.x, movementBounds.x + movementBounds.width - visualSize.width),
			maxY: Math.max(movementBounds.y, movementBounds.y + movementBounds.height - visualSize.height),
		};
		activity.current = 'drag';
		onMoveStart?.();
	};

	const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
		const session = dragSession.current;
		if (!session || session.pointerId !== event.pointerId) return;
		const next = getWindowManagerDragPosition(session, { x: event.clientX, y: event.clientY });
		latestPosition.current = next;
		setVisualPosition(next);
	};

	const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
		const session = dragSession.current;
		if (!session || session.pointerId !== event.pointerId) return;
		dragSession.current = undefined;
		activity.current = undefined;
		if (nodeRef.current?.hasPointerCapture(event.pointerId)) nodeRef.current.releasePointerCapture(event.pointerId);
		onMoveStop?.(latestPosition.current);
	};

	const constrainResize = (direction: ResizeDirection, requested: { height: number; width: number }) =>
		getWindowManagerConstrainedResize({
			bounds: movementBounds,
			direction,
			maxHeight,
			maxWidth,
			minHeight,
			minWidth,
			origin: resizeOrigin.current,
			requested,
		});

	return (
		<div
			ref={nodeRef}
			style={{
				position: 'absolute',
				width: visualSize.width,
				height: visualSize.height,
				transform: `translate(${visualPosition.x}px, ${visualPosition.y}px)`,
				...style,
			}}
			onPointerCancel={stopDrag}
			onPointerDown={startDrag}
			onPointerMove={moveDrag}
			onPointerUp={stopDrag}
		>
			<Resizable
				enable={enableResizing ? undefined : false}
				minHeight={minHeight}
				minWidth={minWidth}
				maxHeight={maxHeight}
				maxWidth={maxWidth}
				size={visualSize}
				style={{ overflow: 'visible' }}
				onResizeStart={() => {
					activity.current = 'resize';
					resizeOrigin.current = { ...visualPosition, ...visualSize };
					onResizeStart?.();
				}}
				onResize={(_event, direction, element) => {
					if (activity.current !== 'resize') return;
					const next = constrainResize(direction, { width: element.offsetWidth, height: element.offsetHeight });
					latestPosition.current = next;
					setVisualPosition({ x: next.x, y: next.y });
					setVisualSize({ width: next.width, height: next.height });
				}}
				onResizeStop={(_event, direction, element) => {
					if (activity.current !== 'resize') return;
					activity.current = undefined;
					const next = constrainResize(direction, { width: element.offsetWidth, height: element.offsetHeight });
					latestPosition.current = next;
					setVisualPosition({ x: next.x, y: next.y });
					setVisualSize({ width: next.width, height: next.height });
					onResizeStop?.(next);
				}}
			>
				{children}
			</Resizable>
		</div>
	);
}

export function getWindowManagerDragPosition(
	session: Pick<DragSession, 'maxX' | 'maxY' | 'minX' | 'minY' | 'originX' | 'originY' | 'startX' | 'startY'>,
	pointer: { x: number; y: number },
) {
	return {
		x: clamp(session.originX + pointer.x - session.startX, session.minX, session.maxX),
		y: clamp(session.originY + pointer.y - session.startY, session.minY, session.maxY),
	};
}

export function getWindowManagerConstrainedResize({
	bounds,
	direction,
	maxHeight,
	maxWidth,
	minHeight,
	minWidth,
	origin,
	requested,
}: {
	bounds: WindowManagerMotionBounds;
	direction: ResizeDirection;
	maxHeight: number;
	maxWidth: number;
	minHeight: number;
	minWidth: number;
	origin: WindowManagerMotionBounds;
	requested: { height: number; width: number };
}): WindowManagerMotionBounds {
	const value = direction.toLowerCase();
	const fromLeft = value.includes('left');
	const fromTop = value.includes('top');
	const horizontal = fromLeft || value.includes('right');
	const vertical = fromTop || value.includes('bottom');
	const fixedRight = origin.x + origin.width;
	const fixedBottom = origin.y + origin.height;
	const availableWidth = fromLeft ? fixedRight - bounds.x : bounds.x + bounds.width - origin.x;
	const availableHeight = fromTop ? fixedBottom - bounds.y : bounds.y + bounds.height - origin.y;
	const width = clamp(
		horizontal ? requested.width : origin.width,
		Math.min(minWidth, availableWidth),
		Math.min(maxWidth, availableWidth),
	);
	const height = clamp(
		vertical ? requested.height : origin.height,
		Math.min(minHeight, availableHeight),
		Math.min(maxHeight, availableHeight),
	);
	return {
		x: fromLeft ? fixedRight - width : origin.x,
		y: fromTop ? fixedBottom - height : origin.y,
		width,
		height,
	};
}

export function getWindowManagerResizePosition(
	origin: { x: number; y: number },
	direction: ResizeDirection,
	delta: { height: number; width: number },
) {
	return {
		x: origin.x - (direction.toLowerCase().includes('left') ? delta.width : 0),
		y: origin.y - (direction.toLowerCase().includes('top') ? delta.height : 0),
	};
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
