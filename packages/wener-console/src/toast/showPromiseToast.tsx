import type { ReactElement } from 'react';
import toast, { type DefaultToastOptions } from 'react-hot-toast';
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
};

export async function showPromiseToast<T, S extends boolean = false>(
	promise: Promise<T>,
	opts?: Omit<ShowPromiseToastOptions<T>, 'promise'> & { swallow?: S },
	def?: DefaultToastOptions,
): Promise<S extends true ? T | undefined : T>;
export async function showPromiseToast<T, S extends boolean = false>(
	opts: ShowPromiseToastOptions<T> & { swallow?: S },
	def?: DefaultToastOptions,
): Promise<S extends true ? T | undefined : T>;
export async function showPromiseToast<T, S extends boolean>(
	a: any,
	b?: any,
	c?: any,
): Promise<S extends true ? T | undefined : T> {
	let promise: Promise<T>;
	let opts: ShowPromiseToastOptions<T> & {
		swallow?: S;
	};
	let def: DefaultToastOptions;
	if ('then' in a) {
		promise = a;
		opts = b;
		def = c;
	} else {
		promise = a.promise;
		opts = a;
		def = b;
	}
	opts ||= {
		promise,
	};
	def ||= {};

	const {
		delay = 0,
		swallow,
		action = '操作',
		loading = () => `${action}中...`,
		success = (v: T) => `${action}成功`,
		error = (err: any) => `${action}失败: ${resolveErrorMessage(err)}`,
	} = opts;

	let toastId;
	try {
		let done = false;
		// avoid await twice for Thenable
		const p = Promise.resolve(promise);
		await Promise.race([
			Promises.sleep(delay).then(() => {
				if (done) return;
				let content = maybeFunction(loading);
				if (content) {
					toastId = toast.loading(content, {
						...def,
						...def.loading,
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
				...def,
				...def.success,
			});
		} else {
			toast.dismiss(toastId);
		}
		return out;
	} catch (e) {
		console.log(`ERROR ${classOf(e)}`, e);

		let message = maybeFunction(error, e);
		if (message) {
			toast.error(message, {
				id: toastId,
				...def,
				...def.error,
			});
		} else {
			toast.dismiss(toastId);
		}
		if (swallow === true) {
			return undefined as S extends true ? T | undefined : T;
		}
		throw e;
	}
}
