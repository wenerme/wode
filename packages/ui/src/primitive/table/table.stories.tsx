import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './index';

const meta = { title: 'Primitive/Table', component: Table, tags: ['autodocs'] } satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<Table zebra size='sm'>
			<TableCaption>本地文件清单</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead scope='col'>文件</TableHead>
					<TableHead scope='col'>类型</TableHead>
					<TableHead scope='col'>大小</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableHead scope='row'>笔记</TableHead>
					<TableCell>文本</TableCell>
					<TableCell>12 KB</TableCell>
				</TableRow>
				<TableRow>
					<TableHead scope='row'>草图</TableHead>
					<TableCell>图片</TableCell>
					<TableCell>48 KB</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={2}>总计</TableCell>
					<TableCell>60 KB</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	),
};
export const Empty: Story = {
	render: () => (
		<Table>
			<TableCaption>筛选结果</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead scope='col'>文件</TableHead>
					<TableHead scope='col'>状态</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell colSpan={2} className='py-10 text-center'>
						没有符合条件的文件
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};
export const PinnedHeaders: Story = {
	render: () => (
		<Table pinRows pinColumns size='xs' containerClassName='max-h-56 max-w-lg'>
			<TableCaption>可滚动的数据表</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead scope='col'>编号</TableHead>
					<TableHead scope='col'>记录</TableHead>
					<TableHead scope='col'>状态</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 20 }, (_, i) => (
					<TableRow key={i}>
						<TableHead scope='row'>{i + 1}</TableHead>
						<TableCell className='min-w-80'>本地记录 {i + 1}</TableCell>
						<TableCell>已保存</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	),
};
