const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
function boundaries(input: string): number[] {
	return [0, ...Array.from(segmenter.segment(input), ({ index, segment }) => index + segment.length)];
}

/** 光标使用 UTF-16 offset 存储，但始终落在完整字素的边界上。 */
export function normalizeTerminalCursor(input: string, cursor: number): number {
	const position = Math.max(0, Math.min(Math.trunc(cursor), input.length));
	return boundaries(input).find((index) => index >= position) ?? input.length;
}
export function moveTerminalCursor(input: string, cursor: number, direction: -1 | 1) {
	const current = normalizeTerminalCursor(input, cursor);
	const points = boundaries(input);
	const next =
		direction < 0
			? (points.findLast((index) => index < current) ?? 0)
			: (points.find((index) => index > current) ?? input.length);
	return next;
}
export function deleteTerminalBackward(input: string, cursor: number) {
	const current = normalizeTerminalCursor(input, cursor);
	const previous = moveTerminalCursor(input, current, -1);
	return { input: input.slice(0, previous) + input.slice(current), cursor: previous };
}

/** 由 xterm 自身记录前缀的显示位置，遵循当前 Unicode provider 的真实 cell 宽度。 */
export function renderTerminalInput(input: string, cursor: number, prompt = ''): string {
	const boundary = normalizeTerminalCursor(input, cursor);
	return `\r\x1b[2K${prompt}${input.slice(0, boundary)}\x1b7${input.slice(boundary)}\x1b8`;
}
