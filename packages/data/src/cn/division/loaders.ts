import { MaybePromise } from '@wener/utils';
import { DivisionTable, getDivisionTable } from './table';

//@ts-ignore
declare module '@wener/data/cn/division/county.json' {
  const data: DivisionData;
  export default data;
}

export function loadCounty(): MaybePromise<DivisionTable> {
  const table = getDivisionTable();
  if (loadCounty.loaded) {
    return table;
  }

  return (loadCounty.loader ??= import('../../../data/cn/division/county.json').then((v) => {
    loadCounty.loaded = true;
    loadData(v.default as DivisionData);
    return table;
  }));
}

loadCounty.loaded = false;
loadCounty.loader = undefined as Promise<DivisionTable> | undefined;

export type DivisionNameData = [number, string][];
export type DivisionChildrenData = [number, number[]][];
export type DivisionData = [number, string, number[]][];

// @ts-ignore
function loadName(data: DivisionNameData) {
  let table = getDivisionTable();
  for (let [code, name] of data) {
    let e = table.get(code);
    if (!e) {
      e = { name, children: [] };
      table.set(code, e);
    } else {
      e.name = name;
    }
  }
}

// @ts-ignore
function loadChildren(data: DivisionChildrenData) {
  let table = getDivisionTable();
  for (let [code, children] of data) {
    let e = table.get(code);
    if (!e) {
      e = { name: '', children };
      table.set(code, e);
    } else {
      e.children = children;
    }
  }
}

function loadData(data: DivisionData) {
  let table = getDivisionTable();
  for (let [code, name, children] of data) {
    let e = table.get(code);
    if (!e) {
      e = { name, children };
      table.set(code, e);
    } else {
      e.name = name;
      e.children = children;
    }
  }
}
