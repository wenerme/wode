import { Button } from '../button';
import { Dialog } from '../dialog';
import { Input } from '../input';
import { Popover } from '../popover';
import { Textarea } from '../textarea';

export function PrimitiveShowcase() {
	return (
		<div className='border-base-300 bg-base-100 rounded-box grid max-w-md gap-4 border p-4'>
			<div className='flex flex-wrap gap-2'>
				<Button>主要操作</Button>
				<Button variant='outline'>次要操作</Button>
				<Button variant='ghost'>轻量操作</Button>
			</div>
			<Input aria-label='邮箱' placeholder='name@example.com' type='email' />
			<Textarea aria-label='说明' placeholder='补充说明' />
			<div className='flex flex-wrap gap-2'>
				<Dialog.Root>
					<Dialog.Trigger render={<Button variant='secondary' />}>打开对话框</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title className='text-lg font-semibold'>确认操作</Dialog.Title>
						<Dialog.Description className='text-base-content/65 text-sm'>
							对话框行为由 Base UI 管理。
						</Dialog.Description>
						<Dialog.Close render={<Button variant='outline' />}>关闭</Dialog.Close>
					</Dialog.Content>
				</Dialog.Root>
				<Popover.Root>
					<Popover.Trigger render={<Button variant='outline' />}>打开浮层</Popover.Trigger>
					<Popover.Content>
						<Popover.Title className='font-medium'>浮层信息</Popover.Title>
						<Popover.Description className='text-base-content/65 text-sm'>
							浮层定位与关闭行为由 Base UI 管理。
						</Popover.Description>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	);
}
