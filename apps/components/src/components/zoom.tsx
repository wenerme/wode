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
import { calculateZoomObjectFitRect, calculateZoomTargetRect, nonNegativeOr } from './zoom-geometry';
import {
	getZoomContainerStyle,
	getZoomImageStyle,
	measureZoomLayout,
	type ZoomLayout,
	type ZoomNaturalSize,
} from './zoom-layout';
import { acquireDocumentScrollLock, prefersReducedMotion } from './zoom-runtime';

export {
	type CalculateZoomObjectFitRectInput,
	type CalculateZoomTargetRectInput,
	calculateZoomObjectFitRect,
	calculateZoomTargetRect,
	type ZoomRect,
} from './zoom-geometry';

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

	const measure = useCallback(
		() =>
			measureZoomLayout(
				rootRef.current,
				zoomMargin,
				{ src: typeof zoomSrc === 'string' ? zoomSrc : undefined, sizes: zoomSizes, srcSet: zoomSrcSet },
				zoomNaturalSizeRef.current,
			),
		[zoomMargin, zoomSizes, zoomSrc, zoomSrcSet],
	);

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
		if (present) return acquireDocumentScrollLock();
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
			const size = { key: current.requestKey, width: image.naturalWidth, height: image.naturalHeight };
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
									style: zoomImgStyle as CSSProperties,
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
						<span className='bg-neutral/80 text-neutral-content absolute top-2 right-2 grid size-8 place-items-center rounded-full opacity-0 shadow-sm transition-opacity group-focus-within/zoom:opacity-100 group-hover/zoom:opacity-100'>
							<IconZoom className='size-3.5' />
						</span>
					)}
				</button>
			</span>
			{modal}
		</>
	);
}
