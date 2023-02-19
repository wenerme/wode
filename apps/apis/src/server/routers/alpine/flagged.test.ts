import test from 'ava';
import { getFlagged } from './getFlagged';

test('flagged', async (t) => {
  t.log(await getFlagged());
  t.pass();
});
