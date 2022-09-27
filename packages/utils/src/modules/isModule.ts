export function isModule(o: any) {
  return o && o[Symbol.toStringTag] === 'Module';
}
