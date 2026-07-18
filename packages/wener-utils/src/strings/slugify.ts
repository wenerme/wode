// Ported from simov/slugify 1.6.9 (MIT). See ./slugify-data/NOTICE.md.
import { defaultCharacterMap, localeMaps } from './slugify-data/data';

const DEFAULT_REMOVE = /[^\w\s$*_+~.()'"!\-:@]+/g;
const STRICT_REMOVE = /[^A-Za-z0-9\s]/g;
const WHITESPACE = /\s+/g;
const characterMap: Record<string, string> = { ...defaultCharacterMap };

export type SlugifyOptions = {
	readonly replacement?: string;
	readonly remove?: RegExp | string;
	readonly lower?: boolean;
	readonly strict?: boolean;
	readonly locale?: string;
	readonly trim?: boolean;
};

export type SlugifyCharacterMap = Readonly<Record<string, string>>;

export type Slugify = {
	(input: string, options?: SlugifyOptions | string): string;
	extend(customMap: SlugifyCharacterMap): void;
};

function slugifyString(input: string, options?: SlugifyOptions | string): string {
	if (typeof input !== 'string') {
		throw new Error('slugify: string argument expected');
	}

	const resolvedOptions = typeof options === 'string' ? { replacement: options } : (options ?? {});
	const replacement = resolvedOptions.replacement === undefined ? '-' : resolvedOptions.replacement;
	const trim = resolvedOptions.trim === undefined ? true : resolvedOptions.trim;
	const remove = resolvedOptions.remove || DEFAULT_REMOVE;
	const locale = resolvedOptions.locale === undefined ? undefined : localeMaps[resolvedOptions.locale];
	const output: string[] = [];

	for (const character of input.normalize().split('')) {
		let value = locale?.[character];
		if (value === undefined) value = characterMap[character];
		if (value === undefined) value = character;
		if (value === replacement) value = ' ';
		output.push(value.replace(remove, ''));
	}

	let result = output.join('');
	if (resolvedOptions.strict) result = result.replace(STRICT_REMOVE, '');
	if (trim) result = result.trim();
	result = result.replace(WHITESPACE, replacement);
	return resolvedOptions.lower ? result.toLowerCase() : result;
}

export const slugify: Slugify = Object.assign(slugifyString, {
	extend(customMap: SlugifyCharacterMap): void {
		Object.assign(characterMap, customMap);
	},
});
