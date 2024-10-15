import type { ReactElement } from 'react';
import { PiBrowserLight } from 'react-icons/pi';
import type { MaybeArray } from '@wener/utils';
import { startCase } from 'lodash';

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

  // treat first segment as tag if exists
  {
    const [, first] = opts.href.split('/');
    let found = _tags.find((v) => v.name === first);
    if (found) {
      if (!def.tags.includes(found.name)) {
        def.tags.push(found.name);
      }
    }
  }

  // find icon from tags
  {
    let icon = opts.icon;
    if (!icon && opts.tags) {
      for (const tag of opts.tags) {
        let found = _tags.find((v) => v.name === tag && v.icon);
        if (found) {
          icon = found.icon;
          break;
        }
      }
    }
    def.icon = icon || def.icon;
  }

  _all.push(def);

  return def;
}

export function getDefineEntry() {
  return _all;
}

type DefineTagOptions = {
  name: string;
  title?: string;
  description?: string;
  icon?: ReactElement;
  metadata?: Record<string, any>;
};

const _tags: DefineTagOptions[] = [];
type TagDef = {
  name: string;
  title: string;
  description?: string;
  icon?: ReactElement;
  metadata: Record<string, any>;
};

export function defineTags(opts: DefineTagOptions[]): TagDef[];
export function defineTags(opts: DefineTagOptions): TagDef;
export function defineTags(opts: MaybeArray<DefineTagOptions>): MaybeArray<TagDef> {
  if (Array.isArray(opts)) {
    return opts.map((v) => defineTags(v));
  }

  const def: TagDef = {
    title: startCase(opts.name),
    metadata: [],
    ...opts,
  };

  _tags.push(def);

  return def;
}

export function getEntryTags() {
  return _tags;
}
