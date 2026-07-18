import { assert, test } from 'vite-plus/test';
import { parseTimestamp } from './parseTimestamp';

test('parseTimestamp', () => {
	assert.equal(parseTimestamp(''), undefined);
	assert.equal(parseTimestamp(), undefined);
});
