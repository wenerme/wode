import { MaybePromise } from '@wener/utils';

const _table = new Map<number, DivisionTableEntry>();

export type DivisionTable = Map<number, DivisionTableEntry>;

export interface DivisionTableEntry {
  code?: number;
  name: string;
  children: number[]; // used for lookup
}

export function getDivisionTable(): DivisionTable {
  return _table;
}

/**
 * for full dataset better provide a db to work with
 */
export function getDivisionProvider(): DivisionProvider {
  return _table;
}

export interface DivisionProvider {
  get(code: number): MaybePromise<DivisionTableEntry | undefined>;
}
