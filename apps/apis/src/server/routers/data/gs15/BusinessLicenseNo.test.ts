import { test } from 'vitest';
import { BusinessLicenseNo } from '@src/components/cn/gs15/BusinessLicenseNo';

test('BusinessLicenseNo', () => {
  BusinessLicenseNo.parse('330196000080659');
});
