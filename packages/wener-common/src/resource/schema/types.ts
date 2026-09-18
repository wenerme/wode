import { DisplayNameSchema } from './DisplayNameSchema';
import { JsonDateSchema } from './JsonDateSchema';
import { JsonDateTimeSchema } from './JsonDateTimeSchema';
import { LoginNameSchema } from './LoginNameSchema';
import { PasswordSchema } from './PasswordSchema';
import { PhoneNumberSchema } from './PhoneNumberSchema';
import { ResourceIdSchema } from './ResourceIdSchema';
import { resourceIdSchemaOf } from './resourceIdSchemaOf';

export const rz = {
	resourceIdOf: resourceIdSchemaOf,
	date: JsonDateSchema,
	dateTime: JsonDateTimeSchema,
	resourceId: ResourceIdSchema,
	phoneNumber: PhoneNumberSchema,
	loginName: LoginNameSchema,
	password: PasswordSchema,
	friendlyName: DisplayNameSchema,
} as const;
