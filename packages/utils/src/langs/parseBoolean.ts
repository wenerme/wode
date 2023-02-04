export function parseBoolean(s: string | boolean | number | null | undefined, strict: true): boolean | undefined;
export function parseBoolean(s: string | boolean | number | null | undefined | any): boolean;
export function parseBoolean(s?: string | boolean | number | null, strict = false): boolean | undefined {
  if (typeof s === 'boolean') {
    return s;
  }
  if (typeof s === 'string') {
    switch (s.toLowerCase()) {
      case 'f':
      case 'false':
      case '0':
        return false;
      case '1':
      case 't':
      case 'true':
        return true;
    }
  } else if (typeof s === 'number') {
    switch (s) {
      case 0:
        return false;
      case 1:
        return true;
    }
  }
  if (strict) {
    return undefined;
  }
  return Boolean(s);
}
