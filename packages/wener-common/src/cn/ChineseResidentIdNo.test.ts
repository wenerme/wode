import { describe, expect, it } from 'vitest';
import { ChineseResidentIdNo } from './mod';

describe('ChineseResidentIdNo', () => {
	it('should parse', () => {
		for (const a of ['11010519491231002X']) {
			let out = ChineseResidentIdNo.parse(a);
			expect(out).toBeTruthy();
			expect(ChineseResidentIdNo.format(out!)).toBe(a);
			expect(out).toMatchSnapshot();
		}
	});
	it('should format with partial', () => {
		expect(ChineseResidentIdNo.format({ addressCode: '110105', birthDate: new Date('1949-12-31'), sequence: 2 })).toBe(
			'11010519491231002X',
		);
	});
});
