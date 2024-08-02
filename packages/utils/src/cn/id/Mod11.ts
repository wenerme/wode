/**
 * ISO 7064:1983, MOD 11-2.
 */
export class Mod11Checksum {
  weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1];

  validate(s: string) {
    return s.at(-1) === this.generate(s.slice(0, s.length - 1));
  }

  generate(s: string) {
    const { weights } = this;
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
      sum += parseInt(s[i]) * weights[i];
    }
    const num = (12 - (sum % 11)) % 11;
    if (num < 10) {
      return num.toString();
    } else {
      return 'X';
    }
  }
}

export const Mod11 = new Mod11Checksum();
