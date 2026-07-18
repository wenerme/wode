'use client';

import { Database, LoaderCircle, RotateCcw } from 'lucide-react';
import { createContext, type ReactNode, use, useEffect, useState } from 'react';
import type { ConsoleDemoPartition } from './console-demo-database';
import { type ConsoleDemoDataRuntime, createConsoleDemoDataRuntime } from './console-demo-react-db';

const ConsoleDemoDataContext = createContext<ConsoleDemoDataRuntime | undefined>(undefined);

export type ConsoleDemoDataProviderProps = {
	children: ReactNode;
	partition: ConsoleDemoPartition;
	resetOnMount?: boolean;
};

export function ConsoleDemoDataProvider({ children, partition, resetOnMount = false }: ConsoleDemoDataProviderProps) {
	const [runtime, setRuntime] = useState<ConsoleDemoDataRuntime>();
	const [error, setError] = useState<string>();
	const [retry, setRetry] = useState(0);
	const reconnect = () => {
		setRuntime(undefined);
		setError(undefined);
		setRetry((value) => value + 1);
	};
	useEffect(() => {
		let active = true;
		let current: ConsoleDemoDataRuntime | undefined;
		void createConsoleDemoDataRuntime({
			partition,
			reset: resetOnMount,
			onSyncError: (reason) => {
				if (active) setError(getErrorMessage(reason));
			},
		})
			.then((next) => {
				current = next;
				if (active) {
					setError(undefined);
					setRuntime(next);
				} else {
					void next.dispose();
				}
			})
			.catch((reason) => {
				if (active) setError(getErrorMessage(reason));
			});
		return () => {
			active = false;
			if (current) void current.dispose();
		};
	}, [partition, resetOnMount, retry]);

	if (error && !runtime) {
		return (
			<div className='bg-base-100 grid min-h-svh place-items-center p-6'>
				<div className='max-w-sm text-center'>
					<Database aria-hidden='true' className='text-error mx-auto size-8' />
					<h1 className='mt-3 text-lg font-semibold'>无法打开演示数据库</h1>
					<p role='alert' className='text-base-content/65 mt-2 text-sm'>
						{error}
					</p>
					<button type='button' className='btn btn-neutral btn-sm mt-5' onClick={reconnect}>
						<RotateCcw aria-hidden='true' className='size-4' />
						重试
					</button>
				</div>
			</div>
		);
	}

	if (!runtime) {
		return (
			<div className='bg-base-100 text-base-content/65 flex min-h-svh items-center justify-center gap-2 text-sm'>
				<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
				正在打开演示数据库
			</div>
		);
	}

	return (
		<ConsoleDemoDataContext value={runtime}>
			{error ? (
				<div
					className='border-error/40 bg-base-100 fixed top-3 left-1/2 z-[9500] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-md border px-3 py-2 shadow-xl'
					role='alert'
				>
					<span className='min-w-0 flex-1 truncate text-sm'>{error}</span>
					<button type='button' className='btn btn-error btn-xs' onClick={reconnect}>
						重新连接
					</button>
				</div>
			) : null}
			{children}
		</ConsoleDemoDataContext>
	);
}

export function useConsoleDemoDataRuntime() {
	const runtime = use(ConsoleDemoDataContext);
	if (!runtime) throw new Error('ConsoleDemoDataProvider is required');
	return runtime;
}

function getErrorMessage(reason: unknown) {
	return reason instanceof Error ? reason.message : 'IndexedDB 初始化失败';
}
