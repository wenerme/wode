import stringWidth from 'string-width';
import type { CliTable, CliTableColumnOptions } from '../render/CliTable';
import { isCliDetailTable, projectCliTable } from './projectCliTable';
import { CliFormatError, type CliFormatOptions, type CliStyle } from './types';

const DEFAULT_WIDTH = 120;
const COLUMN_GAP = '  ';
const NARROW_COLUMN_WIDTH = 12;
const ANSI_PATTERN =
	/(?:\u001B\]|\u009D)[\s\S]*?(?:\u0007|\u001B\\|\u009C|$)|(?:\u001B[P^_X]|\u0090)[\s\S]*?(?:\u001B\\|\u009C|$)|(?:\u001B\[|\u009B)[0-?]*[ -/]*[@-~]|\u001B[@-_]/g;

/** 将 CliTable 渲染为适合终端和浏览器等宽输出的纯文本。 */
export function formatCliTable(table: CliTable, options: CliFormatOptions = {}): string {
	if (options.format && !['table', 'wide', 'describe', 'desc'].includes(options.format)) {
		throw new CliFormatError('Use formatCliOutput for machine output formats');
	}
	table = projectCliTable(table, options.fields);
	if (options.format === 'wide') options = { ...options, truncate: false };
	const width = normalizeWidth(options.w);
	const kind = isCliDetailTable(table) ? 'detail' : (table.kind ?? 'list');
	const styles = options.styles ?? {};
	const lines: string[] = [];
	if (table.title !== undefined)
		appendLines(
			lines,
			wrapText(cleanTerminalText(table.title, true), width, false).map((line) => applyStyle(line, styles.title)),
		);
	if (kind === 'detail') appendLines(lines, renderDetail(table, width, options, styles));
	else appendLines(lines, renderList(table, width, options, styles, kind === 'plain'));
	if (kind === 'list' && options.footer !== false) {
		appendLines(
			lines,
			wrapText(cleanTerminalText(renderCountFooter(table), true), width, false).map((line) =>
				applyStyle(line, styles.footer),
			),
		);
	}
	if (table.footer !== undefined && options.footer !== false) {
		appendLines(
			lines,
			wrapText(cleanTerminalText(table.footer, true), width, false).map((line) => applyStyle(line, styles.footer)),
		);
	}
	return `${lines.join('\n')}\n`;
}

function renderList(
	table: CliTable,
	width: number,
	options: CliFormatOptions,
	styles: StyleMap,
	plain: boolean,
): string[] {
	const columnCount = table.rows.reduce(
		(max, row) => Math.max(max, row.length),
		Math.max(table.headers.length, table.columnOptions?.length ?? 0),
	);
	const headers = Array.from({ length: columnCount }, (_, index) =>
		cleanTerminalText(table.headers[index] ?? '', !plain),
	);
	const rows = table.rows.map((row) =>
		Array.from({ length: columnCount }, (_, index) => cleanTerminalText(row[index], !plain)),
	);
	const columnOptions = headers.map((header, index) => {
		const column = table.columnOptions?.[index];
		const isId = [column?.key, header].some((name) => name?.trim().toLowerCase() === 'id');
		return { ...column, truncate: column?.truncate ?? (isId ? false : undefined) };
	});
	if (rows.length === 0) {
		const output: string[] = [];
		if (!plain && options.headers !== false && headers.length)
			appendLines(
				output,
				wrapText(headers.join(COLUMN_GAP), width, false).map((line) => applyStyle(line, styles.header)),
			);
		appendLines(
			output,
			wrapText(cleanTerminalText(table.emptyMessage ?? 'No results.', true), width, false).map((line) =>
				applyStyle(line, styles.empty),
			),
		);
		return output;
	}
	if (columnCount === 0) return rows.flatMap((row) => row.map((cell) => applyStyle(cell, styles.value)));
	const showHeaders = options.headers !== false && table.headers.length > 0;
	const widths = calculateWidths(headers, rows, columnOptions, width);
	const vertical =
		options.format === 'describe' ||
		options.format === 'desc' ||
		(table.headers.length > 0 && shouldRenderVertically(columnCount, width)) ||
		widths.reduce((sum, value) => sum + value, 0) + COLUMN_GAP.length * (columnCount - 1) > width;
	if (vertical) return renderVerticalList(headers, rows, width, columnOptions, options, styles);
	const output: string[] = [];
	if (showHeaders)
		appendLines(output, renderGridRow(headers, widths, options.truncate !== false, columnOptions, styles.header));
	for (const row of rows)
		appendLines(output, renderGridRow(row, widths, options.truncate !== false, columnOptions, styles.value));
	return output;
}

function renderDetail(table: CliTable, width: number, options: CliFormatOptions, styles: StyleMap): string[] {
	const pairs = detailPairs(table);
	if (pairs.length === 0)
		return wrapText(cleanTerminalText(table.emptyMessage ?? 'No results.', true), width, false).map((line) =>
			applyStyle(line, styles.empty),
		);
	if (width < 6)
		return pairs.flatMap(([label, value]) => [
			...wrapText(label, width, false).map((line) => applyStyle(line, styles.label)),
			...wrapText(value, width, false).map((line) => applyStyle(line, styles.value)),
		]);
	const labels = pairs.map(([label]) => label);
	const labelWidth = Math.min(
		labels.reduce((max, label) => Math.max(max, maxLineWidth(label)), 1),
		Math.max(1, Math.floor(width * 0.35)),
	);
	const gap = width > labelWidth ? COLUMN_GAP : ' ';
	const valueWidth = Math.max(1, width - labelWidth - gap.length);
	const output: string[] = [];
	for (const [pairIndex, [label, value]] of pairs.entries()) {
		if (pairIndex > 0 && !options.compact && (value.includes('\n') || pairs[pairIndex - 1][1].includes('\n')))
			output.push('');
		const labelLines = wrapText(label, labelWidth, options.truncate === true);
		const valueLines = wrapText(
			value,
			valueWidth,
			options.truncate === true && table.columnOptions?.[1]?.truncate !== false,
		);
		const lineCount = Math.max(labelLines.length, valueLines.length);
		for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
			const renderedLabel = applyStyle(padRight(labelLines[lineIndex] ?? '', labelWidth), styles.label);
			const renderedValue = applyStyle(valueLines[lineIndex] ?? '', styles.value);
			output.push(`${renderedLabel}${gap}${renderedValue}`.trimEnd());
		}
	}
	return output;
}

