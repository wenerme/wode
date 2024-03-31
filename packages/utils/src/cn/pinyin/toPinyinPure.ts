import { cartesianProduct } from './cartesianProduct';
// import CharToPinyins from './pinyin.json' with { type: 'json' };
import PyToChar from './data.json' with { type: 'json' };

let CharToPinyinTable: Record<string, string[]>;

export function getCharToPinyinTable() {
  if (!CharToPinyinTable) {
    CharToPinyinTable = {};
    for (let [py, chars] of Object.entries(PyToChar)) {
      for (let c of chars) {
        if (!CharToPinyinTable[c]) {
          CharToPinyinTable[c] = [];
        }
        CharToPinyinTable[c].push(py);
      }
    }
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
  return cartesianProduct(s.split('')
    .map((c) => tab[c] || ''))
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

