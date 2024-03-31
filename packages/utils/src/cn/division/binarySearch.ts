export function binarySearch<T, S = number>(
  arr: T[],
  value: S,
  compare: (a: T, b: S) => number,
): {
  match: boolean;
  index: number;
  value: T | null;
} {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cmp = compare(arr[mid], value);
    if (cmp < 0) {
      low = mid + 1;
    } else if (cmp > 0) {
      high = mid - 1;
    } else {
      return { match: true, index: mid, value: arr[mid] };
    }
  }
  // When no match is found, `low` will be the correct insertIndex.
  return { match: false, index: low, value: null };
}
