import { HandWavingIcon } from '@phosphor-icons/react';
import { Button } from '@wener/ui/button';
import type { ReactNode } from 'react';

export function HelloButton({ children = 'Hello from Wener Components!' }: { children?: ReactNode }) {
	return (
		<Button>
			<HandWavingIcon className='size-4' />
			{children}
		</Button>
	);
}
