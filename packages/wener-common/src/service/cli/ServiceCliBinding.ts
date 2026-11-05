import type { CliExample, CliOption } from '../../cli/CliCommand';
import type { ServiceRuntimeClient } from '../runtime/types';
import type { ServiceCliDefinition, ServiceCliOperation } from './ServiceCliDefinition';

export interface ServiceCliClientOptions {
	readOnly: boolean;
	signal?: AbortSignal;
}

export type ServiceCliClientFactory<S> = (
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCliClientOptions,
) => Promise<S>;

/** A provider's static identity, without its factory, schema or configuration. */
export interface ServiceCliProviderMetadata {
	name: string;
	aliases?: readonly string[];
	provides: readonly string[];
}

export type ServiceCliOperationMetadata = Omit<ServiceCliOperation<never>, 'prepare' | 'table'>;
export type ServiceCliDefinitionMetadata = Omit<ServiceCliDefinition<never>, 'commands'> & {
	commands: readonly ServiceCliOperationMetadata[];
};

export interface ServiceCliBindingMetadata {
	definition: ServiceCliDefinitionMetadata;
	provider: ServiceCliProviderMetadata;
}

/** The visitor keeps each definition paired with the client type captured by its binding. */
export type ServiceCliRegistrar<T> = <S>(
	definition: ServiceCliDefinition<S>,
	provider: string,
	createClient?: ServiceCliClientFactory<S>,
) => T;

export interface ServiceCliBinding {
	readonly metadata: ServiceCliBindingMetadata;
	register<T>(registrar: ServiceCliRegistrar<T>): T;
}

/** Defining or describing a binding never resolves configuration or creates a client. */
export function defineServiceCliBinding<S>(input: {
	provider: ServiceCliProviderMetadata;
	definition: ServiceCliDefinition<S>;
	createClient?: ServiceCliClientFactory<NoInfer<S>>;
}): ServiceCliBinding {
	const { createClient } = input;
	const description = describeDefinition(input.definition);
	const definition: ServiceCliDefinition<S> = Object.freeze({
		...description,
		commands: Object.freeze(input.definition.commands.map((operation, index) => Object.freeze({
			...description.commands[index]!,
			prepare: operation.prepare,
			...(operation.table ? { table: operation.table } : {}),
		}))),
	});
	const provider = Object.freeze({
		name: input.provider.name,
		aliases: Object.freeze([...(input.provider.aliases ?? [])]),
		provides: Object.freeze([...input.provider.provides]),
	});
	const metadata = Object.freeze({ provider, definition: description });
	return Object.freeze({
		metadata,
		register<T>(registrar: ServiceCliRegistrar<T>): T {
			return registrar(definition, provider.name, createClient);
		},
	});
}

function describeDefinition<S>(definition: ServiceCliDefinition<S>): ServiceCliDefinitionMetadata {
	return Object.freeze({
		name: definition.name,
		description: definition.description,
		...(definition.aliases ? { aliases: Object.freeze([...definition.aliases]) } : {}),
		...(definition.examples ? { examples: snapshotExamples(definition.examples) } : {}),
		...(definition.options ? { options: snapshotOptions(definition.options) } : {}),
		...(definition.helpText !== undefined ? { helpText: definition.helpText } : {}),
		commands: Object.freeze(
			definition.commands.map((operation) =>
				Object.freeze({
					name: operation.name,
					description: operation.description,
					...(operation.group !== undefined ? { group: operation.group } : {}),
					...(operation.variadic !== undefined ? { variadic: operation.variadic } : {}),
					...(operation.mutating !== undefined ? { mutating: operation.mutating } : {}),
					...(operation.aliases ? { aliases: Object.freeze([...operation.aliases]) } : {}),
					...(operation.examples ? { examples: snapshotExamples(operation.examples) } : {}),
					...(operation.argument !== undefined ? { argument: operation.argument } : {}),
					...(operation.arguments !== undefined ? { arguments: operation.arguments } : {}),
					...(operation.options ? { options: snapshotOptions(operation.options) } : {}),
				}),
			),
		),
	});
}

function snapshotExamples(examples: readonly CliExample[]): readonly CliExample[] {
	return Object.freeze(
		examples.map((example) =>
			Object.freeze({
				command: example.command,
				...(example.description !== undefined ? { description: example.description } : {}),
			}),
		),
	);
}

function snapshotOptions(options: readonly CliOption[]): readonly CliOption[] {
	return Object.freeze(
		options.map((option) =>
			Object.freeze({
				name: option.name,
				description: option.description,
				...(option.aliases ? { aliases: Object.freeze([...option.aliases]) } : {}),
				...(option.type !== undefined ? { type: option.type } : {}),
				...(option.helpScope !== undefined ? { helpScope: option.helpScope } : {}),
				...(option.repeatable !== undefined ? { repeatable: option.repeatable } : {}),
				...(option.variadic !== undefined ? { variadic: option.variadic } : {}),
				...(option.default !== undefined ? { default: option.default } : {}),
				...(option.negatable !== undefined ? { negatable: option.negatable } : {}),
			}),
		),
	);
}
