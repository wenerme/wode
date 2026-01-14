import { parseBoolean } from '@wener/utils';

// ANSI escape codes
const AnsiCodes = Object.freeze({
	// Foreground colors
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37,
	gray: 90,

	// Background colors
	bgBlack: 40,
	bgRed: 41,
	bgGreen: 42,
	bgYellow: 43,
	bgBlue: 44,
	bgMagenta: 45,
	bgCyan: 46,
	bgWhite: 47,

	// Modifiers
	bold: 1,
	dim: 2,
	italic: 3,
	underline: 4,
	inverse: 7,
	hidden: 8,
	strikethrough: 9,
} as const);

type StyleKey = keyof typeof AnsiCodes;

// Keys that can be used in FormatOptions (modifiers only)
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

	// fg color lookup
	if (options.fg && options.fg in AnsiCodes) {
		codes.push(AnsiCodes[options.fg as StyleKey]);
	}

	// bg color = fg color + 10
	if (options.bg && options.bg in AnsiCodes) {
		codes.push(AnsiCodes[options.bg as StyleKey] + 10);
	}

	// modifiers
	for (const key of ModifierKeys) {
		if (options[key]) {
			codes.push(AnsiCodes[key]);
		}
	}

	return codes;
}

function createStyleProxy(codes: number[], enabled: boolean): AnsiStyle {
	const apply = (text: string): string => {
		if (!enabled) return text;
		return formatWithCodes(codes, text);
	};

	const format = (text: string, options?: AnsiFormatOptions): string => {
		if (!enabled) return text;
		const allCodes = options ? [...codes, ...resolveFormatOptions(options)] : codes;
		return formatWithCodes(allCodes, text);
	};

	return new Proxy(apply as AnsiStyle, {
		get(_target, prop: string) {
			if (prop === 'format') {
				return format;
			}

			if (prop in AnsiCodes) {
				const code = AnsiCodes[prop as StyleKey];
				return createStyleProxy([...codes, code], enabled);
			}

			return undefined;
		},
		apply(_target, _thisArg, args: [string]) {
			return apply(args[0]);
		},
	});
}

export function isConsoleColorEnabled(enabled?: boolean): boolean {
	if (typeof enabled === 'boolean') {
		return enabled;
	}
	const env = globalThis.process?.env;
	if (env) {
		if (env.FORCE_COLOR) {
			return parseBoolean(env.FORCE_COLOR);
		}
		if (env.NO_COLOR) {
			return false;
		}
	}
	return Boolean(globalThis.process?.stdout?.isTTY);
}

let _enabled: AnsiStyle | undefined;
let _disabled: AnsiStyle | undefined;

/**
 * Get ANSI style formatter
 *
 * @example
 * ```ts
 * const ansi = getAnsiStyle();
 *
 * // Chainable API
 * ansi.red('error')
 * ansi.red.bold('error')
 * ansi.bgRed.white.bold('alert')
 *
 * // Format API
 * ansi.format('text', { fg: 'red', bold: true })
 * ansi.red.format('text', { underline: true })
 * ```
 */
export function getAnsiStyle(colorEnabled: boolean = isConsoleColorEnabled()): AnsiStyle {
	if (colorEnabled) {
		return (_enabled ??= createStyleProxy([], true));
	}
	return (_disabled ??= createStyleProxy([], false));
}
