export function parseTimestamp(raw?: string | number | Date): Date | undefined {
  if (!raw) {
    return undefined;
  }
  if (raw instanceof Date) {
    return raw;
  }

  if (typeof raw === 'string' && /^[0-9.]+$/.test(raw)) {
    let n = parseFloat(raw);
    const len = Math.floor(n).toString().length;
    /*
    最常见的是 10 位和 13 位
    9999999999 - 10*9 - 1970-04-26
    99999999999 - 11*9 - 1973
    999999999999 - 12*9 - 2001
     */
    if (len <= 11) {
      n *= 1000;
    }
    return new Date(n);
  } else if (typeof raw === 'string') {
    const date = new Date(raw);
    if (!isNaN(+date)) {
      return date;
    }
  }
  throw new Error(`parseTimestamp: invalid "${raw}"`);
}
