import { getHttpStatusText } from '@wener/utils';

export function resolveErrorMessage(error: Error | any) {
  if (!error) {
    return;
  }

  if (error instanceof Error) {
    try {
      if (isZodError(error)) {
        return error.issues.map((v) => `${v.path.join('.')}: ${v.message}`).join(';');
      }
      if (isTypeBoxError(error)) {
        const { path, type, message } = error.error;
        return `${path}: ${message} (${type})`;
      }
      if (URQLError.is(error)) {
        return error.response.errors.map((v: any) => v.message).join(';');
      }
      if (GraphQLClientError.is(error)) {
        if (!error.response.errors) {
          let status = error.response.status;
          let text = getHttpStatusText(status);
          return `${status} ${text}`;
        }
      }

      if (typeof error === 'object' && 'message' in error) {
        return error.message;
      }
    } catch (e) {
      console.error('resolveErrorMessage', e);
    }
  }
  return String(error);
}

namespace GraphQLClientError {
  interface GraphQLResponse<T = unknown> {
    data?: T;
    errors?: GraphQLError[];
    extensions?: unknown;
    status: number;
    headers?: Headers;

    [key: string]: unknown;
  }

  interface GraphQLRequestContext<V extends {} = {}> {
    query: string | string[];
    variables?: V;
  }

  type ClientError = Error & {
    response: GraphQLResponse;
    request: GraphQLRequestContext;
  };

  // graphql-client _ClientError
  // https://github.com/graffle-js/graffle/blob/graphql-request/src/legacy/classes/ClientError.ts
  export function is(error: any): error is ClientError {
    return (
      typeof error.response === 'object' &&
      typeof error.request === 'object' &&
      typeof error.response.status === 'number' &&
      typeof error.request.query === 'string'
    );
  }
}

function isTypeBoxError(error: any): error is TransformDecodeCheckError {
  return error.error?.path && error.error.type && error.error.message && error instanceof Error;
}

interface TransformDecodeCheckError extends Error {
  error: {
    path: string;
    type: string;
    message: string;
  };
}

function isZodError(error: any): error is ZodError {
  return error instanceof Error && Array.isArray((error as any).issues);
}

interface ZodIssue {
  fatal?: boolean;
  code: any;
  path: (string | number)[];
  message: string;
}

interface ZodError {
  issues: ZodIssue[];

  get errors(): ZodIssue[];

  get message(): string;

  get isEmpty(): boolean;
}

// https://commerce.nearform.com/open-source/urql/docs/basics/errors/
// https://github.com/urql-graphql/urql/blob/main/packages/core/src/utils/error.ts
// urql CombinedError
namespace URQLError {
  // import { GraphQLError } from '@0no-co/graphql.web';

  /** An abstracted `Error` that provides either a `networkError` or `graphQLErrors`.
   *
   * @remarks
   * During a GraphQL request, either the request can fail entirely, causing a network error,
   * or the GraphQL execution or fields can fail, which will cause an {@link ExecutionResult}
   * to contain an array of GraphQL errors.
   *
   * The `CombinedError` abstracts and normalizes both failure cases. When {@link OperationResult.error}
   * is set to this error, the `CombinedError` abstracts all errors, making it easier to handle only
   * a subset of error cases.
   *
   * @see {@link https://urql.dev/goto/docs/basics/errors} for more information on handling
   * GraphQL errors and the `CombinedError`.
   */
  export interface CombinedError extends Error {
    name: string;
    message: string;

    /** A list of GraphQL errors rehydrated from a {@link ExecutionResult}.
     *
     * @remarks
     * If an {@link ExecutionResult} received from the API contains a list of errors,
     * the `CombinedError` will rehydrate them, normalize them to
     * {@link GraphQLError | GraphQLErrors} and list them here.
     * An empty list indicates that no GraphQL error has been sent by the API.
     */
    graphQLErrors: GraphQLError[];

    /** Set to an error, if a GraphQL request has failed outright.
     *
     * @remarks
     * A GraphQL over HTTP request may fail and not reach the API. Any error that
     * prevents a GraphQl request outright, will be considered a “network error” and
     * set here.
     */
    networkError?: Error;

    /** Set to the {@link Response} object a fetch exchange received.
     *
     * @remarks
     * If a built-in fetch {@link Exchange} is used in `urql`, this may
     * be set to the {@link Response} object of the Fetch API response.
     * However, since `urql` doesn’t assume that all users will use HTTP
     * as the only or exclusive transport for GraphQL this property is
     * neither typed nor guaranteed and may be re-used for other purposes
     * by non-fetch exchanges.
     *
     * Hint: It can be useful to use `response.status` here, however, if
     * you plan on relying on this being a {@link Response} in your app,
     * which it is by default, then make sure you add some extra checks
     * before blindly assuming so!
     */
    response?: any;
  }

  export function is(error: any): error is CombinedError {
    return Array.isArray(error?.graphQLErrors) && error.name === 'CombinedError' && error instanceof Error;
  }
}

interface CombinedError extends Error {
  name: string;
  message: string;
  graphQLErrors: GraphQLError[];
  networkError?: Error;
  response?: any;
}

// import type { GraphQLError } from 'graphql'

interface GraphQLError extends Error {
  readonly locations: ReadonlyArray<any> | undefined;
  readonly path: ReadonlyArray<string | number> | undefined;
  readonly nodes: ReadonlyArray<any> | undefined;
  readonly source:
    | {
        body: string;
        name: string;
        locationOffset: {
          line: number;
          column: number;
        };
      }
    | undefined;
  readonly positions: ReadonlyArray<number> | undefined;
  readonly originalError: Error | undefined;
  readonly extensions: Record<string, any>;
}
