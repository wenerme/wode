'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';
import {
	type ComponentPropsWithRef,
	type CSSProperties,
	type ElementType,
	type ImgHTMLAttributes,
	type ReactElement,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type ZoomRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

export type CalculateZoomTargetRectInput = {
	naturalWidth: number;
	naturalHeight: number;
	sourceWidth: number;
	sourceHeight: number;
	viewportWidth: number;
	viewportHeight: number;
	margin?: number;
};

export function calculateZoomTargetRect({
	naturalWidth,
	naturalHeight,
	sourceWidth,
	sourceHeight,
	viewportWidth,
	viewportHeight,
	margin = 24,
}: CalculateZoomTargetRectInput): ZoomRect {
	const safeViewportWidth = positiveOr(viewportWidth, 1);
	const safeViewportHeight = positiveOr(viewportHeight, 1);
	const requestedMargin = nonNegativeOr(margin, 24);
	const safeMargin = Math.min(requestedMargin, (safeViewportWidth - 1) / 2, (safeViewportHeight - 1) / 2);
	const availableWidth = Math.max(1, safeViewportWidth - safeMargin * 2);
	const availableHeight = Math.max(1, safeViewportHeight - safeMargin * 2);
	const width = positiveOr(naturalWidth, positiveOr(sourceWidth, 1));
	const height = positiveOr(naturalHeight, positiveOr(sourceHeight, 1));
	const aspectRatio = width / height;

	let targetWidth = availableWidth;
	let targetHeight = targetWidth / aspectRatio;
	if (targetHeight > availableHeight) {
		targetHeight = availableHeight;
		targetWidth = targetHeight * aspectRatio;
	}

	return {
		top: (safeViewportHeight - targetHeight) / 2,
		left: (safeViewportWidth - targetWidth) / 2,
		width: targetWidth,
		height: targetHeight,
	};
}

export type CalculateZoomObjectFitRectInput = {
	containerWidth: number;
	containerHeight: number;
	naturalWidth: number;
	naturalHeight: number;
	objectFit?: CSSProperties['objectFit'];
	objectPosition?: string;
};

export function calculateZoomObjectFitRect({
	containerWidth,
	containerHeight,
	naturalWidth,
	naturalHeight,
	objectFit = 'fill',
	objectPosition = '50% 50%',
}: CalculateZoomObjectFitRectInput): ZoomRect {
	const safeContainerWidth = positiveOr(containerWidth, 1);
	const safeContainerHeight = positiveOr(containerHeight, 1);
	const safeNaturalWidth = positiveOr(naturalWidth, safeContainerWidth);
	const safeNaturalHeight = positiveOr(naturalHeight, safeContainerHeight);
	const containScale = Math.min(safeContainerWidth / safeNaturalWidth, safeContainerHeight / safeNaturalHeight);
	const coverScale = Math.max(safeContainerWidth / safeNaturalWidth, safeContainerHeight / safeNaturalHeight);
	let width = safeContainerWidth;
	let height = safeContainerHeight;

	if (objectFit === 'contain' || objectFit === 'cover' || objectFit === 'scale-down') {
		const scale =
			objectFit === 'cover' ? coverScale : objectFit === 'scale-down' ? Math.min(1, containScale) : containScale;
		width = safeNaturalWidth * scale;
		height = safeNaturalHeight * scale;
	} else if (objectFit === 'none') {
		width = safeNaturalWidth;
		height = safeNaturalHeight;
	}

	const [positionX, positionY] = parseObjectPosition(objectPosition);
	return {
		top: resolveObjectPosition(positionY, safeContainerHeight - height),
		left: resolveObjectPosition(positionX, safeContainerWidth - width),
		width,
		height,
	};
}

type ZoomNaturalSize = {
	key: string;
	width: number;
	height: number;
};

type ZoomImageRequest = {
	src?: string;
	sizes?: string;
	srcSet?: string;
};

type ZoomLayout = {
	source: ZoomRect;
	target: ZoomRect;
	requestKey: string;
	src: string;
	sizes?: string;
	srcSet?: string;
	alt: string;
	borderRadius: string;
	objectFit: CSSProperties['objectFit'];
	objectPosition: string;
	sourceNaturalWidth: number;
	sourceNaturalHeight: number;
	zoomNaturalWidth: number;
	zoomNaturalHeight: number;
};

type ZoomIcon = ElementType<{ className?: string }>;

export type ZoomProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
	children: ReactElement;
	active?: boolean;
	defaultActive?: boolean;
	onActiveChange?: (active: boolean) => void;
	disabled?: boolean;
	isDisabled?: boolean;
	zoomMargin?: number;
	duration?: number;
	zoomImg?: ImgHTMLAttributes<HTMLImageElement>;
	a11yNameButtonZoom?: string;
	a11yNameButtonUnzoom?: string;
	dialogLabel?: string;
	classDialog?: string;
	overlayClassName?: string;
	zoomImageClassName?: string;
	IconZoom?: ZoomIcon;
	IconUnzoom?: ZoomIcon;
};

