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
  let attache = (data: O) => {
    if (typeof data === 'object' && data) {
      (data as any)['clientMutationId'] = clientMutationId;
    } else if (data === undefined) {
      (data as any) = { clientMutationId };
    }
    return data;
  };
  if ('then' in out) {
    return out.then((data) => attache(data));
  }
  return attache(out);
}
