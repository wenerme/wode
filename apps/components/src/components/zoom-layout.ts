import type { CSSProperties } from 'react';
import { calculateZoomTargetRect, positiveOr, type ZoomRect } from './zoom-geometry';

export type ZoomNaturalSize = {
	key: string;
	width: number;
	height: number;
};

export type ZoomImageRequest = {
	src?: string;
	sizes?: string;
	srcSet?: string;
};

export type ZoomLayout = {
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

export function measureZoomLayout(
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
		source: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
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

export function getZoomContainerStyle({
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

export function getZoomImageStyle({
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
