import { expect, test } from 'vite-plus/test';
import { type ParsedPackageId, parsePackageId } from './parsePackageId';

test('parsePackageId', () => {
	for (const [a, b] of [
		[
			'edge/community/go/123',
			{ branch: 'edge', path: 'community/go', pkg: 'go', repo: 'community', version: '123' },
		] as [string, ParsedPackageId],
	]) {
		expect(parsePackageId(a)).toEqual(b);
	}
});
