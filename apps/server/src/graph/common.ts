import { RelayMutationInput, RelayMutationPayload } from '@wener/server/type-graphql';
import { ArgsType, Field, ID, InputType, ObjectType } from 'type-graphql';

@ArgsType()
export class ResolveArgs {
	@Field((_type) => ID, { nullable: true })
	id?: string;
	@Field((_type) => String, { nullable: true })
	uid?: string;
	@Field((_type) => Number, { nullable: true })
	sid?: number;
	@Field((_type) => String, { nullable: true })
	eid?: string;
	@Field((_type) => String, { nullable: true })
	cid?: string;
	@Field((_type) => String, { nullable: true })
	rid?: string;
	@Field((_type) => Boolean, { nullable: true })
	deleted?: boolean;
}

@ArgsType()
export class GetArgs {
	@Field((_type) => ID, { nullable: true })
	id!: string;
}

@ArgsType()
export class DeleteArgs {
	@Field((_type) => ID, { nullable: true })
	id!: string;
}

@InputType()
export class DeleteEntityInput extends RelayMutationInput {
	@Field((_type) => ID, { nullable: false })
	id!: string;
}

@ObjectType()
export class DeleteEntityPayload extends RelayMutationPayload {}
