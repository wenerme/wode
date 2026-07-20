import type { AnyVariables, OperationResult, OperationResultSource } from '@urql/core';
import { resolveErrorMessage, type ShowPromiseToastOptions, showPromiseToast } from '../toast';

type PartialRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export async function showUrqlOperation<Data = any, Variables extends AnyVariables = AnyVariables>(
	r: OperationResultSource<OperationResult<Data, Variables>>,
	opts: Omit<ShowPromiseToastOptions<OperationResult<Data, Variables>>, 'promise'> = {},
): Promise<PartialRequired<OperationResult<Data, Variables>, 'data'>> {
	type Out = PartialRequired<OperationResult<Data, Variables>, 'data'>;
	const promise = r.toPromise().then(async (v) => {
		if (v.error) {
			throw v.error;
		}
		return v;
	});
	const out = await showPromiseToast<OperationResult<Data, Variables>>({
		promise,
		delay: 300,
		success: () => null,
		error: (data: any) => resolveErrorMessage(data.error),
		...opts,
		swallow: false,
	});
	return out as Out;
}
