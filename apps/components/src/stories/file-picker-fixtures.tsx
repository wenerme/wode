'use client';

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { useEffect, useState } from 'react';
import type { FileManagerFileStat } from '../../registry/default/blocks/file-manager';
import {
	DirectoryPicker,
	type DirectoryPickerResult,
	FilePicker,
	type FilePickerAcceptType,
	SaveFilePicker,
	type SaveFilePickerResult,
} from '../../registry/default/blocks/file-picker';

export const imageAccept: readonly FilePickerAcceptType[] = [
	{ description: '图片', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
];

export const documentAndImageAccept: readonly FilePickerAcceptType[] = [
	{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } },
	...imageAccept,
];

export function PickerFixture({
	accept,
	initialPath = '/',
	mode,
	multiple = false,
	suggestedName = '季度报告.md',
}: {
	accept?: readonly FilePickerAcceptType[];
	initialPath?: string;
	mode: 'directory' | 'open' | 'save';
	multiple?: boolean;
	suggestedName?: string;
}) {
	const fileSystem = usePickerFileSystem();
	const [result, setResult] = useState<
		DirectoryPickerResult | FileManagerFileStat | FileManagerFileStat[] | SaveFilePickerResult
	>();
	const [cancelled, setCancelled] = useState(false);
	if (!fileSystem) return <div role='status'>正在准备文件系统…</div>;
	const common = {
		className: 'h-[min(42rem,calc(100vh-2rem))] min-h-[32rem]',
		fileSystem,
		initialPath,
		onCancel: () => setCancelled(true),
	};
	return (
		<div className='bg-base-200 min-h-screen p-4'>
			{mode === 'open' ? (
				<FilePicker {...common} accept={accept} multiple={multiple} onConfirm={setResult} />
			) : mode === 'directory' ? (
				<DirectoryPicker {...common} onConfirm={setResult} />
			) : (
				<SaveFilePicker {...common} accept={accept} suggestedName={suggestedName} onConfirm={setResult} />
			)}
			<output aria-label='选择结果' className='mt-2 block text-xs'>
				{cancelled ? '已取消' : result ? formatPickerResult(result) : '等待选择'}
			</output>
		</div>
	);
}

export function DelayedSaveCancellationFixture() {
	const fileSystem = usePickerFileSystem();
	const [result, setResult] = useState('等待选择');
	if (!fileSystem) return <div role='status'>正在准备文件系统…</div>;
	const delayedFileSystem = createDelayedFileSystem(fileSystem, 180);
	return (
		<div className='bg-base-200 min-h-screen p-4'>
			<SaveFilePicker
				className='h-[min(42rem,calc(100vh-2rem))] min-h-[32rem]'
				fileSystem={delayedFileSystem}
				suggestedName='取消保存.md'
				onCancel={() => setResult('已取消')}
				onConfirm={(value) => setResult(value.path)}
			/>
			<output aria-label='选择结果' className='mt-2 block text-xs'>
				{result}
			</output>
		</div>
	);
}

export function ErrorPickerFixture() {
	const [fileSystem] = useState<IFileSystem>(
		() =>
			new Proxy(createMemoryFileSystem(), {
				get(target, property, receiver) {
					if (property === 'readdir') return async () => Promise.reject(new Error('模拟目录读取失败'));
					const value = Reflect.get(target, property, receiver) as unknown;
					return typeof value === 'function' ? value.bind(target) : value;
				},
			}),
	);
	return (
		<div className='bg-base-200 min-h-screen p-4'>
			<FilePicker
				className='h-[min(42rem,calc(100vh-2rem))] min-h-[32rem]'
				fileSystem={fileSystem}
				onConfirm={() => {}}
			/>
		</div>
	);
}

export function usePickerFileSystem() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => {
		let active = true;
		const fs = createMemoryFileSystem();
		void seedPickerFileSystem(fs).then(() => {
			if (active) setFileSystem(fs);
		});
		return () => {
			active = false;
		};
	}, []);
	return fileSystem;
}

export function formatPickerResult(
	result: DirectoryPickerResult | FileManagerFileStat | FileManagerFileStat[] | SaveFilePickerResult,
) {
	if (Array.isArray(result)) return result.map((entry) => entry.path).join(', ');
	return result.path;
}

async function seedPickerFileSystem(fileSystem: IFileSystem) {
	await fileSystem.mkdir('/文档', { recursive: true });
	await fileSystem.mkdir('/图片', { recursive: true });
	await fileSystem.mkdir('/空目录', { recursive: true });
	await fileSystem.writeFile('/README.md', '# File Picker\n');
	await fileSystem.writeFile('/季度报告.md', '# 已有季度报告\n');
	await fileSystem.writeFile('/说明.txt', '用于文件选择器场景。');
	await fileSystem.writeFile('/logo.png', new Uint8Array([137, 80, 78, 71]));
	await fileSystem.writeFile('/图片/封面.png', new Uint8Array([137, 80, 78, 71]));
	await fileSystem.writeFile('/图片/banner.jpg', new Uint8Array([255, 216, 255]));
	await fileSystem.writeFile('/文档/计划.md', '# 计划\n');
}

function createDelayedFileSystem(fileSystem: IFileSystem, delay: number): IFileSystem {
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'exists') {
				return async (path: string) => {
					await new Promise((resolve) => setTimeout(resolve, delay));
					return target.exists(path);
				};
			}
			const value = Reflect.get(target, property, receiver) as unknown;
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}
