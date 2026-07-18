import { describe, expect, it } from 'vite-plus/test';
import { UnifiedSocialCreditCode } from './index';

describe('UnifiedSocialCreditCode', () => {
	it('should parse', () => {
		for (const a of [
			//
			'91330106673959654P',
			'91330106MA2CFLDG4R',
		]) {
			let out = UnifiedSocialCreditCode.parse(a);
			expect(UnifiedSocialCreditCode.format(out!)).toBe(a);
			expect(out).toMatchSnapshot();
		}
	});
});
