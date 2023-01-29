const _table = new Map<number, DivisionTableEntry>();

export type DivisionTable = Map<number, DivisionTableEntry>;

export interface DivisionTableEntry {
  // code: number;
  name: string;
  children: number[]; // used for lookup
}

export function getDivisionTable(): DivisionTable {
  return _table;
}
