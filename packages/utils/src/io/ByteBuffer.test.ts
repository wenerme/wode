import { assert, test } from 'vitest';
import { ByteBuffer } from './ByteBuffer';

test('ByteBuffer', async () => {
  {
    let buf = new ByteBuffer();
    buf.writeString('Hello');
    buf.writeString('World');
    assert.equal(buf.length, 10);
    assert.equal(buf.position, 10);
    buf.length = 5;
    assert.equal(buf.length, 5);
    buf.position = 0;
    assert.equal(buf.readString(5), 'Hello');
  }
  {
    let buf = new ByteBuffer();
    buf.writeBytes(new Uint8Array(1025));
  }
});
