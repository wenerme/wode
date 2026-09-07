import { assert, describe, test } from 'vite-plus/test';
import { md5 } from './md5';

describe('md5', () => {
	test('js', () => {
		assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
	});
});
