import { assert, test } from 'vitest';
import { decrypt } from './decrypt';
import { encrypt } from './index';

test('crypto', () => {
  assert.equal(decrypt('Q5ewARAK1rrqr0DlCUqGfQ=='), '');
  assert.equal(encrypt(''), 'Q5ewARAK1rrqr0DlCUqGfQ==');
});