function renderVerticalList(
	headers: readonly string[],
	rows: readonly (readonly string[])[],
	width: number,
	columnOptions: readonly CliTableColumnOptions[] | undefined,
	options: CliFormatOptions,
	styles: StyleMap,
): string[] {
	const labelWidth = Math.max(
		1,
		Math.min(
			headers.reduce((max, header) => Math.max(max, maxLineWidth(header)), 1),
			Math.floor(width * 0.35),
		),
	);
	const gap = width > labelWidth ? COLUMN_GAP : ' ';
	const valueWidth = Math.max(1, width - labelWidth - gap.length);
	const output: string[] = [];
	for (const [rowIndex, row] of rows.entries()) {
		if (rowIndex > 0 && !options.compact) output.push('');
		for (let index = 0; index < headers.length; index++) {
			const label = headers[index] ?? '';
			const value = row[index] ?? '';
			if (options.headers === false || width < 6) {
				if (options.headers !== false)
					appendLines(
						output,
						wrapText(label, width, false).map((line) => applyStyle(line, styles.label)),
					);
				appendLines(
					output,
					wrapText(value, width, false).map((line) => applyStyle(line, styles.value)),
				);
				continue;
			}
			const labelLines = wrapText(label, labelWidth, false);
			const maxWidth = columnOptions?.[index]?.maxWidth;
			const valueWidthForColumn =
				maxWidth === undefined ? valueWidth : Math.min(valueWidth, finiteWidth(maxWidth, valueWidth));
			const valueLines = wrapText(
				value,
				valueWidthForColumn,
				options.format === 'describe' || options.format === 'desc'
					? options.truncate === true && columnOptions?.[index]?.truncate !== false
					: shouldTruncate(options, columnOptions?.[index]),
			);
			const lineCount = Math.max(labelLines.length, valueLines.length);
			for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
				output.push(
					`${applyStyle(padRight(labelLines[lineIndex] ?? '', labelWidth), styles.label)}${gap}${applyStyle(valueLines[lineIndex] ?? '', styles.value)}`.trimEnd(),
				);
			}
		}
	}
	return output;
}

