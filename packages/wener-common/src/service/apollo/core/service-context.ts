import type { z } from 'zod/v4';
import type { ApolloConnectionConfig } from './config';
import type { ApolloHttpRequest } from './interface';

export type ApolloMutationOutcome = {
	readonly state: string;
	readonly message: string;
};

export type ApolloServiceParse = <TSchema extends z.ZodType>(schema: TSchema, input: unknown) => z.output<TSchema>;

export interface ApolloServiceOperationContext {
	readonly config: ApolloConnectionConfig;
	readonly parse: ApolloServiceParse;
	readonly admin: (path: string, input?: Omit<ApolloHttpRequest, 'role' | 'path'>) => Promise<unknown>;
	readonly adminMutation: (
		path: string,
		input: Omit<ApolloHttpRequest, 'role' | 'path'>,
		outcome: ApolloMutationOutcome,
	) => Promise<unknown>;
	readonly portal: (path: string, query?: Record<string, unknown>) => Promise<unknown>;
	readonly portalMutation: (
		path: string,
		input: Omit<ApolloHttpRequest, 'role' | 'path'>,
		outcome: ApolloMutationOutcome,
	) => Promise<unknown>;
	readonly assertWritable: () => void;
}
