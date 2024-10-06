import { describe, expect, test } from 'vitest';
import { cartesianProduct } from './cartesianProduct';

describe('cartesianProduct', () => {
  test('combines two arrays with multiple elements', () => {
    expect(
      cartesianProduct([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ]);
  });

  test('combines multiple arrays', () => {
    expect(cartesianProduct([[1, 2], [3], [4, 5]])).toEqual([
      [1, 3, 4],
      [1, 3, 5],
      [2, 3, 4],
      [2, 3, 5],
    ]);
  });

  test('handles an empty array input correctly', () => {
    expect(cartesianProduct([])).toEqual([]);
  });

  test('handles one array being empty', () => {
    expect(cartesianProduct([[1, 2], [], [3]])).toEqual([]);
  });

  test('works with arrays of different types', () => {
    expect(
      cartesianProduct<string | number>([
        ['a', 'b'],
        [1, 2],
      ]),
    ).toEqual([
      ['a', 1],
      ['a', 2],
      ['b', 1],
      ['b', 2],
    ]);
  });

  test('handles single-element arrays', () => {
    expect(cartesianProduct([[1], [2], [3]])).toEqual([[1, 2, 3]]);
  });

  test('works with more complex objects', () => {
    expect(cartesianProduct<any>([[{ id: 1 }, { id: 2 }], ['a']])).toEqual([
      [{ id: 1 }, 'a'],
      [{ id: 2 }, 'a'],
    ]);
  });

  test('handles an array containing a single array', () => {
    expect(cartesianProduct([[1, 2, 3]])).toEqual([[1], [2], [3]]);
  });
});
