import test from 'ava';
import { BusinessLicenseNo } from '@src/components/cn/gs15/BusinessLicenseNo';

test('BusinessLicenseNo', (t) => {
  BusinessLicenseNo.parse('330196000080659');
});
