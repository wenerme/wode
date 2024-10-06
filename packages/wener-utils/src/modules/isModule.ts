/**
 * Check is ESM Module
 */
export function isModule(o: any): o is Module {
  return o && o[Symbol.toStringTag] === 'Module';
}

export interface Module {
  [Symbol.toStringTag]: 'Module';
  default?: any;

  [k: string | symbol]: any;
}
