import { HandWavingIcon } from '@phosphor-icons/react';

export function HelloButton({ children = 'Hello from Wener Components!' }: { children?: React.ReactNode }) {
	return (
		<button className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all'>
			<HandWavingIcon className='size-4' />
			{children}
		</button>
	);
}
