const ToNumber: Record<string, number> = {
  〇: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  百: 100,
  千: 1000,
  万: 10_000,
  零: 0,
  壹: 1,
  贰: 2,
  叁: 3,
  肆: 4,
  伍: 5,
  陆: 6,
  柒: 7,
  捌: 8,
  玖: 9,
  拾: 10,
  佰: 100,
  仟: 1000,
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
};

// 一万一 -> 10001
// 一万一百一 -> 10101
// 一万 -> 10000
// 10000 -> 10000
export function parseChineseNumber(s: string | number) {
  if (typeof s === 'number') {
    return s;
  }

  let n = 0;
  let c = 0;
  let base = 0;
  let shouldAddLast = false;
  for (const char of s.split('').reverse()) {
    c = ToNumber[char];
    if (c === undefined) {
      throw new Error(`无法解析的数字: ${char}`);
    }

    switch (c) {
      case 10: {
        base = 1;
        break;
      }

      case 100: {
        base = 2;
        break;
      }

      case 1000: {
        base = 3;
        break;
      }

      case 10_000: {
        base = 4;
        break;
      }
    }

    //
    if (c < 10) {
      n += c * 10 ** base;
      base++;
      shouldAddLast = false;
    } else {
      shouldAddLast = true;
    }
  }

  if (shouldAddLast) {
    n += c;
  }

  return n;
}
