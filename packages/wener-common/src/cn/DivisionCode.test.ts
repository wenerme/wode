import { describe, expect, it } from 'vitest';
import { DivisionCode } from './mod';

describe('DivisionCode', () => {
	it('should parse', () => {
		for (const [a, b] of [
			[
				'441900003001',
				{
					codes: ['44', '19', '00', '003', '001'],
				},
			],
			[
				441900003001,
				{
					codes: ['44', '19', '00', '003', '001'],
				},
			],
			[441900, { codes: ['44', '19', '00'] }],
			['31', { codes: ['31'] }],
			['4', undefined],
			['', undefined],
			[null, undefined],
			[undefined, undefined],
		] as Array<[string, any]>) {
			let out = DivisionCode.parse(a);
			expect(out).toMatchObject(b);
			if (out) {
				expect(DivisionCode.format(out)).toBe(String(a));
			}
		}
	});
});
