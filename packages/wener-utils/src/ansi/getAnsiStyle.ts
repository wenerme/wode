import { parseBoolean } from '../langs/parseBoolean';

const AnsiCodes = Object.freeze({
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37,
	gray: 90,
	bgBlack: 40,
	bgRed: 41,
	bgGreen: 42,
	bgYellow: 43,
	bgBlue: 44,
	bgMagenta: 45,
	bgCyan: 46,
	bgWhite: 47,
	bold: 1,
	dim: 2,
	italic: 3,
	underline: 4,
	inverse: 7,
	hidden: 8,
	strikethrough: 9,
} as const);

type StyleKey = keyof typeof AnsiCodes;
type ColorMode = boolean | 'auto' | 'always' | 'never';

const ModifierKeys = ['bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough'] as const;

export interface AnsiFormatOptions {
	fg?: string;
	bg?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	dim?: boolean;
	inverse?: boolean;
	hidden?: boolean;
	strikethrough?: boolean;
}

export interface ConsoleColorOptions {
	enabled?: ColorMode;
	env?: Record<string, string | undefined>;
	stream?: { isTTY?: boolean };
}

type AnsiStyleFn = {
	(text: string): string;
	format(text: string, options?: AnsiFormatOptions): string;
};

export type AnsiStyle = AnsiStyleFn & {
	[K in StyleKey]: AnsiStyle;
};

function formatWithCodes(codes: number[], text: string): string {
	if (codes.length === 0) return text;
	return `\x1b[${codes.join(';')}m${text}\x1b[0m`;
}

function resolveFormatOptions(options: AnsiFormatOptions): number[] {
	const codes: number[] = [];
	if (options.fg && options.fg in AnsiCodes) codes.push(AnsiCodes[options.fg as StyleKey]);
	if (options.bg) {
		const key = options.bg.startsWith('bg')
			? options.bg
			: `bg${options.bg[0]?.toUpperCase() ?? ''}${options.bg.slice(1)}`;
		if (key in AnsiCodes) codes.push(AnsiCodes[key as StyleKey]);
	}
	for (const key of ModifierKeys) {
		if (options[key]) codes.push(AnsiCodes[key]);
	}
	return codes;
}

function createStyleProxy(codes: number[], enabled: boolean): AnsiStyle {
	const apply = (text: string): string => (enabled ? formatWithCodes(codes, text) : text);
	const format = (text: string, options?: AnsiFormatOptions): string => {
		if (!enabled) return text;
		return formatWithCodes(options ? [...codes, ...resolveFormatOptions(options)] : codes, text);
	};
	return new Proxy(apply as AnsiStyle, {
		get(_target, prop: string) {
			if (prop === 'format') return format;
			if (prop in AnsiCodes) return createStyleProxy([...codes, AnsiCodes[prop as StyleKey]], enabled);
			return undefined;
		},
		apply(_target, _thisArg, args: [string]) {
			return apply(args[0]);
		},
	});
}

function envBoolean(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	if (value === '') return true;
	return parseBoolean(value);
}

export function isConsoleColorEnabled(options?: ColorMode | ConsoleColorOptions): boolean {
	const input = typeof options === 'object' ? options : { enabled: options };
	const enabled = input.enabled;
	if (typeof enabled === 'boolean') return enabled;
	if (enabled === 'always') return true;
	if (enabled === 'never') return false;
	const env = input.env ?? globalThis.process?.env;
	const force = envBoolean(env?.FORCE_COLOR);
	if (force !== undefined) return force;
	if (env?.NO_COLOR !== undefined) return false;
	return Boolean((input.stream ?? globalThis.process?.stdout)?.isTTY);
}

let enabledStyle: AnsiStyle | undefined;
let disabledStyle: AnsiStyle | undefined;

export function getAnsiStyle(color: ColorMode | ConsoleColorOptions = 'auto'): AnsiStyle {
	const enabled = isConsoleColorEnabled(typeof color === 'object' ? color : { enabled: color });
	return enabled ? (enabledStyle ??= createStyleProxy([], true)) : (disabledStyle ??= createStyleProxy([], false));
}

export function stripAnsi(value: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape stripping intentionally matches ESC.
	return value.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}