export function Zoom({
	children,
	active,
	defaultActive = false,
	onActiveChange,
	disabled,
	isDisabled,
	zoomMargin = 24,
	duration = 220,
	zoomImg,
	a11yNameButtonZoom = '放大图片',
	a11yNameButtonUnzoom = '缩小图片',
	dialogLabel = '图片预览',
	classDialog,
	overlayClassName,
	zoomImageClassName,
	IconZoom = ZoomIn,
	IconUnzoom = ZoomOut,
	className,
	ref,
	...props
}: ZoomProps) {
	const rootRef = useRef<HTMLSpanElement>(null);
	const sourceButtonRef = useRef<HTMLButtonElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const zoomNaturalSizeRef = useRef<ZoomNaturalSize | undefined>(undefined);
	const [uncontrolledActive, setUncontrolledActive] = useState(defaultActive);
	const [present, setPresent] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [layout, setLayout] = useState<ZoomLayout>();
	const isControlled = active !== undefined;
	const isActive = isControlled ? active : uncontrolledActive;
	const unavailable = disabled || isDisabled;
	const {
		alt: zoomAlt,
		className: zoomImgClassName,
		onLoad: onZoomImageLoad,
		sizes: zoomSizes,
		src: zoomSrc,
		srcSet: zoomSrcSet,
		style: zoomImgStyle,
		...zoomImgProps
	} = zoomImg ?? {};

	const setRootRef = useCallback(
		(node: HTMLSpanElement | null) => {
			rootRef.current = node;
			if (typeof ref === 'function') ref(node);
			else if (ref) ref.current = node;
		},
		[ref],
	);

	const requestActiveChange = useCallback(
		(next: boolean) => {
			if (!isControlled) setUncontrolledActive(next);
			onActiveChange?.(next);
		},
		[isControlled, onActiveChange],
	);

	const measure = useCallback(() => {
		return measureZoomLayout(
			rootRef.current,
			zoomMargin,
			{
				src: typeof zoomSrc === 'string' ? zoomSrc : undefined,
				sizes: zoomSizes,
				srcSet: zoomSrcSet,
			},
			zoomNaturalSizeRef.current,
		);
	}, [zoomMargin, zoomSizes, zoomSrc, zoomSrcSet]);

	const open = useCallback(() => {
		if (unavailable) return;
		const next = measure();
		if (!next) return;
		setLayout(next);
		requestActiveChange(true);
	}, [measure, requestActiveChange, unavailable]);

	const close = useCallback(() => requestActiveChange(false), [requestActiveChange]);

	useEffect(() => {
		if (unavailable && isActive) requestActiveChange(false);
	}, [isActive, requestActiveChange, unavailable]);

	useEffect(() => {
		let closeTimer: ReturnType<typeof setTimeout> | undefined;
		if (isActive && !unavailable) {
			const next = measure();
			if (!next) {
				requestActiveChange(false);
				return;
			}
			setLayout(next);
			setPresent(true);
			return;
		}
		if (!present) return;

		setExpanded(false);
		const delay = prefersReducedMotion() ? 0 : nonNegativeOr(duration, 220);
		closeTimer = setTimeout(() => {
			if (dialogRef.current?.open) dialogRef.current.close();
			setPresent(false);
			setLayout(undefined);
			(returnFocusRef.current ?? sourceButtonRef.current)?.focus({ preventScroll: true });
			returnFocusRef.current = null;
		}, delay);
		return () => clearTimeout(closeTimer);
	}, [duration, isActive, measure, present, requestActiveChange, unavailable]);

	useEffect(() => {
		if (!present || !isActive) return;
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) {
			returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
		}
		closeButtonRef.current?.focus({ preventScroll: true });
		setExpanded(false);
		let secondFrame = 0;
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => setExpanded(true));
		});
		return () => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
		};
	}, [isActive, present]);

	useEffect(() => {
		if (!present) return;
		return acquireDocumentScrollLock();
	}, [present]);

	useEffect(() => {
		if (!isActive) return;
		const update = () => {
			const next = measure();
			if (next) setLayout(next);
			else requestActiveChange(false);
		};
		update();
		window.addEventListener('resize', update);
		const image = rootRef.current?.querySelector('img');
		const observer = image && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
		if (image) observer?.observe(image);
		return () => {
			window.removeEventListener('resize', update);
			observer?.disconnect();
		};
	}, [children, isActive, measure, requestActiveChange]);

	const handleZoomImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
		const image = event.currentTarget;
		setLayout((current) => {
			if (!current) return current;
			const size: ZoomNaturalSize = {
				key: current.requestKey,
				width: image.naturalWidth,
				height: image.naturalHeight,
			};
			zoomNaturalSizeRef.current = size;
			return {
				...current,
				zoomNaturalWidth: size.width,
				zoomNaturalHeight: size.height,
				target: calculateZoomTargetRect({
					naturalWidth: size.width,
					naturalHeight: size.height,
					sourceWidth: current.source.width,
					sourceHeight: current.source.height,
					viewportWidth: window.innerWidth,
					viewportHeight: window.innerHeight,
					margin: zoomMargin,
				}),
			};
		});
		onZoomImageLoad?.(event);
	};

	const visibleRect = expanded ? layout?.target : layout?.source;
	const visibleImageRect = layout
		? expanded
			? { top: 0, left: 0, width: layout.target.width, height: layout.target.height }
			: calculateZoomObjectFitRect({
					containerWidth: layout.source.width,
					containerHeight: layout.source.height,
					naturalWidth: layout.sourceNaturalWidth,
					naturalHeight: layout.sourceNaturalHeight,
					objectFit: layout.objectFit,
					objectPosition: layout.objectPosition,
				})
		: undefined;
	const transitionDuration = prefersReducedMotion() ? 0 : nonNegativeOr(duration, 220);
	const modal =
		present && layout && visibleRect && visibleImageRect && typeof document !== 'undefined'
			? createPortal(
					<dialog
						ref={dialogRef}
						aria-label={dialogLabel}
						className={cn(
							'fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent',
							classDialog,
						)}
						onCancel={(event) => {
							event.preventDefault();
							close();
						}}
						onClose={() => {
							if (isActive) close();
						}}
					>
						<button
							type='button'
							tabIndex={-1}
							aria-label={a11yNameButtonUnzoom}
							className={cn(
								'bg-neutral/85 absolute inset-0 cursor-zoom-out backdrop-blur-sm transition-opacity',
								expanded ? 'opacity-100' : 'opacity-0',
								overlayClassName,
							)}
							style={{ transitionDuration: `${transitionDuration}ms` }}
							onClick={close}
						/>
						<div
							className='pointer-events-none fixed z-[1] overflow-hidden shadow-2xl'
							style={getZoomContainerStyle({
								rect: visibleRect,
								expanded,
								borderRadius: layout.borderRadius,
								duration: transitionDuration,
							})}
						>
							<img
								{...zoomImgProps}
								src={layout.src}
								srcSet={layout.srcSet}
								sizes={layout.sizes}
								alt={zoomAlt ?? layout.alt}
								draggable={false}
								className={cn(zoomImgClassName, zoomImageClassName)}
								style={getZoomImageStyle({
									rect: visibleImageRect,
									duration: transitionDuration,
									style: zoomImgStyle,
								})}
								onLoad={handleZoomImageLoad}
							/>
						</div>
						<button
							ref={closeButtonRef}
							type='button'
							aria-label={a11yNameButtonUnzoom}
							title={a11yNameButtonUnzoom}
							className='border-base-300 bg-base-100 text-base-content hover:bg-base-200 fixed top-4 right-4 z-[2] grid size-10 place-items-center rounded-full border shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white'
							onClick={close}
						>
							<IconUnzoom className='size-4' />
						</button>
					</dialog>,
					document.body,
				)
			: null;

	return (
		<>
			<span ref={setRootRef} className={cn('group/zoom relative inline-block max-w-full', className)} {...props}>
				{children}
				<button
					ref={sourceButtonRef}
					type='button'
					disabled={unavailable}
					aria-label={a11yNameButtonZoom}
					title={a11yNameButtonZoom}
					className={cn(
						'absolute inset-0 rounded-[inherit] outline-none',
						unavailable ? 'cursor-default' : 'cursor-zoom-in focus-visible:ring-2 focus-visible:ring-white',
					)}
					onClick={open}
				>
					{unavailable ? null : (
						<span className='bg-neutral/80 text-neutral-content absolute top-2 right-2 grid size-8 place-items-center rounded-full opacity-0 shadow-sm transition-opacity group-hover/zoom:opacity-100 group-focus-within/zoom:opacity-100'>
							<IconZoom className='size-3.5' />
						</span>
					)}
				</button>
			</span>
			{modal}
		</>
	);
}

