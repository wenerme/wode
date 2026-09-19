import { type Constructor } from '@wener/utils';
import { RelayMutationInput } from '@wener/server/type-graphql';
import { Field, InputType as GraphQLInputType, ObjectType } from 'type-graphql';

type ImportConflict = {
	fields?: string[];
	action?: string;
	merge?: string[];
	exclude?: string[];
};

export type ImportInput<T> = {
	clientMutationId?: string;
	base?: T;
	values?: T[];
	onConflict?: ImportConflict;
};

@GraphQLInputType()
class ImportConflictInput implements ImportConflict {
	@Field(() => [String], { nullable: true })
	fields?: string[];

	@Field(() => String, { nullable: true })
	action?: string;

	@Field(() => [String], { nullable: true })
	merge?: string[];

	@Field(() => [String], { nullable: true })
	exclude?: string[];
}

export function createImportInput<T>({ InputType }: { InputType: Constructor<T> }): Constructor<ImportInput<T>> {
	@GraphQLInputType()
	class ImportInputType extends RelayMutationInput implements ImportInput<T> {
		@Field(() => InputType, { nullable: true })
		base?: T;

		@Field(() => [InputType], { nullable: true })
		values?: T[];

		@Field(() => ImportConflictInput, { nullable: true })
		onConflict?: ImportConflictInput;
	}

	return ImportInputType;
}

export function createImportPayload<T>(objectType: Constructor<T>): Constructor<{ data: T[] }> {
	@ObjectType()
	class ImportPayload {
		@Field(() => [objectType])
		data!: T[];
	}

	return ImportPayload;
}
