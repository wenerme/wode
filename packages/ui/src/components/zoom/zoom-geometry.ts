import type { CSSProperties } from 'react';

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

export function positiveOr(value: number, fallback: number) {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function nonNegativeOr(value: number, fallback: number) {
	return Number.isFinite(value) && value >= 0 ? value : fallback;
}
