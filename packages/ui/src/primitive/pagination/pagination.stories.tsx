import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect } from 'storybook/test';
import { Pagination, PaginationButton, PaginationItem, PaginationLink, PaginationList } from './index';

function PaginatedRecords({ links = false, total = 3 }: { links?: boolean; total?: number }) {
	const [page, setPage] = useState(1);
	const target = useId();
	return (
		<div className='grid gap-4'>
			<p id={target} role='status'>
				第 {page} 页，共 {total} 页
			</p>
			<Pagination>
				<PaginationList>
					<PaginationItem>
						<PaginationButton disabled={page === 1} onClick={() => setPage(page - 1)}>
							上一页
						</PaginationButton>
					</PaginationItem>
					{Array.from({ length: total }, (_, i) => i + 1).map((number) => (
						<PaginationItem key={number}>
							{links ? (
								<PaginationLink
									href={`#${target}`}
									active={page === number}
									aria-label={`第 ${number} 页`}
									onClick={(event) => {
										event.preventDefault();
										setPage(number);
									}}
								>
									{number}
								</PaginationLink>
							) : (
								<PaginationButton
									active={page === number}
									aria-label={`第 ${number} 页`}
									onClick={() => setPage(number)}
								>
									{number}
								</PaginationButton>
							)}
						</PaginationItem>
					))}
					<PaginationItem>
						<PaginationButton disabled={page === total} onClick={() => setPage(page + 1)}>
							下一页
						</PaginationButton>
					</PaginationItem>
				</PaginationList>
			</Pagination>
		</div>
	);
}
const meta = { title: 'Primitive/Pagination', component: Pagination, tags: ['autodocs'] } satisfies Meta<
	typeof Pagination
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => <PaginatedRecords />,
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole('button', { name: '上一页' })).toBeDisabled();
		await userEvent.click(canvas.getByRole('button', { name: '下一页' }));
		await expect(canvas.getByRole('button', { name: '第 2 页' })).toHaveAttribute('aria-current', 'page');
		await expect(canvas.getByRole('status')).toHaveTextContent('第 2 页，共 3 页');
		await userEvent.click(canvas.getByRole('button', { name: '第 3 页' }));
		await expect(canvas.getByRole('button', { name: '下一页' })).toBeDisabled();
	},
};
export const Links: Story = { render: () => <PaginatedRecords links /> };
export const SinglePage: Story = { render: () => <PaginatedRecords total={1} /> };
