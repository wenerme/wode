import { assert, test } from 'vitest';
import { parseErrorMessage } from './parseErrorMessage';

test('parse error', (t) => {
  assert.deepEqual(
    parseErrorMessage(
      'only support inner room, hint: [1234], from ip: 1.1.1.1, more info at https://open.work.weixin.qq.com/devtool/query?e=301059',
    ),
    {
      description: 'only support inner room',
      requestId: '1234',
      ip: '1.1.1.1',
      url: 'https://open.work.weixin.qq.com/devtool/query?e=301059',
    },
  );
});
