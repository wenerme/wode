import { SexType } from './SexType';

export function parseSex(s: string | null | undefined): undefined | SexType {
	if (!s) return undefined;

	switch (s.toLowerCase()) {
		case '♂':
		case '男':
		case 'male':
			return SexType.Male;
		case '♀':
		case '女':
		case 'female':
			return SexType.Female;
	}
	return undefined;
}
