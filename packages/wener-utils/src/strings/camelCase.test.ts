import { describe, expect, it } from 'vite-plus/test';
import { type CamelCaseOptions, camelCase as rootCamelCase } from '../index';
import { camelCase, pascalCase } from './camelCase';

describe('camelCase', () => {
	it.each([
		['foo', 'foo'],
		['foo-bar', 'fooBar'],
		['foo_bar', 'fooBar'],
		['foo.bar', 'fooBar'],
		['foo bar', 'fooBar'],
		['--foo--bar--', 'fooBar'],
		['_foo_bar', 'fooBar'],
		['--XMLHttpRequest', 'xmlHttpRequest'],
		['XMLHttpRequest', 'xmlHttpRequest'],
		['FooIDs', 'fooIds'],
		['b2b_registration', 'b2bRegistration'],
		['foo2bar', 'foo2Bar'],
		['foo2b', 'foo2B'],
		['turn_on_2sv', 'turnOn2Sv'],
		['-', ''],
		['.', ''],
		['', ''],
	])('converts %j to %j', (input, expected) => {
		expect(camelCase(input)).toBe(expected);
	});

	it('joins array input and accepts readonly arrays', () => {
		const input = ['foo', 'bar', ''] as const;
		expect(camelCase(input)).toBe('fooBar');
	});

	it('exports optional PascalCase behavior from the package root', () => {
		const input = ['foo', 'bar'] as const;
		const options: CamelCaseOptions = { pascalCase: true };
		expect(rootCamelCase(input, options)).toBe('FooBar');
		expect(rootCamelCase('foo-bar', { pascalCase: false })).toBe('fooBar');
	});

	it.each([
		['élanÉclair', 'élanÉclair'],
		['РозовыйПушистый', 'розовыйПушистый'],
		['розовый_пушистый', 'розовыйПушистый'],
		['桑德_在这里。', '桑德在这里。'],
		['foo_éclair', 'fooÉclair'],
	])('handles common Unicode input %j', (input, expected) => {
		expect(camelCase(input)).toBe(expected);
	});

	it('handles long alternating ASCII input without changing its meaning', () => {
		const input = 'aA'.repeat(8192);
		expect(camelCase(input)).toBe(input);
	});

	it('rejects unsupported input', () => {
		expect(() => camelCase(1 as never)).toThrowError('Expected the input to be `string | string[]`');
	});
});

describe('pascalCase', () => {
	it.each([
		['foo-bar', 'FooBar'],
		['XMLHttpRequest', 'XmlHttpRequest'],
		['b2b_registration', 'B2bRegistration'],
		['розовый_пушистый', 'РозовыйПушистый'],
		['𐐨_name', '𐐀Name'],
	])('converts %j to %j', (input, expected) => {
		expect(pascalCase(input)).toBe(expected);
	});
});