function renderGridRow(
	row: readonly string[],
	widths: readonly number[],
	globalTruncate: boolean,
	columnOptions: readonly CliTableColumnOptions[] | undefined,
	style: CliStyle | undefined,
): string[] {
	const cells = widths.map((width, index) =>
		wrapText(row[index] ?? '', width, globalTruncate && columnOptions?.[index]?.truncate !== false),
	);
	const lineCount = cells.reduce((max, cell) => Math.max(max, cell.length), 1);
	const output: string[] = [];
	for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
		output.push(
			cells
				.map((cell, index) => {
					const value = cell[lineIndex] ?? '';
					const aligned =
						columnOptions?.[index]?.align === 'right' ? padLeft(value, widths[index]) : padRight(value, widths[index]);
					return applyStyle(index === cells.length - 1 ? aligned.trimEnd() : aligned, style);
				})
				.join(COLUMN_GAP)
				.trimEnd(),
		);
	}
	return output;
}

function detailPairs(table: CliTable): Array<[string, string]> {
	return table.rows
		.filter((row) => visibleDetailValue(row[1]))
		.map((row) => [cleanTerminalText(row[0] ?? '', true), cleanTerminalText(row[1], true)]);
}

function visibleDetailValue(value: unknown): boolean {
	if (value === null || value === undefined || value === '') return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)))
		return Object.keys(value).length > 0;
	return true;
}

function calculateWidths(
	headers: readonly string[],
	rows: readonly (readonly string[])[],
	columnOptions: readonly CliTableColumnOptions[] | undefined,
	width: number,
): number[] {
	const count = headers.length;
	const available = Math.max(count, width - COLUMN_GAP.length * Math.max(0, count - 1));
	const intrinsic = headers.map((header, index) => {
		const option = columnOptions?.[index];
		const content = rows.reduce((max, row) => Math.max(max, maxLineWidth(row[index] ?? '')), maxLineWidth(header));
		const min = finiteWidth(option?.minWidth, 1);
		const max = option?.maxWidth === undefined ? Number.POSITIVE_INFINITY : finiteWidth(option.maxWidth, min);
		return Math.min(width, Math.max(min, Math.min(max, content)));
	});
	const minimums = intrinsic.map((value, index) => Math.min(value, finiteWidth(columnOptions?.[index]?.minWidth, 1)));
	const result = [...intrinsic];
	let excess = result.reduce((sum, value) => sum + value, 0) - available;
	while (excess > 0) {
		let candidate = -1;
		for (let index = 0; index < result.length; index++)
			if (result[index] > minimums[index] && (candidate < 0 || result[index] > result[candidate])) candidate = index;
		if (candidate < 0) break;
		result[candidate]--;
		excess--;
	}
	return result.map((value) => Math.max(1, Math.floor(value)));
}

function renderCountFooter(table: CliTable): string {
	const label = table.countLabel ?? 'rows';
	const pagination = table.pagination;
	if (pagination === undefined) return `${table.rows.length} ${label}`;
	const count = isFiniteNumber(pagination.total)
		? `${table.rows.length} of ${pagination.total} ${label}`
		: `${table.rows.length} ${label}`;
	const parts = [count];
	if (isFiniteNumber(pagination.pageIndex)) {
		if (isFiniteNumber(pagination.total) && isFiniteNumber(pagination.pageSize) && pagination.pageSize > 0) {
			const page = pagination.pageIndex + 1;
			parts.push(`Page ${page}/${Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}`);
		} else parts.push(`Page ${pagination.pageIndex + 1}`);
	}
	if (isFiniteNumber(pagination.pageSize)) parts.push(`${pagination.pageSize} per page`);
	if (pagination.hasNext === true) parts.push('More pages');
	if (pagination.hasNext === false) parts.push('No more pages');
	if (isFiniteNumber(pagination.offset)) parts.push(`Offset ${pagination.offset}`);
	return parts.join(' · ');
}

function shouldRenderVertically(columnCount: number, width: number): boolean {
	if (columnCount <= 1) return false;
	const gapWidth = chooseGapWidth(columnCount, width);
	return width - gapWidth * (columnCount - 1) < columnCount * NARROW_COLUMN_WIDTH;
}

