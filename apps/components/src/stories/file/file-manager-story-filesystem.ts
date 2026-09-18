import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';

export async function createSeededMemoryFileSystem(): Promise<IFileSystem> {
	const fileSystem = createMemoryFileSystem();
	await seedDemoFileSystem(fileSystem);
	return fileSystem;
}

export async function seedIfEmpty(fileSystem: IFileSystem) {
	if ((await fileSystem.readdir('/')).length === 0) await seedDemoFileSystem(fileSystem);
}

export async function seedDemoFileSystem(fileSystem: IFileSystem) {
	await fileSystem.mkdir('/Documents', { recursive: true });
	await fileSystem.mkdir('/Projects/file-manager', { recursive: true });
	await fileSystem.mkdir('/Media', { recursive: true });
	await fileSystem.writeFile(
		'/Documents/README.md',
		'# File manager\n\nThis workspace is backed by `@wener/common/fs`.\n\n- Memory is ephemeral\n- OPFS is origin-private\n- Local directories require an explicit picker gesture\n',
	);
	await fileSystem.writeFile(
		'/Documents/notes.txt',
		'Review filesystem boundaries before attaching business policy.\n',
	);
	await fileSystem.writeFile(
		'/Projects/file-manager/spec.json',
		JSON.stringify(
			{ adapter: '@wener/common/fs', capabilities: ['read', 'write', 'copy', 'move'], version: 1 },
			null,
			2,
		),
	);
	await fileSystem.writeFile(
		'/Media/workflow.svg',
		'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240"><rect width="640" height="240" fill="#f4f4f5"/><g fill="#18181b" font-family="system-ui" font-size="20"><text x="40" y="68">IFileSystem</text><text x="250" y="68">FileManager Runtime</text><text x="470" y="68">Consumer</text></g><path d="M150 60h80m190 0h35" stroke="#2563eb" stroke-width="4"/><text x="40" y="175" fill="#52525b" font-family="system-ui" font-size="16">Memory · OPFS · Local Directory · Remote Adapter</text></svg>',
	);
	await fileSystem.writeFile('/welcome.txt', 'Select a folder, create a file, or switch storage backends.\n');
}

export function createDelayedWriteFileSystem(fileSystem: IFileSystem, delayMs: number): IFileSystem {
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'writeFile') {
				return async (...args: Parameters<IFileSystem['writeFile']>) => {
					const signal = args[2]?.signal;
					await waitForAbortableDelay(delayMs, signal);
					return target.writeFile(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

export function createFailingSaveFileSystem(
	fileSystem: IFileSystem,
	failingPath = '/Documents/README.md',
): IFileSystem {
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'writeFile') {
				return async (...args: Parameters<IFileSystem['writeFile']>) => {
					if (args[0] === failingPath) {
						await new Promise((resolve) => setTimeout(resolve, 120));
						throw new Error('Injected save failure');
					}
					return target.writeFile(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

export function createFailOnceUploadFileSystem(fileSystem: IFileSystem, failingPath: string): IFileSystem {
	let failed = false;
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'writeFile') {
				return async (...args: Parameters<IFileSystem['writeFile']>) => {
					if (args[0] === failingPath && !failed) {
						failed = true;
						throw new Error('Injected transient upload failure');
					}
					return target.writeFile(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

function waitForAbortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('Operation aborted', 'AbortError'));
			return;
		}
		const timer = setTimeout(resolve, delayMs);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(new DOMException('Operation aborted', 'AbortError'));
			},
			{ once: true },
		);
	});
}
