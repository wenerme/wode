import { describe, expect, test } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  test('should merge class', () => {
    expect(cn('p-1 p-2')).toBe('p-2');
  });

  test('should merge daisy ui', () => {
    expect(cn('btn-info btn-xs btn-sm btn-md', 'btn-success')).toBe('btn-md btn-success');
  });
});
