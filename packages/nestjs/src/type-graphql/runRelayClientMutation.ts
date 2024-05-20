import { MaybePromise } from '@wener/utils';

export function runRelayClientMutation<
  I extends {
    clientMutationId?: string;
  },
  O extends object,
>(input: I | undefined = {} as I, f: (input: I) => MaybePromise<O>) {
  let clientMutationId = input.clientMutationId;
  if (!clientMutationId) {
    return f(input);
  }
  // fixme dedup
  let out = f(input);
  if ('then' in out) {
    return out.then((data) => ({ ...data, clientMutationId: clientMutationId }));
  }
  return { ...out, clientMutationId: clientMutationId };
}
