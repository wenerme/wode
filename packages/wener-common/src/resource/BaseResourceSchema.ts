import { AnyResourceSchema } from './AnyResourceSchema';

export const BaseResourceSchema = AnyResourceSchema.pick({
	id: true,
	uid: true,
	tid: true,
	eid: true,

	state: true,
	status: true,
	statusReason: true,
	statusUpdatedAt: true,
	statusUpdatedById: true,

	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	createdById: true,
	updatedById: true,
	deletedById: true,
	attributes: true,
	properties: true,
}).required({
	uid: true,
	tid: true,
	state: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	attributes: true,
	properties: true,
});
