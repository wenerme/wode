import { expectTypeOf, test } from 'vitest';
import { ArrayBuffers } from './ArrayBuffers';

test('my types work properly', () => {
  expectTypeOf(ArrayBuffers.asView(Buffer, new Uint8Array())).toMatchTypeOf<Buffer>();
});
