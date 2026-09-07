import { assert, test } from 'vite-plus/test';
import { loadCharToPinyinTable } from './loader';
import { toPinyinPure } from './toPinyinPure';

test('toPinyin', async () => {
	await loadCharToPinyinTable();
	assert.deepEqual(toPinyinPure('真思'), ['zhen,sai', 'zhen,si']);

	// char to py -> 350k
	// py to char -> 145k
	// csv -> 96k
});
