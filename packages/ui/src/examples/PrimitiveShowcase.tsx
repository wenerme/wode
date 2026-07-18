import { Button } from '../button';
import { Dialog } from '../dialog';
import { Input } from '../input';
import { Popover } from '../popover';
import { Textarea } from '../textarea';

export function PrimitiveShowcase() {
	return (
		<div className='grid max-w-md gap-4 rounded-lg border p-4'>
			<div className='flex flex-wrap gap-2'>
				<Button>Default</Button>
				<Button variant='outline'>Outline</Button>
				<Button variant='ghost'>Ghost</Button>
			</div>
			<Input placeholder='Email' type='email' />
			<Textarea placeholder='Message' />
			<div className='flex flex-wrap gap-2'>
				<Dialog.Root>
					<Dialog.Trigger render={<Button variant='secondary' />}>Open dialog</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title className='text-lg font-semibold'>Dialog title</Dialog.Title>
						<Dialog.Description className='text-muted-foreground text-sm'>Base UI powered dialog.</Dialog.Description>
						<Dialog.Close render={<Button variant='outline' />}>Close</Dialog.Close>
					</Dialog.Content>
				</Dialog.Root>
				<Popover.Root>
					<Popover.Trigger render={<Button variant='outline' />}>Open popover</Popover.Trigger>
					<Popover.Content>
						<Popover.Title className='font-medium'>Popover title</Popover.Title>
						<Popover.Description className='text-muted-foreground text-sm'>
							Base UI powered popover.
						</Popover.Description>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	);
}
