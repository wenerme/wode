import { expect, test } from 'vitest';
import { isValidMethodName, isValidServiceName } from './utils';

test('method name', () => {
  for (const [a, b] of [
    ['_a', false],
    ['.a', false],
    ['a.', false],
    ['a_', true],
    ['ab', true],
  ] as Array<[string, boolean]>) {
    expect(isValidMethodName(a), `method: ${a}`).toBe(b);
  }
});

test('service name', () => {
  for (const [a, b] of [
    ['', false],
    ['_a', false],
    ['.a', false],
    ['a.', false],
    ['a_', true],
    ['ab', true],
    ['a.b', true],
    ['a..b', false],
  ] as Array<[string, boolean]>) {
    expect(isValidServiceName(a), `service: ${a}`).toBe(b);
  }
});
