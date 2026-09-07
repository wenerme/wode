import { ResourceIdSchema } from './ResourceIdSchema';
import { PhoneNumberSchema } from './PhoneNumberSchema';
import { resourceIdSchemaOf } from './resourceIdSchemaOf';
import { DisplayNameSchema } from './DisplayNameSchema';
import { PasswordSchema } from './PasswordSchema';
import { JsonDateTimeSchema } from './JsonDateTimeSchema';
import { JsonDateSchema } from './JsonDateSchema';
import { LoginNameSchema } from './LoginNameSchema';

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
