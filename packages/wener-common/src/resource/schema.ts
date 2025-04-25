import { isValid } from 'date-fns';
import dayjs from 'dayjs';
import { z } from 'zod';

const TypeIdSchema = z
	.string()
	.regex(/^[a-zA-Z0-9]+_[a-zA-Z0-9]+$/, {
		error: 'ID格式错误',
	})
	.describe('ID');

/*
XXX-XXX-XXXX
National: (XXX) XXX-XXXX
Human: XXX.XXX.XXXX xXXX
International: +XX (XXX) XXX-XXXX

中国
XXX XXXX XXXX
XXX-XXXX-XXXX
XXXXXXXXXXX
+86 XXX XXXX XXXX
+86 XXXXXXXXXXX

0XX-XXXXXXXX
0XXX-XXXXXXXX
(0XX) XXXXXXXX
0XX XXXX XXXX
0XXXXXXXX

https://uibakery.io/regex-library/phone-number
https://fakerjs.dev/api/phone
 */

const PhoneNumberSchema = z
	.string()
	.trim()
	.max(20)
	.regex(/(^$)|(^[0-9]*$)/, {
		error: '电话号码只能包含数字',
	})
	.meta({
		format: 'phone',
	});

function resourceIdOf(entity: string) {
	return rz.resourceId.meta({ 'x-ref-entity': entity });
}

// allow empty string
const JsonDateSchema = z.coerce
	.string()
	.trim()
	.overwrite((v) => {
		if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
			let val = dayjs(v);
			if (val.isValid()) {
				return val.format('YYYY-MM-DD');
			}
		}
		return v;
	})
	.regex(/(^$)|(^\d{4}-\d{2}-\d{2}$)/, { error: '错误的日期格式' })
	.refine((value) => !value || isValid(new Date(value)), {
		error: '错误的日期',
	})
	.nullish()
	.overwrite((v) => v || undefined)
	.meta({ format: 'date' });

const JsonDateTimeSchema = z.coerce.date().meta({ format: 'date-time', type: 'string' });

const LoginNameSchema = z
	.string()
	.trim()
	.regex(/^[a-z0-9]{3,16}$/, { error: '登录名只能包含小写字母和数字，长度为3-16位' });

// maybe check valid cjk
const FriendlyNameSchema = z
	.string()
	.trim()
	.max(50)
	.refine((v) => !/\p{C}/u.test(v), { message: '包含无效字符' })
	.describe('名称');

const PasswordSchema = z
	.string()
	.min(6, { error: '密码长度至少 6 位' })
	.max(36, { error: '密码长度最多 36 位' })
	.regex(/^\S*$/, { error: '密码不能包含空格' })
	.describe('密码')
	.meta({ sensitive: true });

export const rz = {
	resourceIdOf: resourceIdOf,
	date: JsonDateSchema,
	dateTime: JsonDateTimeSchema,
	resourceId: TypeIdSchema,
	phoneNumber: PhoneNumberSchema,
	loginName: LoginNameSchema,
	password: PasswordSchema,
	friendlyName: FriendlyNameSchema,
} as const;

export type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];

export const SexType = Object.freeze({
	__proto__: null,
	Male: 'Male',
	Female: 'Female',
	// Intersex
} as const);
export type SexType = EnumValues<typeof SexType>;
export const SexTypeSchema = z
	.union([z.literal(SexType.Male).describe('男'), z.literal(SexType.Female).describe('女')])
	.describe('性别');

//endregion
