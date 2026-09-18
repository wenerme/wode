import { Users } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ConsoleCrmPage } from './console-demo-crm';

export function ConsoleCrmDeleteDialog({
	page,
	pending,
	onCancel,
	onConfirm,
}: {
	page: ConsoleCrmPage;
	pending: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
		return () => dialog.close();
	}, []);
	return (
		<dialog
			ref={dialogRef}
			aria-label={`删除${page === 'account' ? '客户' : '联系人'}`}
			className='modal'
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
		>
			<div className='modal-box max-w-sm'>
				<Users className='text-error size-6' />
				<h2 className='mt-3 text-base font-semibold'>确认删除{page === 'account' ? '客户' : '联系人'}？</h2>
				<p className='text-base-content/65 mt-2 text-sm'>
					{page === 'account' ? '关联联系人也会在同一事务中删除。' : '此操作会从本地数据库移除联系人。'}
				</p>
				<div className='modal-action'>
					<button type='button' className='btn btn-ghost' disabled={pending} onClick={onCancel}>
						取消
					</button>
					<button type='button' className='btn btn-error' disabled={pending} onClick={onConfirm}>
						确认删除
					</button>
				</div>
			</div>
		</dialog>
	);
}
