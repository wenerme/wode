import type React from 'react';
import { AssistantHeader } from './AssistantHeader';

interface AssistantLayoutProps {
	sidebar: React.ReactNode;
	content: React.ReactNode;
}

export const AssistantLayout: React.FC<AssistantLayoutProps> = ({ sidebar, content }) => {
	return (
		<div className='flex h-full w-full flex-col overflow-hidden bg-base-100 text-base-content'>
			<AssistantHeader />
			<div className='relative flex flex-1 overflow-hidden'>
				<aside className='h-full flex-none'>{sidebar}</aside>
				<main className='relative flex-1 overflow-hidden bg-base-100'>{content}</main>
			</div>
		</div>
	);
};
