import { useEffect, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Promises } from '@wener/utils';
import { DynamicRender } from './';
import type { DynamicRenderer } from './DynamicRender';

type ShowDialogOptions = {
	title?: ReactNode;
	description?: ReactNode;
	content?: ReactNode;
	renderer?: DynamicRenderer;
	action?: ReactNode;
};

export function showPrompt({
	defaultValue,
	placeholder,
	...props
}: ShowDialogOptions & {
	defaultValue?: string;
	placeholder?: string;
}): Promise<string | undefined> {
	const { resolve, promise } = Promises.withResolvers<string | undefined>();
	let valueRef = defaultValue || '';
	const handle = showDialog({
		...props,
		content: (
			<>
				<input
					type='text'
					className={'input input-sm input-bordered w-full'}
					onChange={(e) => {
						valueRef = e.target.value;
					}}
					{...{
						defaultValue,
						placeholder,
					}}
				/>
			</>
		),
		action: (
			<div className='modal-action'>
				<form method='dialog'>
					<button
						className='btn btn-sm'
						onClick={() => {
							resolve(undefined);
						}}
					>
						取消
					</button>
				</form>
				<button
					type={'button'}
					className='btn btn-primary btn-sm'
					onClick={() => {
						resolve(valueRef);
						handle.remove();
					}}
				>
					确认
				</button>
			</div>
		),
	});
	return promise;
}

export function showConfirm(props: ShowDialogOptions): Promise<boolean> {
	const { resolve, promise } = Promises.withResolvers<boolean>();
	const handle = showDialog({
		...props,
		action: (
			<div className='modal-action'>
				<form method='dialog'>
					<button
						className='btn btn-sm'
						onClick={() => {
							resolve(false);
						}}
					>
						取消
					</button>
				</form>
				<button
					type={'button'}
					className='btn btn-primary btn-sm'
					onClick={() => {
						resolve(true);
						handle.remove();
					}}
				>
					确认
				</button>
			</div>
		),
	});
	return promise;
}

export function showDialog({ title, description, content, renderer, action }: ShowDialogOptions) {
	return DynamicRender.render({
		renderer,
		render: () => {
			const { remove, id } = DynamicRender.useRenderHandle();
			const [dialogRef, setRef] = useState<HTMLDialogElement | null>();
			let ref = dialogRef;
			useEffect(() => {
				if (!ref) return;
				if (!ref.open) {
					ref.showModal();
				}
				ref.addEventListener('close', remove);
				return () => {
					ref.removeEventListener('close', remove);
				};
			}, [ref]);
			return (
				<DynamicDialog
					id={id}
					ref={setRef}
					{...{
						title,
						description,
						content,
						action,
					}}
				/>
			);
		},
	});
}

const DynamicDialog = ({
	title,
	description,
	content,
	children,
	action,
	...props
}: Omit<ComponentPropsWithRef<'dialog'>, 'title' | 'content'> & {
	title?: ReactNode;
	description?: ReactNode;
	content?: ReactNode;
	action?: ReactNode;
}) => {
	return (
		<dialog className='modal' {...props}>
			<div className='modal-box'>
				{title && <h3 className='text-lg font-bold'>{title}</h3>}
				{description && <p className='py-4'>{description}</p>}
				{content}
				{action ?? (
					<div className='modal-action'>
						<form method='dialog'>
							<button className='btn btn-sm'>关闭</button>
						</form>
					</div>
				)}
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button>close</button>
			</form>
		</dialog>
	);
};