function measureZoomLayout(
	root: HTMLElement | null,
	margin: number,
	zoomRequest: ZoomImageRequest = {},
	cachedZoomSize?: ZoomNaturalSize,
): ZoomLayout | undefined {
	const image = root?.querySelector('img');
	if (!image) return undefined;
	const rect = image.getBoundingClientRect();
	const hasZoomRequest = Boolean(zoomRequest.src || zoomRequest.srcSet || zoomRequest.sizes);
	const sourceSrc = image.getAttribute('src') || image.currentSrc || image.src;
	const src = zoomRequest.src || sourceSrc;
	const srcSet = hasZoomRequest ? zoomRequest.srcSet : image.getAttribute('srcset') || undefined;
	const sizes = hasZoomRequest ? zoomRequest.sizes : image.getAttribute('sizes') || undefined;
	if (!src || rect.width <= 0 || rect.height <= 0) return undefined;
	const sourceNaturalWidth = positiveOr(image.naturalWidth, rect.width);
	const sourceNaturalHeight = positiveOr(image.naturalHeight, rect.height);
	const requestKey = createZoomRequestKey(src, srcSet, sizes);
	const zoomNaturalWidth =
		cachedZoomSize?.key === requestKey ? positiveOr(cachedZoomSize.width, sourceNaturalWidth) : sourceNaturalWidth;
	const zoomNaturalHeight =
		cachedZoomSize?.key === requestKey ? positiveOr(cachedZoomSize.height, sourceNaturalHeight) : sourceNaturalHeight;
	const imageStyle = getComputedStyle(image);
	return {
		source: {
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
		},
		target: calculateZoomTargetRect({
			naturalWidth: zoomNaturalWidth,
			naturalHeight: zoomNaturalHeight,
			sourceWidth: rect.width,
			sourceHeight: rect.height,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			margin,
		}),
		requestKey,
		src,
		sizes,
		srcSet,
		alt: image.alt,
		borderRadius: imageStyle.borderRadius,
		objectFit: (imageStyle.objectFit || 'fill') as CSSProperties['objectFit'],
		objectPosition: imageStyle.objectPosition || '50% 50%',
		sourceNaturalWidth,
		sourceNaturalHeight,
		zoomNaturalWidth,
		zoomNaturalHeight,
	};
}

