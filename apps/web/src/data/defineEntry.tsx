import type { ReactElement } from 'react';
import { PiBrowserLight } from 'react-icons/pi';

type DefineEntryOptions = {
  href: string;
  title: string;
  description?: string;
  icon?: ReactElement;
  tags?: string[];
  metadata?: Record<string, any>;
};
type EntryDef = {
  href: string;
  title: string;
  icon: ReactElement;
  tags: string[];
  metadata: Record<string, any>;
};

const _all: EntryDef[] = [];

export function defineEntry(opts: DefineEntryOptions[]): EntryDef[];
export function defineEntry(opts: DefineEntryOptions): EntryDef;
export function defineEntry(opts: DefineEntryOptions | DefineEntryOptions[]): EntryDef | EntryDef[] {
  if (Array.isArray(opts)) {
    return opts.map((v) => defineEntry(v));
  }

  const def: EntryDef = {
    icon: <PiBrowserLight />,
    tags: [],
    metadata: [],
    ...opts,
  };

  _all.push(def);

  return def;
}

export function getDefineEntry() {
  return _all;
}
