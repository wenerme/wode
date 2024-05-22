import { isULID, isUUID } from '@wener/utils';

export function parseEntityTypeId(id: string): [string | undefined, string] {
  const tag = id.split('_', 1).at(0);
  if (tag) {
    return [tag, id.slice(tag.length + 1)];
  }

  return [undefined, id];
}

export function isEntityTypeId(s?: string): s is string {
  if (!s) {
    return false;
  }
  const [type, id] = parseEntityTypeId(s);
  return !!(type && (isULID(id) || isUUID(id)));
}

export function getTypeOfEntityTypeId(id: string | undefined | null) {
  if (!id) return undefined;
  return parseEntityTypeId(id)[0];
}
