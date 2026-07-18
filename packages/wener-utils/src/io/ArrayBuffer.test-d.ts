import { expectTypeOf, test } from 'vite-plus/test';
import { ArrayBuffers } from './ArrayBuffers';

test('my types work properly', () => {
	expectTypeOf(ArrayBuffers.asView(Buffer, new Uint8Array())).toExtend<Buffer>();
});
