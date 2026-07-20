import colors, { Chalk, type ChalkInstance } from 'chalk';
import type { ConsolaOptions, FormatOptions, LogObject, LogType } from 'consola/core';
import dayjs from 'dayjs';
import { isDevelopment } from 'std-env';

const LevelColors: Record<LogType, (str: string) => string> = {
	trace: colors.gray,
	debug: colors.cyan,
	info: colors.blueBright,
	warn: colors.yellow,
	error: colors.red,
	fatal: colors.bgRed.white,
	silent: colors.white,
	log: colors.white,
	success: colors.green,
	fail: colors.red,
	ready: colors.green,
	start: colors.cyan,
	box: colors.white,
	verbose: colors.green,
};

const levelShort: Record<LogType, string> = {
	trace: 'TRAC',
	debug: 'DEBG',
	info: 'INFO',
	warn: 'WARN',
	error: 'ERRO',
	fatal: 'FATL',
	silent: 'SLNT',
	log: 'LOG ', // Added space to make it 4 characters
	success: 'SUCC',
	fail: 'FAIL',
	ready: 'READ',
	start: 'STRT',
	box: 'BOX ', // Added space to make it 4 characters
	verbose: 'VERB',
};
const start = Date.now();

const Colors: ChalkInstance = colors;
const NoColors = new Chalk({ level: 0 });

export function formatLogObject(
	o: LogObject,
	ctx: {
		options: ConsolaOptions;
	},
) {
	const shouldColor = Boolean(ctx.options?.formatOptions?.colors);

	let { date, type, tag } = o;
	type = type === 'log' ? 'info' : type;
	const colors = shouldColor ? Colors : NoColors;
	let color = LevelColors[type] || colors.white;
	if (!shouldColor) {
		color = (v) => v;
	}
	const levelText = levelShort[type] || type.toUpperCase().slice(0, 4); // Get first 4 chars, consistent uppercase

	let line = '';
	let out: string[] = [];

	// Timestamp
	if (isDevelopment) {
		// process.hrtime.bigint()
		let diff = (date.getTime() - start) / 1000;

		out.push(colors.gray(diff.toFixed(3).padStart(7, ' ')));
	} else {
		out.push(colors.gray(dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS')));
	}

	// Log Level (colored)
	// Pad to 4 characters
	out.push(color(levelText.padEnd(4, ' ')));

	if (tag) {
		out.push(colors.yellow(`[${tag}]`)); // Added color for tag
	}

	{
		const [message, ...additional] = formatArgs(o.args, { colors: shouldColor }).split('\n');

		out.push(characterFormat(message));

		line = out.join(' ');
		if (additional.length > 0) {
			line += characterFormat(additional.join('\n'));
		}

		if (type === 'trace') {
			const _err = new Error(`Trace: ${o.message}`);
			line += formatStack(_err.stack || '', _err.message);
		}
	}

	// if (!message && typeof args[0] === 'string') {
	//   message = args.shift();
	// }
	// if (message) {
	//   out.push(message);
	// }
	// if (args.length) {
	//   out.push(...args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))); // Handle non-string args
	// }

	// todo format error
	// https://github.com/unjs/consola/blob/main/src/reporters/fancy.ts

	// return out.join('  '); // Increased spacing for better readability
	return line;
}

function characterFormat(str: string) {
	return (
		str
			// highlight backticks
			.replace(/`([^`]+)`/gm, (_, m) => colors.cyan(m))
			// underline underscores
			.replace(/\s+_([^_]+)_\s+/gm, (_, m) => ` ${colors.underline(m)} `)
	);
}

function parseStack(stack: string, message: string) {
	// const cwd = process.cwd() + sep;

	const lines = stack
		.split('\n')
		.splice(message.split('\n').length)
		.map(
			(l) => l.trim().replace('file://', ''),
			// .replace(cwd, '')
		);

	return lines;
}

function formatStack(stack: string, message: string, opts?: FormatOptions) {
	const indent = '  '.repeat((opts?.errorLevel || 0) + 1);
	return (
		`\n${indent}` +
		parseStack(stack, message)
			.map(
				(line) =>
					`  ${line.replace(/^at +/, (m) => colors.gray(m)).replace(/\((.+)\)/, (_, m) => `(${colors.cyan(m)})`)}`,
			)
			.join(`\n${indent}`)
	);
}

function formatArgs(args: any[], opts: FormatOptions) {
	const _args = args.map((arg) => {
		if (arg && typeof arg.stack === 'string') {
			return formatError(arg, opts);
		}
		return arg;
	});

	// Only supported with Node >= 10
	// https://nodejs.org/api/util.html#util_util_inspect_object_options
	return formatWithOptions(Boolean(opts.colors), ..._args);
}

function formatWithOptions(shouldColor: boolean, ...params: any[]) {
	return params.map((value) => formatValue(value, shouldColor)).join(' ');
}

function formatValue(value: any, shouldColor: boolean = false): string {
	const colors = shouldColor ? Colors : NoColors;

	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);

	if (typeof value === 'object' && value.constructor === Object) {
		const entries = Object.entries(value);
		if (entries.length === 0) return '{}';
		return entries
			.map(([key, val]) => {
				const keyStr = shouldColor ? colors.blue(key) : key;
				const valStr = shouldColor ? colors.green(JSON.stringify(val)) : JSON.stringify(val);
				return `${keyStr}=${valStr}`;
			})
			.join(' ');
	}

	// For arrays and other objects, use JSON.stringify directly
	try {
		const result = JSON.stringify(value);
		return shouldColor ? colors.green(result) : result;
	} catch {
		return String(value);
	}
}

function formatError(err: any, opts: FormatOptions): string {
	const message = err.message ?? formatWithOptions(Boolean(opts.colors), err);
	const stack = err.stack ? formatStack(err.stack, message, opts) : '';

	const level = opts?.errorLevel || 0;
	const causedPrefix = level > 0 ? `${'  '.repeat(level)}[cause]: ` : '';
	const causedError = err.cause ? `\n\n${formatError(err.cause, { ...opts, errorLevel: level + 1 })}` : '';

	return `${causedPrefix + message}\n${stack}${causedError}`;
}
