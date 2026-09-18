import { ResourceIdSchema } from './ResourceIdSchema';

export function resourceIdSchemaOf(entity: string) {
	return ResourceIdSchema.meta({ 'x-ref-entity': entity });
}
