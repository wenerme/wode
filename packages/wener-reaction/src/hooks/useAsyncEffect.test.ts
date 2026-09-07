import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { useAsyncEffect } from './useAsyncEffect';

describe('useAsyncEffect', () => {
	it('should run async effect', async () => {
		const fn = vi.fn();
		renderHook(() =>
			useAsyncEffect(async () => {
				fn();
			}),
		);
		await vi.waitFor(() => expect(fn).toBeCalled());
	});

	it('should abort on unmount', () => {
		const onAbort = vi.fn();
		const { unmount } = renderHook(() =>
			useAsyncEffect(async ({ signal }) => {
				signal.addEventListener('abort', onAbort);
			}),
		);
		unmount();
		expect(onAbort).toBeCalled();
	});

	it('should run cleanup on unmount', async () => {
		const onCleanup = vi.fn();
		const { unmount } = renderHook(() =>
			useAsyncEffect(async () => {
				return onCleanup;
			}),
		);
		// wait for effect to finish
		await vi.waitFor(() => {});
		unmount();
		expect(onCleanup).toBeCalled();
	});

	it('should run cleanup on dep change', async () => {
		const onCleanup = vi.fn();
		const { rerender } = renderHook(
			({ dep }) =>
				useAsyncEffect(async () => {
					return onCleanup;
				}, [dep]),
			{ initialProps: { dep: 1 } },
		);
		// wait for effect
		await vi.waitFor(() => {});
		rerender({ dep: 2 });
		expect(onCleanup).toBeCalled();
	});
});
