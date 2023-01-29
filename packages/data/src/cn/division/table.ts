let _table: Map<number, DivisionEntry> = new Map();

export type DivisionTable = Map<number, DivisionEntry>;

export interface DivisionEntry {
  // code: number;
  name: string;
  children: number[]; // used for lookup
}

export function getDivisionTable(): DivisionTable {
  return _table;
}
