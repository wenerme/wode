const _weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
const _table = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export function mod11(s: string) {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    sum += parseInt(s[i]) * _weights[i];
  }
  sum %= 11;
  sum = _table[sum];
  if (sum === 10) {
    return 'X';
  }
  return sum.toString();
}
