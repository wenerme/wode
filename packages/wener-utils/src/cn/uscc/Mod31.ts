/**
 * GB/T 17710（采ISO 7064）的模31校验码
 *
 * Mod31-3
 */
export class Mod31Checksum {
  weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
  chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
  numbers: Record<string, number> = this.chars.split('').reduce(
    (acc, cur, i) => {
      acc[cur] = i;
      return acc;
    },
    {} as Record<string, number>,
  );

  toChar(n: number) {
    return this.chars[n];
  }

  toNumber(c: string) {
    return this.numbers[c];
  }

  validate(s: string) {
    return s.at(-1) === this.compute(s.slice(0, s.length - 1));
  }

  compute(s: string) {
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
      sum += this.numbers[s[i]] * this.weights[i];
    }
    return this.toChar(31 - (sum % 31));
  }
}

export const Mod31 = new Mod31Checksum();
