import { assert, test } from 'vitest';
import { ArrayBuffers } from './ArrayBuffers';
import { parseDataUri } from './parseDataUri';

test('parseDataUri', async () => {
  {
    let uri = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
    const { getData, ...out } = parseDataUri(uri)!;
    assert.deepEqual(out, {
      type: 'text/plain',
      params: { base64: true },
      content: 'SGVsbG8sIFdvcmxkIQ==',
      base64: true,
    });
    assert.equal(await getData('utf-8'), await fetch(uri).then((v) => v.text()));
    assert.equal(await getData('base64'), 'SGVsbG8sIFdvcmxkIQ==');
  }
  {
    // text
    let uri = 'data:text/plain,Hello%2C%20World!';
    const { getData, ...out } = parseDataUri(uri)!;
    assert.deepEqual(out, {
      type: 'text/plain',
      params: {},
      content: 'Hello%2C%20World!',
      base64: false,
    });

    assert.equal(await getData('utf-8'), 'Hello, World!');
    assert.deepEqual(ArrayBuffers.asView(Uint8Array, await getData()), new TextEncoder().encode('Hello, World!'));
    assert.equal(await getData('utf-8'), await fetch(uri).then((v) => v.text()));
    assert.equal(await getData('base64'), 'SGVsbG8sIFdvcmxkIQ==');
  }
});
