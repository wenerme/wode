import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarFallback, AvatarImage } from './index';

const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#253854"/><circle cx="40" cy="29" r="15" fill="#fff"/><path d="M12 80a28 28 0 0 1 56 0" fill="#fff"/></svg>')}`;
const meta = { title: 'Primitive/Avatar', component: Avatar, tags: ['autodocs'] } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: {
		size: 'xl',
		children: (
			<>
				<AvatarImage src={portrait} alt='本地示例头像' />
				<AvatarFallback>示</AvatarFallback>
			</>
		),
	},
};
export const FallbackAndShapes: Story = {
	render: () => (
		<div className='flex items-center gap-4'>
			<Avatar size='xs' aria-label='小尺寸头像'>
				<AvatarFallback>A</AvatarFallback>
			</Avatar>
			<Avatar size='md' shape='square' status='offline' aria-label='离线用户林'>
				<AvatarFallback>林</AvatarFallback>
			</Avatar>
			<Avatar size='xl' shape='squircle' status='online' aria-label='在线用户周'>
				<AvatarFallback>周</AvatarFallback>
			</Avatar>
		</div>
	),
};
