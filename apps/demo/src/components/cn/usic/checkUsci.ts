import { mod31, Mod31Numbers } from './mod31';

export function checkUsci(s: string) {
  return Mod31Numbers[s[17]] === mod31(s.slice(0, 17));
}
