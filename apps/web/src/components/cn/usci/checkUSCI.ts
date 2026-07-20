import { Mod31Numbers, mod31 } from './mod31';

export function checkUSCI(s: string) {
	return Mod31Numbers[s[17]] === mod31(s.slice(0, 17));
}
