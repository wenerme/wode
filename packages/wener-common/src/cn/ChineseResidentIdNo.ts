import { z } from 'zod/v4';
import { SexType, SexTypeSchema } from '../foundation/schema';
import { Mod11 } from './Mod11';

export const ChineseResidentIdNoRegex =
	/^(?<division>[1-9]\d{5})(?<year>(18|19|20)\d{2})(?<month>0[1-9]|1[0-2])(?<day>0[1-9]|[12]\d|3[01])(?<sequence>\d{3})(?<checkDigit>[0-9Xx])$/;

export type ParsedChineseResidentIdNo = z.infer<typeof ParsedChineseResidentIdNoSchema>;
export const ParsedChineseResidentIdNoSchema = z
	.object({
		raw: z.string().regex(ChineseResidentIdNoRegex, '无效的18位身份证号码格式').describe('身份证号码'),
		addressCode: z.string().length(6).describe('地址码 '),
		birthDate: z.iso.date().describe('出生日期'),
		sequence: z.int().max(999).min(0).describe('顺序码'),
		checkDigit: z.int().min(0).max(10).describe('校验码'),
		sex: SexTypeSchema.describe('性别'),
		age: z.number().optional(),
		valid: z.boolean().optional().describe('是否有效'),
	})
	.describe('居民身份证号码解析内容');

export function parseChineseResidentIdNo(idNo: string): ParsedChineseResidentIdNo | undefined {
	const reg = ChineseResidentIdNoRegex;
	const match = idNo.match(reg);
	if (!match || !match.groups) {
		return undefined;
	}
	const { division, year, month, day, sequence, checkDigit } = match.groups;
	let seq = parseInt(sequence, 10);
	return {
		raw: idNo,
		addressCode: division,
		birthDate: `${year}-${month}-${day}`,
		sequence: seq,
		checkDigit: checkDigit.toUpperCase() === 'X' ? 10 : parseInt(checkDigit),
		sex: seq % 2 === 0 ? SexType.Male : SexType.Female,
		age: new Date().getFullYear() - parseInt(year, 10),
		valid: Mod11.validate(idNo),
	};
}

export function formatChineseResidentIdNo({
	addressCode,
	birthDate,
	sequence,
	checkDigit,
}: {
	addressCode: string;
	birthDate: string | Date;
	sequence: number | string;
	checkDigit?: string | number;
}): string {
	const date =
		typeof birthDate === 'string'
			? birthDate.replace(/-/g, '')
			: `${birthDate.getFullYear()}${String(birthDate.getMonth() + 1).padStart(2, '0')}${String(birthDate.getDate()).padStart(2, '0')}`;
	const seq = String(sequence).padStart(3, '0');
	const major = `${addressCode}${date}${seq}`;
	const check =
		typeof checkDigit === 'number'
			? checkDigit === 10
				? 'X'
				: String(checkDigit)
			: checkDigit?.toUpperCase() || Mod11.compute(major);
	return `${major}${check}`;
}

export namespace ChineseResidentIdNo {
	export const regex = ChineseResidentIdNoRegex;
	export const parse = parseChineseResidentIdNo;
	export const format = formatChineseResidentIdNo;
	export type Result = ParsedChineseResidentIdNo;
	export const ResultSchema = ParsedChineseResidentIdNoSchema;
}
