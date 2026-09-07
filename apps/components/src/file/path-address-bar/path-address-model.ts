import type {
	BuildPathAddressSegmentsOptions,
	PathAddressSegment,
	PathAddressVisibilityOptions,
} from './path-address-bar-types';

const DEFAULT_ROOT_LABEL = '根目录';

export function buildPathAddressSegments(
	path: string,
	options: BuildPathAddressSegmentsOptions = {},
): PathAddressSegment[] {
	const rootPath = normalizeAbsolutePath(options.rootPath ?? '/');
	const currentPath = normalizeAbsolutePath(path);
	const rootSegment: PathAddressSegment = {
		path: rootPath,
		label: options.rootLabel ?? DEFAULT_ROOT_LABEL,
		isRoot: true,
		isCurrent: currentPath === rootPath || !isPathWithinRoot(currentPath, rootPath),
	};

	if (!isPathWithinRoot(currentPath, rootPath) || currentPath === rootPath) return [rootSegment];

	const relativePath = rootPath === '/' ? currentPath.slice(1) : currentPath.slice(rootPath.length + 1);
	const relativeSegments = relativePath.split('/');
	const segments: PathAddressSegment[] = [rootSegment];
	let segmentPath = rootPath;

	for (const [index, label] of relativeSegments.entries()) {
		segmentPath = segmentPath === '/' ? `/${label}` : `${segmentPath}/${label}`;
		segments.push({
			path: segmentPath,
			label,
			isRoot: false,
			isCurrent: index === relativeSegments.length - 1,
		});
	}

	return segments;
}

export function calculatePathAddressVisibleStart(
	segmentWidths: readonly number[],
	availableWidth: number,
	options: PathAddressVisibilityOptions = {},
): number {
	if (segmentWidths.length <= 1) return 0;

	const widths = segmentWidths.map(toNonNegativeWidth);
	const width = toNonNegativeWidth(availableWidth);
	const separatorWidth = toNonNegativeWidth(options.separatorWidth ?? 0);
	const overflowWidth = toNonNegativeWidth(options.overflowWidth ?? 0);
	const fullWidth = sumWidths(widths, 0) + separatorWidth * (widths.length - 1);

	if (fullWidth <= width) return 0;

	for (let start = 1; start < widths.length; start += 1) {
		const visibleCount = widths.length - start;
		const suffixWidth = sumWidths(widths, start) + separatorWidth * Math.max(visibleCount - 1, 0);
		if (overflowWidth + separatorWidth + suffixWidth <= width) return start;
	}

	return widths.length - 1;
}

function normalizeAbsolutePath(path: string): string {
	const segments: string[] = [];
	const normalizedSeparators = path.replaceAll('\\', '/');

	for (const segment of normalizedSeparators.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') {
			segments.pop();
			continue;
		}
		segments.push(segment);
	}

	return `/${segments.join('/')}`;
}

function isPathWithinRoot(path: string, rootPath: string): boolean {
	return rootPath === '/' || path === rootPath || path.startsWith(`${rootPath}/`);
}

function toNonNegativeWidth(value: number): number {
	return Number.isFinite(value) && value > 0 ? value : 0;
}

function sumWidths(widths: readonly number[], start: number): number {
	let total = 0;
	for (let index = start; index < widths.length; index += 1) total += widths[index];
	return total;
}