function wrapText(value: string, width: number, truncate: boolean): string[] {
	const safeWidth = Math.max(1, width);
	const sourceLines = value.split('\n');
	return truncate
		? sourceLines.map((line) => truncateDisplay(line, safeWidth))
		: sourceLines.flatMap((line) => wrapLine(line, safeWidth));
}

function wrapLine(value: string, width: number): string[] {
	if (!value) return [''];
	const output: string[] = [];
	let line = '';
	let used = 0;
	for (const segment of graphemes(value)) {
		const segmentWidth = stringWidth(segment);
		if (line && used + segmentWidth > width) {
			output.push(line);
			line = '';
			used = 0;
		}
		if (!line && segmentWidth > width) {
			output.push(segment);
			continue;
		}
		line += segment;
		used += segmentWidth;
	}
	if (line || output.length === 0) output.push(line);
	return output;
}

function truncateDisplay(value: string, width: number): string {
	if (stringWidth(value) <= width) return value;
	if (width <= 3) return takeDisplay(value, width);
	return `${takeDisplay(value, width - 3)}...`;
}

function takeDisplay(value: string, width: number): string {
	let output = '';
	let used = 0;
	for (const segment of graphemes(value)) {
		const segmentWidth = stringWidth(segment);
		if (used + segmentWidth > width) break;
		output += segment;
		used += segmentWidth;
	}
	return output;
}

function cleanTerminalText(value: unknown, preserveNewlines: boolean): string {
	let text = stringifyCell(value).replace(ANSI_PATTERN, '').replace(/\r\n?/gu, '\n');
	text = Array.from(text, (character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		if (character === '\n') return character;
		return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f) ? ' ' : character;
	}).join('');
	return preserveNewlines ? text : text.replace(/\s+/gu, ' ').trim();
}

function stringifyCell(value: unknown): string {
	if (value === undefined) return '';
	if (value === null) return 'null';
	if (typeof value === 'string') return value;
	if (typeof value === 'bigint') return value.toString();
	if (typeof value !== 'object') return String(value);
	try {
		return JSON.stringify(value, bigintReplacer, 2) ?? String(value);
	} catch {
		return String(value);
	}
}

type StyleMap = Partial<Record<'title' | 'header' | 'label' | 'value' | 'footer' | 'empty', CliStyle>>;
function applyStyle(value: string, style: CliStyle | undefined): string {
	return style ? style(value) : value;
}
function maxLineWidth(value: string): number {
	return value.split('\n').reduce((max, line) => Math.max(max, stringWidth(line)), 0);
}
function appendLines(target: string[], values: readonly string[]): void {
	for (const value of values) target.push(value);
}
function normalizeWidth(value: number | undefined): number {
	return value === undefined || !Number.isFinite(value) ? DEFAULT_WIDTH : Math.max(1, Math.floor(value));
}
function finiteWidth(value: number | undefined, fallback: number): number {
	return value === undefined || !Number.isFinite(value) ? fallback : Math.max(1, Math.floor(value));
}
function isFiniteNumber(value: number | undefined): value is number {
	return value !== undefined && Number.isFinite(value);
}
function chooseGapWidth(count: number, width: number): number {
	if (count <= 1) return 0;
	if (width >= count * NARROW_COLUMN_WIDTH + 2 * (count - 1)) return 2;
	if (width >= count + count - 1) return 1;
	return 0;
}
function shouldTruncate(options: CliFormatOptions, column: CliTableColumnOptions | undefined): boolean {
	return options.truncate !== false && column?.truncate !== false;
}
function padRight(value: string, width: number): string {
	return value + ' '.repeat(Math.max(0, width - stringWidth(value)));
}
function padLeft(value: string, width: number): string {
	return ' '.repeat(Math.max(0, width - stringWidth(value))) + value;
}
function bigintReplacer(_key: string, value: unknown): unknown {
	return typeof value === 'bigint' ? value.toString() : value;
}
function graphemes(value: string): Iterable<string> {
	if (typeof Intl.Segmenter === 'function')
		return Array.from(
			new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
			({ segment }) => segment,
		);
	return Array.from(value);
}
