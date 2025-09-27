import React, { type FC } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../utils/cn';
import { getWindowDragHandleClassname } from './const';
import { useWindow } from './ReactWindow';

interface ToggleControlProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

const ToggleControl: FC<ToggleControlProps> = ({ label, checked, onChange }) => (
	<div className='form-control'>
		<label className='label cursor-pointer'>
			<span className='label-text'>{label}</span>
			<input type='checkbox' className='toggle' checked={checked} onChange={(e) => onChange(e.target.checked)} />
		</label>
	</div>
);

export const WindowTest = () => {
	let win = useWindow();
	let store = win.store;

	const { canMaximize, canMinimize, canResize, frameless } = useStore(
		store,
		useShallow(({ canMaximize, canMinimize, canResize, frameless }) => {
			return {
				canMaximize,
				canMinimize,
				canResize,
				frameless,
			};
		}),
	);
	return (
		<div className={'flex flex-col p-2'}>
			<h2>Window Test</h2>
			<div className={'flex flex-col gap-1'}>
				<ToggleControl
					label='Can Maximize'
					checked={canMaximize}
					onChange={(checked) => store.setState({ canMaximize: checked })}
				/>
				<ToggleControl
					label='Can Minimize'
					checked={canMinimize}
					onChange={(checked) => store.setState({ canMinimize: checked })}
				/>
				<ToggleControl
					label='Can Resize'
					checked={canResize}
					onChange={(checked) => store.setState({ canResize: checked })}
				/>
				<ToggleControl
					label='Frameless'
					checked={frameless}
					onChange={(checked) => store.setState({ frameless: checked })}
				/>
				<div className={cn('size-10 cursor-pointer rounded-md border', getWindowDragHandleClassname())}>H</div>
			</div>
			<hr className={'my-4'} />
			<input type='text' className={'input input-bordered'} placeholder={'Can focus and input'} />
		</div>
	);
};
