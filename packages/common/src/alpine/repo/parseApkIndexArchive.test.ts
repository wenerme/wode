import { expect, test } from 'vitest';
import { createAlpineMirror } from '../AlpineMirror';

test('parseApkIndex', async () => {
	let repo = createAlpineMirror();
	const { packages } = await repo.getRepo().getIndex();
	expect(packages.length).gt(0);
});
