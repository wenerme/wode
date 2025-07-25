import { SexType } from './SexType';

export function parseSexType(s: string | null | undefined): undefined | SexType {
	if (!s) return undefined;

	switch (s.toLowerCase()) {
		case '♂':
		case '男':
		case 'male':
		case 'man':
			return SexType.Male;
		case '♀':
		case '女':
		case 'female':
		case 'woman':
			return SexType.Female;
	}
	return undefined;
}
