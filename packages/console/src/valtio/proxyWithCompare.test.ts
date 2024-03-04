import { getVersion } from 'valtio';
import { expect, test } from 'vitest';
import { proxyWith } from './proxyWith';
import { proxyWithCompare } from './proxyWithCompare';

test('proxyWithCompare', () => {
  {
    const s = proxyWithCompare({ a: 0 });
    expect(s.a).toBe(0);
    const last = getVersion(s);
    s.a = 0;
    expect(getVersion(s)).toBe(last);
  }
  {
    const s = proxyWith({ initialState: { a: 0 }, name: 'X' });
    const last = getVersion(s);
    s.a = 0;
    expect(getVersion(s)).toBe(last);
  }
});
