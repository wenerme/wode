import { cartesianProduct } from './cartesianProduct';

let CharToPinyinTable: Record<string, string[]> | undefined;

export function setCharToPinyinTable(table: Record<string, string[]>) {
  CharToPinyinTable = table;
}

export function getCharToPinyinTable() {
  if (!CharToPinyinTable) {
    return {};
  }
  return CharToPinyinTable;
}

export function toPinyinPureFirst(s: string, sep = ','): string {
  let tab = getCharToPinyinTable();
  return s
    .split('')
    .map((c) => tab[c]?.[0])
    .filter(Boolean)
    .join(sep);
}

export function toPinyinPure(s: string, sep = ','): string[] {
  let tab = getCharToPinyinTable();
  // ensure order
  return cartesianProduct(s.split('').map((c) => tab[c] || ''))
    .sort((a, b) => {
      for (let i = 0; i < a.length; i++) {
        let x = a[i];
        let y = b[i];
        if (x < y) return -1;
        if (x > y) return 1;
      }
      return 0;
    })
    .map((v) => v.filter(Boolean).join(sep));
}

// export function lookupPinyinPure(s: string): Array<Array<string>> {
//   return cartesianProductOfArray(s.split('').map(c => Lookup[c]));
// }
