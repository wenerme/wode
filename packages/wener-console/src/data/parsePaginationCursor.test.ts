import { assert, test } from 'vitest';
import { parsePaginationCursor } from './parsePaginationCursor';

test('parsePaginationCursor', () => {
  // binary: ~4 byte tag + 128bit,16byte,26char ulid + 1 byte direction
  // 21byte --base64-> 28 char
  // 直接 JSON 为 80 char
  let cursor = btoa(JSON.stringify({ id: 'org_00000000000000000000000000', direction: 'desc' }));
  console.log(`Length(${cursor.length})`, cursor);

  for (const [o, e] of [
    //
    [null, undefined],
    [undefined, undefined],
    ['', undefined],
    [btoa(JSON.stringify({ id: '1' })), { id: '1', direction: 'asc' }],
    [btoa(JSON.stringify({})), undefined],
  ]) {
    assert.deepEqual(parsePaginationCursor(o as string), e as any, `parsePaginationCursor: ${JSON.stringify(o)}`);
  }
  assert.throw(() =>
    parsePaginationCursor('1', {
      onError: (e) => {
        throw e;
      },
    }),
  );
});