function getZoomContainerStyle({
	rect,
	expanded,
	borderRadius,
	duration,
}: {
	rect: ZoomRect;
	expanded: boolean;
	borderRadius: string;
	duration: number;
}): CSSProperties {
	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		borderRadius: expanded ? '0.25rem' : borderRadius,
		transitionProperty: 'top, left, width, height, border-radius',
		transitionDuration: `${duration}ms`,
		transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
		willChange: 'top, left, width, height',
	};
}

function getZoomImageStyle({
	rect,
	duration,
	style,
}: {
	rect: ZoomRect;
	duration: number;
	style?: CSSProperties;
}): CSSProperties {
	return {
		...style,
		position: 'absolute',
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		maxWidth: 'none',
		maxHeight: 'none',
		objectFit: 'fill',
		transitionProperty: 'top, left, width, height',
		transitionDuration: `${duration}ms`,
		transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
		willChange: 'top, left, width, height',
	};
}

type ParsedObjectPosition = { relative: number; absolute: number };

function parseObjectPosition(value: string): [ParsedObjectPosition, ParsedObjectPosition] {
	const tokens = splitCssPositionComponents(value);
	if (tokens.length === 4) {
		if (isHorizontalPosition(tokens[0]) && isVerticalPosition(tokens[2])) {
			return [parseEdgePosition(tokens[0], tokens[1]), parseEdgePosition(tokens[2], tokens[3])];
		}
		if (isVerticalPosition(tokens[0]) && isHorizontalPosition(tokens[2])) {
			return [parseEdgePosition(tokens[2], tokens[3]), parseEdgePosition(tokens[0], tokens[1])];
		}
	}
	if (tokens.length === 3) {
		if (isHorizontalPosition(tokens[0]) && isVerticalPosition(tokens[2])) {
			return [parseEdgePosition(tokens[0], tokens[1]), parseObjectPositionToken(tokens[2])];
		}
		if (isVerticalPosition(tokens[0]) && isHorizontalPosition(tokens[2])) {
			return [parseObjectPositionToken(tokens[2]), parseEdgePosition(tokens[0], tokens[1])];
		}
		if (isHorizontalPosition(tokens[0]) && isVerticalPosition(tokens[1])) {
			return [parseObjectPositionToken(tokens[0]), parseEdgePosition(tokens[1], tokens[2])];
		}
		if (isVerticalPosition(tokens[0]) && isHorizontalPosition(tokens[1])) {
			return [parseEdgePosition(tokens[1], tokens[2]), parseObjectPositionToken(tokens[0])];
		}
	}

	let [x = '50%', y = '50%'] = tokens;
	if (isVerticalPosition(x) || (x === 'center' && isHorizontalPosition(y))) [x, y] = [y, x];
	return [parseObjectPositionToken(x), parseObjectPositionToken(y)];
}

