import stringWidth from 'string-width';
import type { CliCommandDefinition } from './CliCommand';

const DEFAULT_COLUMNS = 120;
const INDENT = '  ';
const COLUMN_GAP = '  ';
const MIN_DETAIL_WIDTH = 12;

export function renderCliOverview(
	commands: readonly CliCommandDefinition[],
	options: { columns?: number } = {},
): string {
	const columns = normalizeColumns(options.columns);
	const lines = ['Overview:'];
	renderLevel(commands, 1, columns, lines);
	return `${lines.join('\n')}\n`;
}

function renderLevel(commands: readonly CliCommandDefinition[], depth: number, columns: number, lines: string[]): void {
	commands = commands.filter((command) => !command.hidden);
	const labels = commands.map(commandLabel);
	const labelWidth = Math.max(0, ...labels.map((label) => stringWidth(label)));

	commands.forEach((command, index) => {
		const children = (command.commands ?? []).filter((child) => !child.hidden);
		const operations = children.filter((child) => !child.commands?.length);
		const groups = children.filter((child) => child.commands?.length);
		const detail = children.length
			? operations.map(commandLabel).join(' · ')
			: command.summary?.length
				? command.summary.join(' · ')
				: command.description;
		renderRow(labels[index], detail, depth, labelWidth, columns, lines);
		if (groups.length) renderLevel(groups, depth + 1, columns, lines);
	});
}

function renderRow(
	label: string,
	detail: string,
	depth: number,
	labelWidth: number,
	columns: number,
	lines: string[],
): void {
	const prefix = INDENT.repeat(depth);
	const detailColumn = stringWidth(prefix) + labelWidth + stringWidth(COLUMN_GAP);
	if (!detail) {
		lines.push(...wrapWithPrefix(label, prefix, columns));
		return;
	}
	if (detailColumn + MIN_DETAIL_WIDTH > columns) {
		lines.push(...wrapWithPrefix(label, prefix, columns));
		lines.push(...wrapWithPrefix(detail, `${prefix}${INDENT}`, columns));
		return;
	}
	const firstPrefix = `${prefix}${padDisplay(label, labelWidth)}${COLUMN_GAP}`;
	const continuationPrefix = ' '.repeat(detailColumn);
	const wrapped = wrapDisplay(detail, columns - detailColumn);
	lines.push(`${firstPrefix}${wrapped[0]}`.trimEnd());
	for (const line of wrapped.slice(1)) lines.push(`${continuationPrefix}${line}`.trimEnd());
}

function wrapWithPrefix(value: string, prefix: string, columns: number): string[] {
	const width = Math.max(1, columns - stringWidth(prefix));
	return wrapDisplay(value, width).map((line) => `${prefix}${line}`.trimEnd());
}

function wrapDisplay(value: string, width: number): string[] {
	const lines: string[] = [];
	let line = '';
	for (const token of value.replace(/\s+/gu, ' ').trim().split(' ')) {
		const separator = line ? ' ' : '';
		if (line && stringWidth(line) + stringWidth(separator) + stringWidth(token) <= width) line += separator + token;
		else if (!line && stringWidth(token) <= width) line = token;
		else {
			if (line) lines.push(line);
			const parts = splitDisplay(token, width);
			lines.push(...parts.slice(0, -1));
			line = parts.at(-1) ?? '';
		}
	}
	if (line || lines.length === 0) lines.push(line);
	return lines;
}

function splitDisplay(value: string, width: number): string[] {
	const lines: string[] = [];
	let line = '';
	let used = 0;
	for (const grapheme of graphemes(value)) {
		const graphemeWidth = stringWidth(grapheme);
		if (line && used + graphemeWidth > width) {
			lines.push(line);
			line = '';
			used = 0;
		}
		line += grapheme;
		used += graphemeWidth;
	}
	if (line || lines.length === 0) lines.push(line);
	return lines;
}

function graphemes(value: string): Iterable<string> {
	if (typeof Intl.Segmenter === 'function') {
		return Array.from(
			new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
			({ segment }) => segment,
		);
	}
	return Array.from(value);
}

function commandLabel(command: CliCommandDefinition): string {
	return [command.name, ...(command.aliases ?? [])].join('|');
}

function padDisplay(value: string, width: number): string {
	return value + ' '.repeat(Math.max(0, width - stringWidth(value)));
}

function normalizeColumns(columns: number | undefined): number {
	if (columns === undefined || !Number.isFinite(columns)) return DEFAULT_COLUMNS;
	return Math.max(1, Math.floor(columns));
}
