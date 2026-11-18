// @vitest-environment jsdom

import Emittery from 'emittery';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useEmitteryListen } from './useEmitteryListen';

type Events = {
	upload: { files: string[]; directory: string };
	refresh: undefined;
};
type Handlers = { [K in keyof Events]?: (data: Events[K]) => void };
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

afterEach(async () => {
	await act(async () => root.unmount());
	host.remove();
	vi.unstubAllGlobals();
});

function Listener({ emitter, handlers }: { emitter: Emittery<Events>; handlers: Handlers }) {
	useEmitteryListen(emitter, handlers);
	return null;
}

async function render(emitter: Emittery<Events>, handlers: Handlers) {
	await act(async () => root.render(<Listener emitter={emitter} handlers={handlers} />));
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((fulfill) => {
		resolve = fulfill;
	});
	return { promise, resolve };
}

it('业务回调收到原始数据对象，保留文件列表与目录', async () => {
	const emitter = new Emittery<Events>();
	const handler = vi.fn();
	const payload = { files: ['draft.txt'], directory: '/workspace' };
	await render(emitter, { upload: handler });
	await emitter.emit('upload', payload);
	expect(handler).toHaveBeenCalledExactlyOnceWith(payload);
	expect(handler.mock.calls[0][0]).toBe(payload);
});

it('emit 等待异步 handler 完成后才返回', async () => {
	const emitter = new Emittery<Events>();
	const started = deferred();
	const release = deferred();
	let completed = false;
	await render(emitter, {
		upload: async () => {
			started.resolve();
			await release.promise;
		},
	});
	const emission = emitter.emit('upload', { files: [], directory: '/workspace' }).then(() => {
		completed = true;
	});
	await started.promise;
	try {
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
		expect(completed).toBe(false);
	} finally {
		release.resolve();
		await emission;
	}
	expect(completed).toBe(true);
});

it('重渲染使用最新 handler，并保持一份订阅', async () => {
	const emitter = new Emittery<Events>();
	const initial = vi.fn();
	const latest = vi.fn();
	await render(emitter, { upload: initial });
	await render(emitter, { upload: latest });
	expect(emitter.listenerCount('upload')).toBe(1);
	const payload = { files: [], directory: '/workspace' };
	await emitter.emit('upload', payload);
	expect(initial).not.toHaveBeenCalled();
	expect(latest).toHaveBeenCalledExactlyOnceWith(payload);
});

it('更换事件名时清理旧订阅，空 payload 保持原契约', async () => {
	const emitter = new Emittery<Events>();
	const upload = vi.fn();
	const refresh = vi.fn();
	await render(emitter, { upload });
	await render(emitter, { refresh });
	expect(emitter.listenerCount('upload')).toBe(0);
	expect(emitter.listenerCount('refresh')).toBe(1);
	await emitter.emit('upload', { files: [], directory: '/workspace' });
	await emitter.emit('refresh');
	expect(upload).not.toHaveBeenCalled();
	expect(refresh).toHaveBeenCalledExactlyOnceWith(undefined);
});

it('切换 emitter 和卸载均清理订阅', async () => {
	const first = new Emittery<Events>();
	const second = new Emittery<Events>();
	const upload = vi.fn();
	const refresh = vi.fn();
	await render(first, { upload });
	await render(second, { refresh });
	expect(first.listenerCount('upload')).toBe(0);
	await first.emit('upload', { files: [], directory: '/workspace' });
	await second.emit('refresh');
	expect(upload).not.toHaveBeenCalled();
	expect(refresh).toHaveBeenCalledExactlyOnceWith(undefined);
	await act(async () => root.render(null));
	expect(second.listenerCount('refresh')).toBe(0);
});
