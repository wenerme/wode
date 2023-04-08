import { test } from 'vitest';
import { getFlagged } from './getFlagged';

test('flagged', async () => {
  console.log(await getFlagged());
}, 30_000);
