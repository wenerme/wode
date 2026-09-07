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

import { z } from 'zod';

export const PhoneNumberSchema = z
	.string()
	.trim()
	.max(20)
	.regex(/(^$)|(^[0-9]*$)/, {
		error: '电话号码只能包含数字',
	})
	.meta({
		format: 'phone',
	});