function splitCssPositionComponents(value: string) {
	const tokens: string[] = [];
	let current = '';
	let depth = 0;
	for (const character of value.trim()) {
		if (character === '(') depth += 1;
		if (character === ')') depth = Math.max(0, depth - 1);
		if (/\s/.test(character) && depth === 0) {
			if (current) tokens.push(current);
			current = '';
		} else {
			current += character;
		}
	}
	if (current) tokens.push(current);
	return tokens;
}

function parseObjectPositionToken(token: string): ParsedObjectPosition {
	if (token === 'center') return { relative: 0.5, absolute: 0 };
	if (token === 'left' || token === 'top') return { relative: 0, absolute: 0 };
	if (token === 'right' || token === 'bottom') return { relative: 1, absolute: 0 };
	if (token.startsWith('calc(') && token.endsWith(')')) {
		const terms = token
			.slice(5, -1)
			.replace(/\s+/g, '')
			.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:%|px)/g);
		if (terms?.length) {
			return terms.reduce<ParsedObjectPosition>(
				(result, term) => {
					const value = Number.parseFloat(term);
					if (term.endsWith('%')) result.relative += value / 100;
					else result.absolute += value;
					return result;
				},
				{ relative: 0, absolute: 0 },
			);
		}
	}
	if (token.endsWith('%')) {
		const value = Number.parseFloat(token);
		if (Number.isFinite(value)) return { relative: value / 100, absolute: 0 };
	}
	if (token.endsWith('px') || token === '0') {
		const value = Number.parseFloat(token);
		if (Number.isFinite(value)) return { relative: 0, absolute: value };
	}
	return { relative: 0.5, absolute: 0 };
}

function parseEdgePosition(edge: string, offsetToken: string): ParsedObjectPosition {
	const offset = parseObjectPositionToken(offsetToken);
	return edge === 'right' || edge === 'bottom' ? { relative: 1 - offset.relative, absolute: -offset.absolute } : offset;
}

function isHorizontalPosition(value: string) {
	return value === 'left' || value === 'right';
}

function isVerticalPosition(value: string) {
	return value === 'top' || value === 'bottom';
}

function resolveObjectPosition(position: ParsedObjectPosition, remainingSpace: number) {
	return remainingSpace * position.relative + position.absolute;
}

function createZoomRequestKey(src: string, srcSet?: string, sizes?: string) {
	return JSON.stringify([normalizeZoomSourceKey(src), srcSet || '', sizes || '']);
}

function normalizeZoomSourceKey(src: string) {
	try {
		return new URL(src, typeof document === 'undefined' ? 'http://localhost/' : document.baseURI).href;
	} catch {
		return src;
	}
}

let documentScrollLockCount = 0;
let documentScrollLockPreviousOverflow = '';

function acquireDocumentScrollLock() {
	const root = document.documentElement;
	if (documentScrollLockCount === 0) {
		documentScrollLockPreviousOverflow = root.style.overflow;
		root.style.overflow = 'hidden';
	}
	documentScrollLockCount += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		documentScrollLockCount = Math.max(0, documentScrollLockCount - 1);
		if (documentScrollLockCount === 0) {
			root.style.overflow = documentScrollLockPreviousOverflow;
			documentScrollLockPreviousOverflow = '';
		}
	};
}

function positiveOr(value: number, fallback: number) {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeOr(value: number, fallback: number) {
	return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}
