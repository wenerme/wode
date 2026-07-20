import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { UpdateNotificationToast } from './UpdateNotificationToast';

const meta: Meta = {
	title: 'components/UpdateNotification',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Default = () => {
	const [open, setOpen] = useState(true);
	return (
		<div className={'flex'}>
			<div className={'join'}>
				<button
					type={'button'}
					className={'btn btn-sm'}
					onClick={() => {
						setOpen(true);
					}}
				>
					Open
				</button>
				<button
					type={'button'}
					className={'btn btn-sm'}
					onClick={() => {
						setOpen(false);
					}}
				>
					Close
				</button>
			</div>
			<UpdateNotificationToast open={open} onOpenChange={setOpen} />
		</div>
	);
};
