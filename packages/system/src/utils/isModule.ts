import type { Module } from './getGlobalSystem';

export function isModule(o: any): o is Module {
  return o && o[Symbol.toStringTag] === 'Module';
}
