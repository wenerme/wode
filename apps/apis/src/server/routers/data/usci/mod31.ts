export function mod31(s: string) {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    sum += Mod31Numbers[s[i]] * weights[i];
  }
  return 31 - (sum % 31);
}

const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
export const Mod31Chars: Record<string, string> = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: 'A',
  11: 'B',
  12: 'C',
  13: 'D',
  14: 'E',
  15: 'F',
  16: 'G',
  17: 'H',
  18: 'J',
  19: 'K',
  20: 'L',
  21: 'M',
  22: 'N',
  23: 'P',
  24: 'Q',
  25: 'R',
  26: 'T',
  27: 'U',
  28: 'W',
  29: 'X',
  30: 'Y',
};
export const Mod31Numbers: Record<string, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  J: 18,
  K: 19,
  L: 20,
  M: 21,
  N: 22,
  P: 23,
  Q: 24,
  R: 25,
  T: 26,
  U: 27,
  W: 28,
  X: 29,
  Y: 30,
};