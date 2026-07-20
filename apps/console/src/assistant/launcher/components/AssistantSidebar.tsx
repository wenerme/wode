import type React from 'react';
import { FiInfo, FiSettings } from 'react-icons/fi';
import { useAssistantLauncherMutate, useAssistantLauncherState } from '../AssistantLauncherState';
import type { AssistantTool } from '../types';
import { AssistantToolItem } from './AssistantToolItem';

export const AssistantSidebar: React.FC = () => {
	const state = useAssistantLauncherState();
	const mutate = useAssistantLauncherMutate();

	const filteredTools = state.tools.filter(
		(t) =>
			t.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
			t.description?.toLowerCase().includes(state.searchQuery.toLowerCase()),
	);

	const handleSettings = () => {
		state.sidecar.openSettings();
	};

	return (
		<div className='bg-base-200/50 flex h-full w-64 flex-col border-r border-base-300'>
			{/* Tool List */}
			<div className='flex-1 overflow-y-auto py-2'>
				{filteredTools.length === 0 ? (
					<div className='p-4 text-center text-sm opacity-60'>No tools found</div>
				) : (
					filteredTools.map((tool) => (
						<AssistantToolItem
							key={tool.id}
							tool={tool as AssistantTool}
							isActive={tool.id === state.activeToolId}
							onClick={() => {
								mutate.activeToolId = tool.id;
							}}
						/>
					))
				)}
			</div>

			{/* Footer Menu */}
			<div className='mt-auto border-t border-base-300 p-2'>
				<div className='menu menu-horizontal w-full justify-between'>
					<button className='btn btn-ghost btn-sm btn-square tooltip' data-tip={`Version ${state.info.version}`}>
						<FiInfo />
					</button>
					<button className='btn btn-ghost btn-sm btn-square' onClick={handleSettings}>
						<FiSettings />
					</button>
				</div>
			</div>
		</div>
	);
};
