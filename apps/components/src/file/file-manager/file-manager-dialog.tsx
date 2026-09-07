'use client';

import { X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useFileManagerActions } from './file-manager-context';
import type { FileManagerDialogState, FileManagerFileStat } from './file-manager-types';
import { joinFileManagerPath, validateFileManagerName } from './file-manager-utils';

export type FileManagerDialogProps = {
	dialog: FileManagerDialogState;
	path: string;
	selectedEntries: FileManagerFileStat[];
};

export function FileManagerDialog({ dialog, path, selectedEntries }: FileManagerDialogProps) {
	const actions = useFileManagerActions();
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const [validationError, setValidationError] = useState<string>();
	const dialogType = dialog?.type;
	useEffect(() => {
		const element = ref.current;
		if (!element || !dialogType) return;
		setValidationError(undefined);
		if (!element.open) element.showModal();
		return () => {
			if (element.open) element.close();
		};
	}, [dialogType]);
	if (!dialog) return null;
	const title =
		dialog.type === 'create'
			? dialog.kind === 'directory'
				? '新建目录'
				: '新建文件'
			: dialog.type === 'rename'
				? '重命名'
				: dialog.type === 'transfer'
					? dialog.mode === 'copy'
						? '复制到'
						: '移动到'
					: '确认删除';
	const submit = (event: FormEvent) => {
		event.preventDefault();
		setValidationError(undefined);
		if (dialog.type === 'create' || dialog.type === 'rename') {
			const error = validateFileManagerName(dialog.value);
			if (error) {
				setValidationError(error);
				return;
			}
		}
		if (dialog.type === 'create') {
			actions.requestOperation({
				type: dialog.kind === 'directory' ? 'create-directory' : 'create-file',
				directory: path,
				name: dialog.value.trim(),
			});
		}
		if (dialog.type === 'rename' && selectedEntries[0]) {
			actions.requestOperation({ type: 'rename', path: selectedEntries[0].path, name: dialog.value.trim() });
		}
		if (dialog.type === 'transfer') {
			actions.requestOperation({
				type: dialog.mode,
				paths: selectedEntries.map((entry) => entry.path),
				destination: dialog.destination,
			});
		}
		if (dialog.type === 'delete') {
			actions.requestOperation({ type: 'delete', paths: selectedEntries.map((entry) => entry.path) });
		}
	};
	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			className='bg-base-100 text-base-content m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md p-0 shadow-2xl backdrop:bg-black/35'
			onCancel={(event) => {
				event.preventDefault();
				actions.closeDialog();
			}}
		>
			<form onSubmit={submit} className='flex flex-col'>
				<div className='border-base-300 flex items-center gap-2 border-b px-4 py-3'>
					<h3 id={titleId} className='min-w-0 flex-1 text-sm font-semibold'>
						{title}
					</h3>
					<button
						type='button'
						aria-label='关闭'
						title='关闭'
						className='hover:bg-base-200 grid size-7 place-items-center rounded-md'
						onClick={actions.closeDialog}
					>
						<X className='size-4' />
					</button>
				</div>
				<div className='p-4'>
					{dialog.type === 'delete' ? (
						<div className='text-sm leading-6'>
							确认删除 {selectedEntries.length} 个项目？目录内容将递归删除，此操作无法撤销。
						</div>
					) : dialog.type === 'transfer' ? (
						<label className='grid gap-1.5 text-xs'>
							<span className='font-medium'>目标目录</span>
							<input
								autoFocus
								aria-label='目标目录'
								className='input input-sm w-full font-mono'
								value={dialog.destination}
								onChange={(event) => actions.setDialogValue(event.target.value)}
							/>
							<span className='text-base-content/55'>将处理 {selectedEntries.length} 个项目。</span>
						</label>
					) : (
						<label className='grid gap-1.5 text-xs'>
							<span className='font-medium'>名称</span>
							<input
								autoFocus
								aria-label='名称'
								className='input input-sm w-full'
								value={dialog.value}
								onChange={(event) => actions.setDialogValue(event.target.value)}
							/>
							{dialog.type === 'create' ? (
								<span className='text-base-content/55 truncate font-mono'>
									{joinFileManagerPath(path, dialog.value)}
								</span>
							) : null}
						</label>
					)}
					{validationError ? (
						<div role='alert' className='text-error mt-2 text-xs'>
							{validationError}
						</div>
					) : null}
				</div>
				<div className='border-base-300 flex justify-end gap-2 border-t px-4 py-3'>
					<button type='button' className='btn btn-ghost btn-sm' onClick={actions.closeDialog}>
						取消
					</button>
					<button type='submit' className={cn('btn btn-sm', dialog.type === 'delete' ? 'btn-error' : 'btn-neutral')}>
						确认
					</button>
				</div>
			</form>
		</dialog>
	);
}
