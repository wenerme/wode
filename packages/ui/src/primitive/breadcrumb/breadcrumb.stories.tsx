import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import {
	Breadcrumb,
	BreadcrumbChevronSeparator,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from './index';

function BreadcrumbExample({ rtl = false }: { rtl?: boolean }) {
	const [page, setPage] = useState('当前文件');
	const target = useId();
	return (
		<div dir={rtl ? 'rtl' : 'ltr'} className='grid gap-4'>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`#${target}`}
							onClick={(event) => {
								event.preventDefault();
								setPage('资料库');
							}}
						>
							资料库
						</BreadcrumbLink>
					</BreadcrumbItem>
					{rtl ? <BreadcrumbChevronSeparator /> : <BreadcrumbSeparator />}
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`#${target}`}
							onClick={(event) => {
								event.preventDefault();
								setPage('文档');
							}}
						>
							文档
						</BreadcrumbLink>
					</BreadcrumbItem>
					{rtl ? <BreadcrumbChevronSeparator /> : <BreadcrumbSeparator />}
					<BreadcrumbItem>
						<BreadcrumbPage>{page}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<p id={target} role='status'>
				当前浏览：{page}
			</p>
		</div>
	);
}
const meta = { title: 'Primitive/Breadcrumb', component: Breadcrumb, tags: ['autodocs'] } satisfies Meta<
	typeof Breadcrumb
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <BreadcrumbExample /> };
export const RightToLeft: Story = { render: () => <BreadcrumbExample rtl /> };
