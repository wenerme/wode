import { expect, test } from 'vitest';
import { ParsedPackageId, parsePackageId } from '@/poc/alpine/repo/parsePackageId';

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
