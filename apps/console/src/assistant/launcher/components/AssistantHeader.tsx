import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { useAssistantLauncherMutate, useAssistantLauncherState } from '../AssistantLauncherState';

export const AssistantHeader: React.FC = () => {
	const state = useAssistantLauncherState();
	const mutate = useAssistantLauncherMutate();

	return (
		<div
			className='flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-4'
			data-tauri-drag-region
		>
			{/* User Info */}
			<div className='flex items-center gap-3'>
				<div className='placeholder avatar'>
					<div className='w-10 rounded-full bg-neutral text-neutral-content'>
						<span className='text-xl'>{state.user.displayName?.[0] || 'U'}</span>
					</div>
				</div>
				<div>
					<div className='font-bold'>{state.user.displayName || 'Guest'}</div>
					<div className='text-xs opacity-60'>{state.user.username || 'guest'}</div>
				</div>
			</div>

			{/* Search */}
			<div className='max-w-md flex-1 px-4'>
				<div className='relative'>
					<FiSearch className='text-base-content/50 absolute left-3 top-1/2 -translate-y-1/2' />
					<input
						type='text'
						placeholder='Search tools...'
						className='input-bordered input input-sm w-full rounded-full bg-base-200 pl-9 focus:bg-base-100'
						value={state.searchQuery}
						onChange={(e) => {
							mutate.searchQuery = e.target.value;
						}}
					/>
				</div>
			</div>

			{/* Window Controls / Extra Actions */}
			<div className='flex gap-2'>{/* Placeholder for window controls if needed, or just empty for now */}</div>
		</div>
	);
};
