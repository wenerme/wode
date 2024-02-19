export function parseTypeTag(id: string) {
  const tag = id.split('_', 1).at(0);
  if (tag) {
    return [tag, id.slice(tag.length + 1)];
  }

  return [undefined, id];
}
