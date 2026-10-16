import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { Link } from './index';

function LocalLinks({ hover = false }: { hover?: boolean }) {
	const target = useId();
	return (
		<div className='grid gap-4'>
			<div className='flex gap-4'>
				<Link href={`#${target}`} tone='neutral'>
					查看说明
				</Link>
				<Link href={`#${target}`} tone='primary' className={hover ? 'link-hover' : undefined}>
					跳转至本地内容
				</Link>
			</div>
			<p id={target}>此链接只定位到当前页面内的说明。</p>
		</div>
	);
}
const meta = { title: 'Primitive/Link', component: Link, tags: ['autodocs'] } satisfies Meta<typeof Link>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <LocalLinks /> };
export const UnderlineOnHover: Story = { render: () => <LocalLinks hover /> };
