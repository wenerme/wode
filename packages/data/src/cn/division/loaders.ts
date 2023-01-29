import { type MaybePromise } from '@wener/utils';
import { type DivisionTable, getDivisionTable } from './table';

// @ts-expect-error
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

// @ts-expect-error
function loadName(data: DivisionNameData) {
  const table = getDivisionTable();
  for (const [code, name] of data) {
    let e = table.get(code);
    if (!e) {
      e = { name, children: [] };
      table.set(code, e);
    } else {
      e.name = name;
    }
  }
}

// @ts-expect-error
function loadChildren(data: DivisionChildrenData) {
  const table = getDivisionTable();
  for (const [code, children] of data) {
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
  const table = getDivisionTable();
  for (const [code, name, children] of data) {
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
