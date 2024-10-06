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
      if (isCombinedError(error)) {
        return error.response.errors.map((v: any) => v.message).join(';');
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

function isCombinedError(error: any): error is CombinedError {
  return Array.isArray(error.graphQLErrors) && error instanceof Error;
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
// urql CombinedError
interface CombinedError extends Error {
  name: string;
  message: string;
  graphQLErrors: GraphQLError[];
  networkError?: Error;
  response?: any;
}

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
