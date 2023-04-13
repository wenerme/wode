import fs from 'fs-extra';
import { assert, test } from 'vitest';
import { getPackageDir } from './getPackageDir';

test('getPackageDir', () => {
  assert.isTrue(fs.existsSync(getPackageDir() + '/package.json'));
});
