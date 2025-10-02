import { z } from 'zod/v4';
import { Mod31 } from './Mod31';

interface CodeValue {
	name: string;
	children?: Record<string, CodeValue>;
}

const CodeNames: Record<string, CodeValue> = {
	1: {
		name: '机构编制',
		children: {
			1: { name: '机关' },
			2: { name: '事业单位' },
			3: { name: '中央编办直接管理机构编制的群众团体' },
			9: { name: '其他' },
		},
	},
	5: {
		name: '民政',
		children: {
			1: { name: '社会团体' },
			2: { name: '民办非企业单位' },
			3: { name: '基金会' },
			9: { name: '其他' },
		},
	},
	9: {
		name: '工商',
		children: {
			1: { name: '企业' },
			2: { name: '个体工商户' },
			3: { name: '农民专业合作社' },
			9: { name: '其他' },
		},
	},
	Y: { name: '其他', children: { 1: { name: '其他' } } },
};

export type ParsedUnifiedSocialCreditCode = z.infer<typeof ParsedUnifiedSocialCreditCodeSchema>;
export const ParsedUnifiedSocialCreditCodeSchema = z
	.object({
		raw: z.string().length(18).describe('统一社会信用代码'),
		registrationAuthorityCode: z.string().length(1).describe('登记管理部门代码'),
		entityCategoryCode: z.string().length(1).describe('机构类别代码'),
		adminDivisionCode: z.string().length(6).describe('登记管理机关行政区划码 '),
		organizationCode: z.string().length(9).describe('主体标识码/组织机构代码'),
		checkDigit: z.string().length(1).describe('校验码'),

		codes: z.string().array().describe('代码数组'),
		names: z.string().array().describe('代码名称'),
		valid: z.boolean().optional().describe('是否有效'),
	})
	.describe('统一社会信用代码');

export const UnifiedSocialCreditCodeRegex = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/;

export function parseUnifiedSocialCreditCode(s: string): ParsedUnifiedSocialCreditCode | undefined {
	if (!s || s.length !== 18) return undefined;

	const registrationAuthorityCode = s[0];
	const entityCategoryCode = s[1];
	const adminDivisionCode = s.slice(2, 8);
	const organizationCode = s.slice(8, 17);
	const checkDigit = s[17];

	const codes = [registrationAuthorityCode, entityCategoryCode, adminDivisionCode, organizationCode, checkDigit];
	const names: string[] = [];

	const bureau = CodeNames[registrationAuthorityCode];
	if (bureau) {
		names.push(bureau.name);
		const subject = bureau.children?.[entityCategoryCode];
		if (subject) {
			names.push(subject.name);
		}
	}

	return {
		raw: s,
		registrationAuthorityCode,
		entityCategoryCode,
		adminDivisionCode,
		organizationCode,
		checkDigit,
		codes,
		names,
		valid: UnifiedSocialCreditCodeRegex.test(s) && Mod31.validate(s),
	};
}

export function formatUnifiedSocialCreditCode({
	registrationAuthorityCode,
	entityCategoryCode,
	adminDivisionCode,
	organizationCode,
	checkDigit,
}: {
	registrationAuthorityCode: string;
	entityCategoryCode: string;
	adminDivisionCode: string;
	organizationCode: string;
	checkDigit?: string;
}): string {
	const base = `${registrationAuthorityCode}${entityCategoryCode}${adminDivisionCode}${organizationCode}`;
	checkDigit ||= Mod31.compute(base);
	return `${base}${checkDigit}`;
}

export function next(s: string, delta: number = 1) {
	const sp = s.split('').map((v) => Mod31.numbers[v]);
	for (let i = sp.length - 1; i >= 0; i--) {
		if ((delta > 0 && sp[i] < 30) || (delta < 0 && sp[i] > 0)) {
			sp[i] += delta;
			break;
		} else if (delta > 0 && sp[i] === 30) {
			sp[i] = 0;
		} else if (delta < 0 && sp[i] === 0) {
			sp[i] = 30;
		}
	}
	return sp.map((v) => Mod31.chars[v]).join('');
}

export namespace UnifiedSocialCreditCode {
	export const regex = UnifiedSocialCreditCodeRegex;
	export const parse = parseUnifiedSocialCreditCode;
	export const format = formatUnifiedSocialCreditCode;
	export type Result = ParsedUnifiedSocialCreditCode;
	export const ResultSchema = ParsedUnifiedSocialCreditCodeSchema;
}
