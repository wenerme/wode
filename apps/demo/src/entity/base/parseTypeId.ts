import { isULID, isUUID } from '@wener/utils';

export function parseTypeId(typeId: string): [string | undefined, string] {
  const tag = typeId.split('_', 1).at(0);
  if (tag) {
    let key = typeId.slice(tag.length + 1);
    return [tag, key];
  }

  return [undefined, typeId];
}

export function isTypeId(s?: string): s is string {
  if (!s) {
    return false;
  }
  const [type, id] = parseTypeId(s);
  return !!(type && (isULID(id) || isUUID(id)));
}
