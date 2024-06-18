import { InputType, ObjectType } from 'type-graphql';
import { RelayMutationPayload } from '../relay';

@InputType()
export class ResourceUpdateInput {}

@InputType()
export class ResourceCreateInput {}

@ObjectType()
export class CreateResourcePayload extends RelayMutationPayload {}

@ObjectType()
export class UpdateResourcePayload extends RelayMutationPayload {}

@ObjectType()
export class DeleteResourcePayload extends RelayMutationPayload {}

@ObjectType()
export class MutationResourcePayload extends RelayMutationPayload {}
