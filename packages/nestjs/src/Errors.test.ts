import { test } from 'vitest';
import { Errors } from './Errors';

test('Errors', async () => {
  const a: string | undefined = '';
  Errors.BadRequest.check(a);
  a.startsWith('');
});
