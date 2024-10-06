import { expect, test } from 'vitest';
import { matchTenantFromHost } from './matchTenantFromHost';

test('matchTenantFromHost', () => {
  for (const [a, b] of [
    ['', undefined],
    ['wener.me', { tenant: true, domain: 'wener.me' }],
    ['hi.wener.me', { tenant: true, domain: 'hi.wener.me' }],
    ['hi.wener.me:80', { tenant: true, domain: 'hi.wener.me' }],
  ] as const) {
    expect(matchTenantFromHost(a)).toEqual(b);
  }
});
