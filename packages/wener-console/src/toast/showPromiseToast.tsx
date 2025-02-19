import type { ReactElement } from 'react';
import { toast, type DefaultToastOptions } from 'react-hot-toast';
import { classOf, maybeFunction, Promises, type MaybeFunction } from '@wener/utils';
import { resolveErrorMessage } from './resolveErrorMessage';

type Renderable = ReactElement | string | null;

export type ShowPromiseToastOptions<T> = {
	promise: Promise<T>;
	delay?: number;
	action?: string;
	swallow?: boolean; // swallow error
	loading?: MaybeFunction<Renderable>;
	success?: MaybeFunction<Renderable, [T]>;
	error?: MaybeFunction<Renderable, [any]>;
	options?: DefaultToastOptions;
};

export async function showPromiseToast<T, S extends boolean>({
	promise,
	delay = 0,
	swallow,
	action = '操作',
	loading = () => `${action}中...`,
	success = (v: T) => `${action}成功`,
	error = (err: any) => `${action}失败: ${resolveErrorMessage(err)}`,
	options: opts = {},
}: ShowPromiseToastOptions<T> & {
	swallow?: S;
}): Promise<S extends true ? T | undefined : T> {
	let toastId;
	try {
		let done = false;
		// avoid await twice for Thenable
		const p = Promise.resolve(promise);
		await Promise.race([
			Promises.sleep(delay).then(() => {
				if (done) return;
				let content = maybeFunction(loading);
				if (!content) {
					toastId = toast.loading(loading, {
						...opts,
						...opts.loading,
					});
				}
			}),
			p,
		]);
		const out = await p;
		done = true;
		let message = maybeFunction(success, out);
		if (message) {
			toast.success(message, {
				id: toastId,
				...opts,
				...opts.success,
			});
		} else {
			toast.dismiss(toastId);
		}
		return out;
	} catch (e) {
		console.log(`ERROR ${classOf(error)}`, error);

		let message = maybeFunction(error, e);
		if (message) {
			toast.error(message, {
				id: toastId,
				...opts,
				...opts.error,
			});
		} else {
			toast.dismiss(toastId);
		}
		if (swallow === true) {
			// @ts-ignore
			return undefined;
		}
		throw e;
	}
}
