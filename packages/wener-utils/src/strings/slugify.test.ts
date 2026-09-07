import { describe, expect, it } from 'vite-plus/test';
import { slugify as rootSlugify, type SlugifyOptions } from '../index';
import { slugify } from './slugify';

describe('slugify', () => {
	it.each([
		['foo bar baz', undefined, 'foo-bar-baz'],
		[' foo, bar ', undefined, 'foo-bar'],
		['foo bar baz', '_', 'foo_bar_baz'],
		['foo bar baz', { replacement: '' }, 'foobarbaz'],
		['Foo bAr baZ', { lower: true }, 'foo-bar-baz'],
		['foo_bar. -@-baz!', { strict: true }, 'foobar-baz'],
		['foo_@_bar-baz!', { replacement: '_', strict: true }, 'foo_barbaz'],
		[' foo bar ', { trim: false }, '-foo-bar-'],
	] satisfies ReadonlyArray<
		readonly [string, SlugifyOptions | string | undefined, string]
	>)('converts %j with %j to %j', (input, options, expected) => {
		expect(slugify(input, options)).toBe(expected);
	});

	it('supports custom removal patterns', () => {
		expect(slugify(`foo *+~.() bar '"!:@ baz`, { remove: /[$*_+~.()'"!\-:@]/g })).toBe('foo-bar-baz');
		expect(slugify('foo bar, bar foo, foo bar', { remove: /[^a-zA-Z0-9 -]/ })).toBe('foo-bar-bar-foo-foo-bar');
		expect(slugify('foo.bar', { remove: '.' })).toBe('foobar');
	});

	it('keeps the default allowed punctuation', () => {
		expect(slugify(`foo *+~.()'"!:@ bar`)).toBe(`foo-*+~.()'"!:@-bar`);
	});

	it.each([
		['À ♥ Ж ١ €', 'A-love-Zh-1-euro'],
		['α β ψ ω', 'a-b-ps-w'],
		['Ә Ғ Қ Ң Ү Ұ Һ Ө', 'AE-GH-KH-NG-UE-U-H-OE'],
		['ა ბ გ შ ჩ', 'a-b-g-sh-ch'],
		['ء ب ش ١', 'a-b-sh-1'],
	])('transliterates %j', (input, expected) => {
		expect(slugify(input)).toBe(expected);
	});

	it.each([
		['bg', 'Й Ц Щ Ъ Ь', 'Y-Ts-Sht-A-Y'],
		['de', 'Ä & Ö', 'AE-und-OE'],
		['es', '% & ♥', 'por-ciento-y-amor'],
		['fr', '% & ♥', 'pourcent-et-amour'],
		['pt', '% & ♥', 'porcento-e-amor'],
		['uk', 'И Й Ц Х Щ Г', 'Y-Y-Ts-Kh-Shch-H'],
		['vi', 'Đ đ', 'D-d'],
		['da', 'Ø Å &', 'OE-AA-og'],
		['nb', '& Å Æ Ø', 'og-AA-AE-OE'],
		['it', 'A & B', 'A-e-B'],
		['nl', 'A & B', 'A-en-B'],
		['sv', '& Å Ä Ö', 'och-AA-AE-OE'],
	])('uses the %s locale', (locale, input, expected) => {
		expect(slugify(input, { locale })).toBe(expected);
	});

	it('falls back for unknown or incorrectly cased locales', () => {
		expect(slugify('Ä & Ö', { locale: 'DE' })).toBe('A-and-O');
	});

	it('normalizes decomposed input', () => {
		expect(slugify('a\u030aa\u0308o\u0308-123', { remove: /[*+~.()'"!:@]/g })).toBe('aao-123');
	});

	it('extends and overrides the process-wide character map', () => {
		slugify.extend({ '☢': 'radioactive', '☯': '-', '☣': '' });
		expect(slugify('unicode ♥ is ☢')).toBe('unicode-love-is-radioactive');
		expect(slugify('day ☯ night')).toBe('day-night');
		expect(slugify('safe☣value')).toBe('safevalue');
	});

	it('exports the typed API from the package root', () => {
		const options: SlugifyOptions = { lower: true, locale: 'de' };
		expect(rootSlugify('Ä & Ö', options)).toBe('ae-und-oe');
	});

	it('rejects non-string input', () => {
		expect(() => slugify(undefined as never)).toThrowError('slugify: string argument expected');
	});
});
