import React, { useEffect, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { DynamicRender } from './';
import type { DynamicRenderer } from './DynamicRender';

type ShowDialogOptions = {
	title?: ReactNode;
	description?: ReactNode;
	content?: ReactNode;
	renderer?: DynamicRenderer;
};

export function showDialog({ title, description, content, renderer }: ShowDialogOptions) {
	DynamicRender.render({
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
	...props
}: Omit<ComponentPropsWithRef<'dialog'>, 'title' | 'content'> & {
	title?: ReactNode;
	description?: ReactNode;
	content?: ReactNode;
}) => {
	return (
		<dialog className='modal' {...props}>
			<div className='modal-box'>
				{title && <h3 className='text-lg font-bold'>{title}</h3>}
				{description && <p className='py-4'>{description}</p>}
				{content}
				<div className='modal-action'>
					<form method='dialog'>
						<button className='btn btn-sm'>关闭</button>
					</form>
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button>close</button>
			</form>
		</dialog>
	);
};
