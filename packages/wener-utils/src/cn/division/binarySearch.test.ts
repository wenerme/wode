import { describe, expect, test } from 'vitest';
import { binarySearch } from './binarySearch';

describe('binarySearch', () => {
  test('finds an existing element in the middle of the array', () => {
    const arr = [1, 3, 5, 7, 9];
    const result = binarySearch(arr, 5, (a, b) => a - b);
    expect(result).toEqual({ match: true, index: 2, value: 5 });
  });

  test('finds an existing element at the start of the array', () => {
    const arr = [1, 3, 5, 7, 9];
    const result = binarySearch(arr, 1, (a, b) => a - b);
    expect(result).toEqual({ match: true, index: 0, value: 1 });
  });

  test('finds an existing element at the end of the array', () => {
    const arr = [1, 3, 5, 7, 9];
    const result = binarySearch(arr, 9, (a, b) => a - b);
    expect(result).toEqual({ match: true, index: 4, value: 9 });
  });

  test('searches for a value not in the array, insert in the middle', () => {
    const arr = [1, 3, 7, 9];
    const result = binarySearch(arr, 5, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 2, value: null });
  });

  test('searches for a value not in the array, insert at the start', () => {
    const arr = [3, 5, 7, 9];
    const result = binarySearch(arr, 1, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 0, value: null });
  });

  test('searches for a value not in the array, insert at the end', () => {
    const arr = [1, 3, 5, 7];
    const result = binarySearch(arr, 9, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 4, value: null });
  });

  test('searches in an empty array', () => {
    const arr: number[] = [];
    const result = binarySearch(arr, 1, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 0, value: null });
  });

  test('searches in a single-element array, element matches', () => {
    const arr = [5];
    const result = binarySearch(arr, 5, (a, b) => a - b);
    expect(result).toEqual({ match: true, index: 0, value: 5 });
  });

  test('searches in a single-element array, insert at the start', () => {
    const arr = [3];
    const result = binarySearch(arr, 1, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 0, value: null });
  });

  test('searches in a single-element array, insert at the end', () => {
    const arr = [1];
    const result = binarySearch(arr, 3, (a, b) => a - b);
    expect(result).toEqual({ match: false, index: 1, value: null });
  });
});
