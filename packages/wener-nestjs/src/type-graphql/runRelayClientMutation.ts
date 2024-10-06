import { isPromise, type MaybePromise } from '@wener/utils';

export function runRelayClientMutation<
  I extends {
    clientMutationId?: string;
  },
  O extends object,
>(
  input: I | undefined = {} as I,
  f: (input: I) => MaybePromise<O>,
): MaybePromise<
  O & {
    clientMutationId?: string;
  }
> {
  // 不需要去重、客户端没有传递不需要生成
  const clientMutationId = input.clientMutationId;
  if (!clientMutationId) {
    return f(input);
  }
  const out = f(input);
  const attach = (data: O) => {
    if (typeof data === 'object' && data) {
      (data as any)['clientMutationId'] = clientMutationId;
    } else if (data === undefined) {
      (data as any) = { clientMutationId };
    }
    return data;
  };
  if (isPromise(out)) {
    return out.then((data) => attach(data));
  }
  return attach(out);
}
