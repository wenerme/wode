import { ParsedPackageId, parsePackageId } from '@src/poc/alpine/repo/parsePackageId';
import { test, expect } from 'vitest';

test('parsePackageId', () => {
  for (const [a, b] of [
    [
      'edge/community/go/123',
      {
        branch: 'edge',
        path: 'community/go',
        pkg: 'go',
        repo: 'community',
        ver: '123',
      },
    ] as [string, ParsedPackageId],
  ]) {
    expect(parsePackageId(a)).toEqual(b);
  }
});
