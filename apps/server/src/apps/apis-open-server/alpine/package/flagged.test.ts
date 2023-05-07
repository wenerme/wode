import { test } from 'vitest';
import { getFlagged } from './getFlagged';

test.skip('flagged', async () => {
  console.log(await getFlagged());
}, 30_000);
