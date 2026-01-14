import type { ReactElement } from 'react';
import toast, { type DefaultToastOptions } from 'react-hot-toast';
import { HiXMark } from 'react-icons/hi2';
import { classOf, maybeFunction, Promises, type MaybeFunction } from '@wener/utils';
import { resolveErrorMessage } from './resolveErrorMessage';

type Renderable = ReactElement | string | null;

export interface PromiseContext {
	signal: AbortSignal;
	abort: (reason?: any) => void;
	setMessage: (message: Renderable) => void;
}

export type PromiseFactory<T> = (ctx: PromiseContext) => Promise<T>;

export type ShowPromiseToastOptions<T> = {
	promise: Promise<T> | PromiseFactory<T>;
	delay?: number;
	action?: string;
	swallow?: boolean;
	canAbort?: boolean;
	loading?: MaybeFunction<Renderable>;
	success?: MaybeFunction<Renderable, [T]>;
	error?: MaybeFunction<Renderable, [any]>;
};

export async function showPromiseToast<T, S extends boolean = false>(
	promise: Promise<T> | PromiseFactory<T>,
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
	let promiseOrFactory: Promise<T> | PromiseFactory<T>;
	let opts: ShowPromiseToastOptions<T> & { swallow?: S };
	let def: DefaultToastOptions;

	if (a && typeof a === 'object' && 'promise' in a) {
		promiseOrFactory = a.promise;
		opts = a;
		def = b;
	} else {
		promiseOrFactory = a;
		opts = b;
		def = c;
	}

	opts ||= {} as ShowPromiseToastOptions<T> & { swallow?: S };
	def ||= {};

	const {
		delay = 0,
		swallow,
		canAbort = false,
		action = '操作',
		loading = () => `${action}中...`,
		success = (_v: T) => `${action}成功`,
		error = (err: any) => {
			if (err instanceof DOMException && err.name === 'AbortError') {
				return null;
			}
			return `${action}失败: ${resolveErrorMessage(err)}`;
		},
	} = opts;

	const abortController = new AbortController();
	let toastId: string | undefined;
	let currentMessage: Renderable = null;

	const renderContent = (message: Renderable) => {
		return canAbort ? (
			<div className='flex items-center gap-2'>
				<span>{message}</span>
				<button
					type='button'
					className='btn btn-xs btn-circle btn-ghost'
					onClick={() => {
						abortController.abort();
						toast.dismiss(toastId);
					}}
					title='取消'
				>
					<HiXMark className='w-4 h-4' />
				</button>
			</div>
		) : (
			message
		);
	};

	const setMessage = (message: Renderable) => {
		currentMessage = message;
		if (!toastId) return;
		toast.loading(renderContent(message), {
			id: toastId,
			...def,
			...def.loading,
		});
	};

	const ctx: PromiseContext = {
		signal: abortController.signal,
		abort: (reason?: any) => abortController.abort(reason),
		setMessage,
	};

	const promise: Promise<T> = typeof promiseOrFactory === 'function' ? promiseOrFactory(ctx) : promiseOrFactory;

	try {
		let done = false;
		const p = Promise.resolve(promise);
		await Promise.race([
			Promises.sleep(delay).then(() => {
				if (done) return;
				const loadingContent = currentMessage || maybeFunction(loading);
				if (loadingContent) {
					toastId = toast.loading(renderContent(loadingContent), {
						...def,
						...def.loading,
					});
				}
			}),
			p,
		]);
		const out = await p;
		done = true;
		const message = maybeFunction(success, out);
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
		if (!(e instanceof DOMException && e.name === 'AbortError')) {
			console.log(`ERROR ${classOf(e)}`, e);
		}

		const message = maybeFunction(error, e);
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
