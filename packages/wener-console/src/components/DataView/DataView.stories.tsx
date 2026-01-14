/**
 * DataView Storybook Stories
 */
import { useEffect, useState } from 'react';
import { PiChartLineLight, PiFunnelLight, PiGearLight, PiUserLight } from 'react-icons/pi';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AnyResource } from '@wener/common/resource';
import {
	createDataViewStore,
	DataViewLayout,
	DataViewProvider,
	PageInfo,
	PageNav,
	useDataViewStoreContext,
} from './index';
import { ResourceListItem } from './ResourceListItem';

const meta: Meta<typeof DataViewLayout.Composite> = {
	title: 'Components/DataView',
	component: DataViewLayout.Composite,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for demonstrations
const sampleUsers = Array.from({ length: 100 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
	email: `user${i + 1}@example.com`,
	status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Inactive' : 'Pending',
}));

// ============================================
// Story 1: Complete DataView with all features
// ============================================
export const Complete: Story = {
	render: () => {
		const [showSummary, setShowSummary] = useState(true);
		const [pageNumber, setPageNumber] = useState(1);
		const [pageSize, setPageSize] = useState(20);

		const pageCount = Math.ceil(sampleUsers.length / pageSize);
		const startIndex = (pageNumber - 1) * pageSize;
		const endIndex = Math.min(startIndex + pageSize, sampleUsers.length);
		const currentPageData = sampleUsers.slice(startIndex, endIndex);

		return (
			<div className='h-screen'>
				<DataViewLayout.Composite
					header={
						<DataViewLayout.Header
							title='用户管理'
							filter={
								<div className='flex items-center gap-2'>
									<input placeholder='搜索用户...' className='input input-sm input-bordered w-64' />
									<button className='btn btn-sm btn-ghost'>
										<PiFunnelLight />
									</button>
								</div>
							}
							actions={
								<>
									<button className='btn btn-sm'>导出</button>
									<button className='btn btn-primary btn-sm'>新建用户</button>
								</>
							}
						/>
					}
					leftPanel={
						<DataViewLayout.Sidebar title='筛选器' footer={<button className='btn btn-sm btn-block'>重置筛选</button>}>
							<div className='space-y-4'>
								<label className='form-control'>
									<div className='label'>
										<span className='label-text'>状态</span>
									</div>
									<select className='select select-sm select-bordered'>
										<option>全部</option>
										<option>Active</option>
										<option>Inactive</option>
										<option>Pending</option>
									</select>
								</label>
								<label className='form-control'>
									<div className='label'>
										<span className='label-text'>角色</span>
									</div>
									<select className='select select-sm select-bordered'>
										<option>全部</option>
										<option>Admin</option>
										<option>User</option>
										<option>Guest</option>
									</select>
								</label>
							</div>
						</DataViewLayout.Sidebar>
					}
					rightPanel={
						showSummary ? (
							<DataViewLayout.Summary
								title='用户详情'
								description='查看和编辑用户的详细信息'
								onClose={() => setShowSummary(false)}
								tabs={[
									{
										key: 'overview',
										label: '概览',
										icon: <PiUserLight />,
										content: (
											<div className='space-y-4'>
												<div>
													<h4 className='text-base-content/70 text-sm font-semibold'>基本信息</h4>
													<div className='mt-2 space-y-2'>
														<div>
															<label className='text-base-content/60 text-xs'>姓名</label>
															<p>John Doe</p>
														</div>
														<div>
															<label className='text-base-content/60 text-xs'>邮箱</label>
															<p>john@example.com</p>
														</div>
														<div>
															<label className='text-base-content/60 text-xs'>状态</label>
															<span className='badge badge-success badge-sm'>Active</span>
														</div>
													</div>
												</div>
											</div>
										),
									},
									{
										key: 'analytics',
										label: '分析',
										icon: <PiChartLineLight />,
										content: (
											<div className='space-y-4'>
												<div>
													<h4 className='text-base-content/70 text-sm font-semibold'>使用统计</h4>
													<div className='mt-2 space-y-2'>
														<div className='stat'>
															<div className='stat-title'>登录次数</div>
															<div className='stat-value text-primary'>142</div>
														</div>
														<div className='stat'>
															<div className='stat-title'>最后登录</div>
															<div className='stat-value text-sm'>2024-01-15</div>
														</div>
													</div>
												</div>
											</div>
										),
									},
									{
										key: 'settings',
										label: '设置',
										icon: <PiGearLight />,
										content: (
											<div className='space-y-4'>
												<div className='form-control'>
													<label className='label cursor-pointer'>
														<span className='label-text'>接收邮件通知</span>
														<input type='checkbox' className='toggle toggle-primary' defaultChecked />
													</label>
												</div>
												<div className='form-control'>
													<label className='label cursor-pointer'>
														<span className='label-text'>启用二次验证</span>
														<input type='checkbox' className='toggle toggle-primary' />
													</label>
												</div>
											</div>
										),
									},
								]}
							/>
						) : undefined
					}
					footer={
						<DataViewLayout.Footer>
							<PageInfo
								from={startIndex + 1}
								to={endIndex}
								total={sampleUsers.length}
								pageSize={pageSize}
								onPageSizeChange={setPageSize}
							/>
							<PageNav pageNumber={pageNumber} pageCount={pageCount} onPageNumberChange={setPageNumber} />
							{!showSummary && (
								<button className='btn btn-sm btn-ghost ml-auto' onClick={() => setShowSummary(true)}>
									显示详情
								</button>
							)}
						</DataViewLayout.Footer>
					}
				>
					<div className='h-full overflow-auto'>
						<table className='table-zebra table-pin-rows table'>
							<thead>
								<tr>
									<th>
										<input type='checkbox' className='checkbox checkbox-sm' />
									</th>
									<th>ID</th>
									<th>姓名</th>
									<th>邮箱</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								{currentPageData.map((user) => (
									<tr key={user.id} className='hover'>
										<td>
											<input type='checkbox' className='checkbox checkbox-sm' />
										</td>
										<td>{user.id}</td>
										<td>{user.name}</td>
										<td>{user.email}</td>
										<td>
											<span
												className={`badge badge-sm ${
													user.status === 'Active'
														? 'badge-success'
														: user.status === 'Inactive'
															? 'badge-error'
															: 'badge-warning'
												}`}
											>
												{user.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</DataViewLayout.Composite>
			</div>
		);
	},
};

export const Minimal: Story = {
	render: () => (
		<div className='h-screen'>
			<DataViewLayout.Composite
				header={<DataViewLayout.Header title='简单列表' />}
				footer={
					<DataViewLayout.Footer>
						<PageInfo from={1} to={10} total={100} />
						<PageNav pageNumber={1} pageCount={10} />
					</DataViewLayout.Footer>
				}
			>
				<div className='p-4'>
					<div className='prose'>
						<h2>主要内容区域</h2>
						<p>这是一个最简化的 DataView 示例，只有 header、content 和 footer。</p>
					</div>
				</div>
			</DataViewLayout.Composite>
		</div>
	),
};

// ============================================
// Story 3: With Left Panel Only
// ============================================
export const WithLeftPanel: Story = {
	render: () => (
		<div className='h-screen'>
			<DataViewLayout.Composite
				header={<DataViewLayout.Header title='带侧边栏的列表' />}
				leftPanel={
					<DataViewLayout.Sidebar title='导航'>
						<ul className='menu'>
							<li>
								<a className='active'>全部项目</a>
							</li>
							<li>
								<a>进行中</a>
							</li>
							<li>
								<a>已完成</a>
							</li>
							<li>
								<a>已归档</a>
							</li>
						</ul>
					</DataViewLayout.Sidebar>
				}
			>
				<div className='p-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 12 }, (_, i) => (
							<div key={i} className='card bg-base-200 shadow-sm'>
								<div className='card-body'>
									<h2 className='card-title'>项目 {i + 1}</h2>
									<p>项目描述信息...</p>
									<div className='card-actions justify-end'>
										<button className='btn btn-primary btn-sm'>查看</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</DataViewLayout.Composite>
		</div>
	),
};

// ============================================
// Story 4: With Right Panel Only (No Tabs)
// ============================================
export const WithRightPanel: Story = {
	render: () => {
		const [showSummary, setShowSummary] = useState(true);

		return (
			<div className='h-screen'>
				<DataViewLayout.Composite
					header={<DataViewLayout.Header title='列表视图' />}
					rightPanel={
						showSummary ? (
							<DataViewLayout.Summary
								title='订单详情'
								description='查看订单的详细信息'
								onClose={() => setShowSummary(false)}
								tabs={[
									{
										key: 'info',
										label: '基本信息',
										content: (
											<div className='space-y-2'>
												<div>
													<label className='text-base-content/60 text-xs'>订单号</label>
													<p className='font-mono'>#ORD-2024-001</p>
												</div>
												<div>
													<label className='text-base-content/60 text-xs'>客户</label>
													<p>John Doe</p>
												</div>
												<div>
													<label className='text-base-content/60 text-xs'>金额</label>
													<p className='font-semibold'>¥1,234.56</p>
												</div>
												<div>
													<label className='text-base-content/60 text-xs'>状态</label>
													<span className='badge badge-success'>已完成</span>
												</div>
											</div>
										),
									},
									{
										key: 'items',
										label: '订单项',
										content: (
											<div className='space-y-2'>
												<div className='border-b pb-2'>
													<p className='font-semibold'>商品 A</p>
													<p className='text-base-content/60 text-sm'>数量: 2 × ¥500.00</p>
												</div>
												<div className='border-b pb-2'>
													<p className='font-semibold'>商品 B</p>
													<p className='text-base-content/60 text-sm'>数量: 1 × ¥234.56</p>
												</div>
											</div>
										),
									},
								]}
							>
								<div className='flex items-center gap-2'>
									<span className='badge badge-success'>已支付</span>
									<span className='badge badge-info'>已发货</span>
								</div>
							</DataViewLayout.Summary>
						) : undefined
					}
				>
					<div className='p-4'>
						<table className='table'>
							<thead>
								<tr>
									<th>订单号</th>
									<th>客户</th>
									<th>金额</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								<tr className='hover'>
									<td className='font-mono'>#ORD-2024-001</td>
									<td>John Doe</td>
									<td>¥1,234.56</td>
									<td>
										<span className='badge badge-success'>已完成</span>
									</td>
								</tr>
								<tr className='hover'>
									<td className='font-mono'>#ORD-2024-002</td>
									<td>Jane Smith</td>
									<td>¥2,345.67</td>
									<td>
										<span className='badge badge-warning'>处理中</span>
									</td>
								</tr>
							</tbody>
						</table>
						{!showSummary && (
							<div className='mt-4'>
								<button className='btn btn-sm btn-primary' onClick={() => setShowSummary(true)}>
									显示详情面板
								</button>
							</div>
						)}
					</div>
				</DataViewLayout.Composite>
			</div>
		);
	},
};

// ============================================
// Story 5: Header Variants
// ============================================
export const HeaderVariants: Story = {
	render: () => {
		return (
			<div className='bg-base-200 h-screen space-y-4 p-4'>
				<div className='card bg-base-100 shadow'>
					<DataViewLayout.Header title='基本标题' />
				</div>

				<div className='card bg-base-100 shadow'>
					<DataViewLayout.Header title='带操作的标题'>
						<button className='btn btn-sm'>自定义操作</button>
					</DataViewLayout.Header>
				</div>

				<div className='card bg-base-100 shadow'>
					<DataViewLayout.Header
						title='带过滤和操作'
						filter={<input placeholder='搜索...' className='input input-sm input-bordered' />}
						actions={
							<>
								<button className='btn btn-sm'>取消</button>
								<button className='btn btn-primary btn-sm'>保存</button>
							</>
						}
					/>
				</div>
			</div>
		);
	},
};

// ============================================
// Story 6: Summary Tab Variants
// ============================================
export const SummaryTabs: Story = {
	render: () => {
		const [activeTab, setActiveTab] = useState('tab1');

		return (
			<div className='bg-base-200 h-screen p-4'>
				<div className='card bg-base-100 h-full shadow'>
					<DataViewLayout.Summary
						title='多标签页示例'
						description='展示不同的内容面板'
						activeTab={activeTab}
						onTabChange={setActiveTab}
						onClose={() => console.log('Close')}
						tabs={[
							{
								key: 'tab1',
								label: '标签页 1',
								icon: <PiUserLight />,
								content: (
									<div className='space-y-2'>
										<h3 className='font-semibold'>第一个标签页</h3>
										<p>这是第一个标签页的内容。</p>
									</div>
								),
							},
							{
								key: 'tab2',
								label: '标签页 2',
								icon: <PiChartLineLight />,
								content: (
									<div className='space-y-2'>
										<h3 className='font-semibold'>第二个标签页</h3>
										<p>这是第二个标签页的内容。</p>
									</div>
								),
							},
							{
								key: 'tab3',
								label: '标签页 3',
								icon: <PiGearLight />,
								content: (
									<div className='space-y-2'>
										<h3 className='font-semibold'>第三个标签页</h3>
										<p>这是第三个标签页的内容。</p>
									</div>
								),
							},
							{
								key: 'tab4',
								label: '禁用',
								disabled: true,
								content: <div>禁用的标签页</div>,
							},
						]}
					>
						<div className='alert alert-info'>
							<span>这是 children 内容，显示在标签页之前</span>
						</div>
					</DataViewLayout.Summary>
				</div>
			</div>
		);
	},
};

// ============================================
// Story 7: Pagination Only
// ============================================
export const PaginationOnly: Story = {
	render: () => {
		const [pageNumber, setPageNumber] = useState(1);
		const [pageSize, setPageSize] = useState(30);

		return (
			<div className='bg-base-200 min-h-screen space-y-8 p-8'>
				<div className='card bg-base-100 p-4 shadow'>
					<h3 className='mb-4 font-semibold'>PageInfo 组件</h3>
					<PageInfo
						from={1}
						to={30}
						total={1234}
						pageSize={pageSize}
						pageSizeOptions={[10, 20, 30, 50, 100]}
						onPageSizeChange={setPageSize}
					/>
				</div>

				<div className='card bg-base-100 p-4 shadow'>
					<h3 className='mb-4 font-semibold'>PageNav 组件</h3>
					<PageNav pageNumber={pageNumber} pageCount={42} onPageNumberChange={setPageNumber} />
				</div>

				<div className='card bg-base-100 p-4 shadow'>
					<h3 className='mb-4 font-semibold'>组合使用</h3>
					<div className='flex items-center gap-4'>
						<PageInfo
							from={(pageNumber - 1) * pageSize + 1}
							to={Math.min(pageNumber * pageSize, 1234)}
							total={1234}
							pageSize={pageSize}
							onPageSizeChange={setPageSize}
						/>
						<div className='flex-1' />
						<PageNav
							pageNumber={pageNumber}
							pageCount={Math.ceil(1234 / pageSize)}
							onPageNumberChange={setPageNumber}
						/>
					</div>
				</div>
			</div>
		);
	},
};

// ============================================
// Story 7: ListItem Component
// ============================================
export const ListItemDemo: Story = {
	render: () => {
		const [selected, setSelected] = useState<number[]>([]);

		const handleSelect = (id: number, isSelected: boolean) => {
			setSelected((prev) => (isSelected ? [...prev, id] : prev.filter((x) => x !== id)));
		};

		return (
			<div className='h-screen space-y-4 p-8'>
				<h2 className='text-2xl font-bold'>ListItem 组件演示</h2>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>Basic ListItem</h3>

						<DataViewLayout.ListItem
							title='Simple Item'
							description='A brief description of this item'
							selected={selected.includes(1)}
							onSelectedChange={(s) => handleSelect(1, s)}
						>
							This is a simple list item with title, description and children content.
						</DataViewLayout.ListItem>
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>ListItem with Actions</h3>

						<DataViewLayout.ListItem
							title='Item with Actions'
							description='This item demonstrates action buttons'
							selected={selected.includes(2)}
							onSelectedChange={(s) => handleSelect(2, s)}
							actions={
								<>
									<button className='btn btn-ghost btn-xs'>Edit</button>
									<button className='btn btn-ghost btn-xs'>Delete</button>
								</>
							}
						>
							Additional content about this item goes here.
						</DataViewLayout.ListItem>
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>ListItem with Clickable Title</h3>

						<DataViewLayout.ListItem
							title='Clickable Title'
							description='The title is clickable'
							onTitleClick={() => alert('Title clicked!')}
							selected={selected.includes(3)}
							onSelectedChange={(s) => handleSelect(3, s)}
						>
							Click the title above to trigger an action.
						</DataViewLayout.ListItem>
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>ListItem with Meta Info</h3>

						<DataViewLayout.ListItem
							title='Task: Complete Project Documentation'
							description='Documentation task for the Q4 release'
							selected={selected.includes(4)}
							onSelectedChange={(s) => handleSelect(4, s)}
							actions={
								<>
									<button className='btn btn-primary btn-xs'>Complete</button>
									<button className='btn btn-ghost btn-xs'>Edit</button>
								</>
							}
							meta={
								<span>
									Created by <strong>John Doe</strong> • Updated 2 hours ago • Priority: High
								</span>
							}
						>
							<p>
								Review and finalize the project documentation, including API reference, user guides, and deployment
								instructions.
							</p>
						</DataViewLayout.ListItem>
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>Multiple Items</h3>

						{Array.from({ length: 5 }, (_, i) => (
							<DataViewLayout.ListItem
								key={i}
								title={`Item ${i + 1}`}
								description={`Brief description of item ${i + 1}`}
								selected={selected.includes(i + 10)}
								onSelectedChange={(s) => handleSelect(i + 10, s)}
								onTitleClick={() => alert(`Clicked item ${i + 1}`)}
								actions={<button className='btn btn-ghost btn-xs'>View</button>}
								meta={`Created ${i + 1} days ago`}
							>
								Additional details and content for item {i + 1}
							</DataViewLayout.ListItem>
						))}
					</div>
				</div>
			</div>
		);
	},
};

// ============================================
// Story 8: Virtual List Component
// ============================================
export const VirtualListDemo: Story = {
	render: () => {
		const [selected, setSelected] = useState<number[]>([]);

		// Generate large dataset
		const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
			id: i + 1,
			title: `Item ${i + 1}`,
			description: `This is the description for item ${i + 1}`,
			createdBy: `User ${(i % 50) + 1}`,
			createdAt: new Date(Date.now() - i * 60000).toISOString(),
			status: ['Active', 'Pending', 'Completed', 'Archived'][i % 4],
		}));

		const handleSelect = (id: number, isSelected: boolean) => {
			setSelected((prev) => (isSelected ? [...prev, id] : prev.filter((x) => x !== id)));
		};

		return (
			<div className='h-screen p-8'>
				<div className='card bg-base-100 h-[calc(100vh-4rem)] shadow'>
					<div className='card-body flex flex-col'>
						<div className='mb-4 flex items-center justify-between'>
							<h3 className='card-title'>Virtual List - 10,000 Items</h3>
							<div className='text-sm'>
								Selected: <strong>{selected.length}</strong>
							</div>
						</div>

						<div className='flex-1 overflow-hidden rounded-lg border'>
							<DataViewLayout.List
								data={largeDataset}
								estimatedItemSize={100}
								renderItem={({ item, index }) => (
									<DataViewLayout.ListItem
										key={item.id}
										title={item.title}
										description={item.description}
										selected={selected.includes(item.id)}
										onSelectedChange={(s) => handleSelect(item.id, s)}
										onTitleClick={() => alert(`Clicked: ${item.title}`)}
										actions={
											<>
												<button className='btn btn-ghost btn-xs'>Edit</button>
												<button className='btn btn-ghost btn-xs'>Delete</button>
											</>
										}
										meta={
											<span>
												Created by <strong>{item.createdBy}</strong> • {new Date(item.createdAt).toLocaleDateString()} •
												Status: {item.status}
											</span>
										}
									/>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	},
};

// ============================================
// Story 9: Complete with Virtual List
// ============================================
export const CompleteWithList: Story = {
	render: () => {
		const [selected, setSelected] = useState<number[]>([]);
		const [showSummary, setShowSummary] = useState(false);
		const [activeItem, setActiveItem] = useState<any>(null);

		const items = Array.from({ length: 500 }, (_, i) => ({
			id: i + 1,
			title: `Project ${i + 1}`,
			description: `Project description for item ${i + 1}`,
			createdBy: `User ${(i % 20) + 1}`,
			createdAt: new Date(Date.now() - i * 3600000).toISOString(),
			status: ['Active', 'Pending', 'Completed'][i % 3],
		}));

		const handleSelect = (id: number, isSelected: boolean) => {
			setSelected((prev) => (isSelected ? [...prev, id] : prev.filter((x) => x !== id)));
		};

		return (
			<div className='h-screen'>
				<DataViewLayout.Composite
					header={
						<DataViewLayout.Header
							title='项目列表'
							filter={<input type='text' placeholder='搜索项目...' className='input input-bordered input-sm w-64' />}
							actions={
								<div className='flex gap-2'>
									<button className='btn btn-ghost btn-sm'>
										<PiFunnelLight className='h-4 w-4' />
										筛选
									</button>
									<button className='btn btn-primary btn-sm'>+ 新建项目</button>
								</div>
							}
						/>
					}
					leftPanel={
						<DataViewLayout.Sidebar title='分类'>
							<div className='menu'>
								<li>
									<a>全部项目 ({items.length})</a>
								</li>
								<li>
									<a>进行中 ({items.filter((x) => x.status === 'Active').length})</a>
								</li>
								<li>
									<a>待处理 ({items.filter((x) => x.status === 'Pending').length})</a>
								</li>
								<li>
									<a>已完成 ({items.filter((x) => x.status === 'Completed').length})</a>
								</li>
							</div>
						</DataViewLayout.Sidebar>
					}
					rightPanel={
						showSummary &&
						activeItem && (
							<DataViewLayout.Summary
								title={activeItem.title}
								description={activeItem.description}
								onClose={() => setShowSummary(false)}
								tabs={[
									{
										key: 'details',
										label: '详情',
										icon: <PiUserLight />,
										content: (
											<div className='space-y-4'>
												<div>
													<label className='label-text'>创建者</label>
													<p className='font-medium'>{activeItem.createdBy}</p>
												</div>
												<div>
													<label className='label-text'>创建时间</label>
													<p className='font-medium'>{new Date(activeItem.createdAt).toLocaleString()}</p>
												</div>
												<div>
													<label className='label-text'>状态</label>
													<p className='font-medium'>{activeItem.status}</p>
												</div>
											</div>
										),
									},
									{
										key: 'activity',
										label: '活动',
										icon: <PiChartLineLight />,
										content: <div className='p-4'>活动记录...</div>,
									},
								]}
							/>
						)
					}
					footer={
						<DataViewLayout.Footer>
							<PageInfo from={1} to={Math.min(20, items.length)} total={items.length} pageSize={20} />
							<PageNav pageNumber={1} pageCount={Math.ceil(items.length / 20)} />
						</DataViewLayout.Footer>
					}
				>
					<DataViewLayout.List
						data={items}
						estimatedItemSize={100}
						renderItem={({ item }) => (
							<DataViewLayout.ListItem
								key={item.id}
								title={item.title}
								description={item.description}
								selected={selected.includes(item.id)}
								onSelectedChange={(s) => handleSelect(item.id, s)}
								onTitleClick={() => {
									setActiveItem(item);
									setShowSummary(true);
								}}
								actions={
									<>
										<button className='btn btn-ghost btn-xs'>编辑</button>
										<button className='btn btn-ghost btn-xs'>删除</button>
									</>
								}
								meta={
									<span>
										创建者: <strong>{item.createdBy}</strong> • {new Date(item.createdAt).toLocaleDateString()} • 状态:{' '}
										{item.status}
									</span>
								}
							/>
						)}
					/>
				</DataViewLayout.Composite>
			</div>
		);
	},
};

// ============================================
// Story 10: ResourceListItem Component
// ============================================
export const ResourceListItemDemo: Story = {
	render: () => {
		const [selected, setSelected] = useState<string[]>([]);

		// Sample resource data
		const resources: AnyResource[] = [
			{
				id: '1',
				code: 'USR-001',
				displayName: 'John Doe',
				fullName: 'John William Doe',
				title: 'Senior Developer',
				description: 'Full-stack developer with 10 years of experience',
				email: 'john.doe@example.com',
				phoneNumber: '+1-234-567-8900',
				status: 'active',
				createdAt: new Date(Date.now() - 86400000 * 30),
				updatedAt: new Date(Date.now() - 3600000 * 2),
				createdBy: { id: '10', displayName: 'Admin User' },
				updatedBy: { id: '11', displayName: 'HR Manager' },
			},
			{
				id: '2',
				code: 'PRJ-042',
				title: 'Website Redesign Project',
				description: 'Complete overhaul of company website with modern UI/UX',
				status: 'in_progress',
				createdAt: new Date(Date.now() - 86400000 * 15),
				updatedAt: new Date(Date.now() - 86400000 * 1),
				createdBy: { id: '12', displayName: 'Project Manager' },
			},
			{
				id: '3',
				code: 'TSK-156',
				displayName: 'API Integration',
				topic: 'Backend Development',
				description: 'Integrate third-party payment gateway API',
				notes: 'High priority - deadline next week',
				status: 'pending',
				createdAt: new Date(Date.now() - 86400000 * 5),
				updatedAt: new Date(Date.now() - 86400000 * 5),
				createdBy: { id: '1', displayName: 'John Doe' },
			},
			{
				id: '4',
				loginName: 'jane.smith',
				fullName: 'Jane Smith',
				displayName: 'Jane S.',
				description: 'Marketing specialist focusing on digital campaigns',
				email: 'jane.smith@example.com',
				status: 'active',
				createdAt: new Date(Date.now() - 86400000 * 90),
				updatedAt: new Date(Date.now() - 86400000 * 10),
				createdBy: { id: '10', displayName: 'Admin User' },
				updatedBy: { id: '10', displayName: 'Admin User' },
			},
			{
				id: '5',
				code: 'DOC-789',
				title: 'Q4 Financial Report',
				description: 'Quarterly financial analysis and projections',
				remark: 'Awaiting CFO approval',
				status: 'draft',
				createdAt: new Date(Date.now() - 86400000 * 7),
				updatedAt: new Date(Date.now() - 3600000 * 6),
				createdBy: { id: '13', displayName: 'Finance Team' },
				updatedBy: { id: '14', displayName: 'Accountant' },
			},
		];

		const handleSelect = (id: string, isSelected: boolean) => {
			setSelected((prev) => (isSelected ? [...prev, id] : prev.filter((x) => x !== id)));
		};

		return (
			<div className='h-screen space-y-4 p-8'>
				<div className='mb-4 flex items-center justify-between'>
					<h2 className='text-2xl font-bold'>ResourceListItem 组件演示</h2>
					<div className='text-sm'>
						Selected: <strong>{selected.length}</strong>
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>Basic Usage</h3>
						<p className='text-base-content/70 text-sm'>
							ResourceListItem 自动检测 resource 字段并智能显示：title/displayName/fullName，description，creator，dates
							等
						</p>

						{resources.map((resource) => (
							<ResourceListItem
								key={resource.id}
								data={resource}
								selected={selected.includes(resource.id)}
								onSelectedChange={(s) => handleSelect(resource.id, s)}
								onTitleClick={() => alert(`Clicked: ${resource.id}`)}
								actions={
									<>
										<button className='btn btn-ghost btn-xs'>编辑</button>
										<button className='btn btn-ghost btn-xs'>删除</button>
									</>
								}
							/>
						))}
					</div>
				</div>

				<div className='card bg-base-100 shadow'>
					<div className='card-body'>
						<h3 className='card-title'>Custom Options</h3>

						<div className='space-y-4'>
							<div>
								<h4 className='mb-2 font-medium'>Without Code Display (showCode=false)</h4>
								<ResourceListItem
									data={resources[0]}
									showCode={false}
									selected={selected.includes(resources[0].id)}
									onSelectedChange={(s) => handleSelect(resources[0].id, s)}
								/>
							</div>

							<div>
								<h4 className='mb-2 font-medium'>Without Meta Info (showMeta=false)</h4>
								<ResourceListItem
									data={resources[1]}
									showMeta={false}
									selected={selected.includes(resources[1].id)}
									onSelectedChange={(s) => handleSelect(resources[1].id, s)}
								/>
							</div>

							<div>
								<h4 className='mb-2 font-medium'>Custom Title Renderer</h4>
								<ResourceListItem
									data={resources[2]}
									customTitle={(data) => (
										<span className='flex items-center gap-2'>
											<span className='badge badge-primary'>{data.status}</span>
											<span className='text-primary font-bold'>{data.displayName || data.title}</span>
										</span>
									)}
									selected={selected.includes(resources[2].id)}
									onSelectedChange={(s) => handleSelect(resources[2].id, s)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
};

// Sample data generator
const generateSampleData = (count: number): AnyResource[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: `item-${i + 1}`,
		code: `ITEM-${String(i + 1).padStart(4, '0')}`,
		displayName: `Item ${i + 1}`,
		title: `Resource Item ${i + 1}`,
		description: `This is the description for item ${i + 1}`,
		status: ['active', 'pending', 'inactive'][i % 3],
		createdAt: new Date(Date.now() - i * 3600000),
		updatedAt: new Date(Date.now() - i * 1800000),
		createdBy: { id: `user-${(i % 10) + 1}`, displayName: `User ${(i % 10) + 1}` },
	}));
};

// DataView with Store Component
function DataViewWithStore() {
	const store = useDataViewStoreContext();
	const { data, total, loading, selected, active, query, view, components } = store.getState();
	const { actions } = store.getState();

	// Simulate data loading
	useEffect(() => {
		const loadData = async () => {
			actions.setLoading(true);
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const sampleData = generateSampleData(100);
			actions.setData(sampleData, sampleData.length);
			actions.setLoading(false);
		};

		loadData();
	}, [actions]);

	const handleItemClick = (item: AnyResource) => {
		actions.setActive(item);
		actions.setComponentState('summary', { open: true });
	};

	const handleCloseSummary = () => {
		actions.setComponentState('summary', { open: false });
		actions.setActive(undefined);
	};

	const pageCount = Math.ceil(total / query.pageSize);
	const startIndex = query.pageIndex * query.pageSize;
	const endIndex = Math.min(startIndex + query.pageSize, total);

	return (
		<div className='h-screen'>
			<DataViewLayout.Composite
				header={
					<DataViewLayout.Header
						title='DataView with Store'
						filter={
							<input
								type='text'
								placeholder='搜索...'
								className='input input-bordered input-sm w-64'
								value={query.search}
								onChange={(e) => actions.setQuery({ search: e.target.value })}
							/>
						}
						actions={
							<div className='flex gap-2'>
								<button
									className='btn btn-ghost btn-sm'
									onClick={() => actions.setViewMode(view.mode === 'list' ? 'table' : 'list')}
								>
									{view.mode === 'list' ? '表格视图' : '列表视图'}
								</button>
								<button className='btn btn-primary btn-sm' onClick={() => actions.refresh()}>
									刷新
								</button>
							</div>
						}
					/>
				}
				leftPanel={
					<DataViewLayout.Sidebar title='筛选器'>
						<div className='menu'>
							<li>
								<a className='active'>全部 ({total})</a>
							</li>
							<li>
								<a>活跃 ({data.filter((x) => x.status === 'active').length})</a>
							</li>
							<li>
								<a>待处理 ({data.filter((x) => x.status === 'pending').length})</a>
							</li>
							<li>
								<a>未激活 ({data.filter((x) => x.status === 'inactive').length})</a>
							</li>
						</div>
					</DataViewLayout.Sidebar>
				}
				rightPanel={
					components.summary?.open &&
					active && (
						<DataViewLayout.Summary
							title={active.displayName || active.title}
							description={active.description}
							onClose={handleCloseSummary}
							tabs={[
								{
									key: 'details',
									label: '详情',
									icon: <PiUserLight />,
									content: (
										<div className='space-y-4'>
											<div>
												<label className='label-text'>资源编码</label>
												<p className='font-medium'>{active.code}</p>
											</div>
											<div>
												<label className='label-text'>状态</label>
												<p className='font-medium'>{active.status}</p>
											</div>
											<div>
												<label className='label-text'>创建时间</label>
												<p className='font-medium'>{new Date(active.createdAt!).toLocaleString()}</p>
											</div>
										</div>
									),
								},
								{
									key: 'history',
									label: '历史',
									icon: <PiChartLineLight />,
									content: <div className='p-4'>历史记录...</div>,
								},
							]}
						/>
					)
				}
				footer={
					<DataViewLayout.Footer>
						<PageInfo from={startIndex + 1} to={endIndex} total={total} pageSize={query.pageSize} />
						<PageNav pageNumber={query.pageIndex + 1} pageCount={pageCount} />
					</DataViewLayout.Footer>
				}
			>
				{loading ? (
					<div className='flex h-64 items-center justify-center'>
						<span className='loading loading-spinner loading-lg'></span>
					</div>
				) : (
					<DataViewLayout.List
						data={data}
						estimatedItemSize={120}
						renderItem={({ item }) => (
							<ResourceListItem
								key={item.id}
								data={item}
								selected={selected.includes(item.id)}
								onSelectedChange={(_s) => actions.toggleSelection(item.id)}
								onTitleClick={() => handleItemClick(item)}
								actions={
									<>
										<button className='btn btn-ghost btn-xs'>编辑</button>
										<button className='btn btn-ghost btn-xs'>删除</button>
									</>
								}
							/>
						)}
					/>
				)}
			</DataViewLayout.Composite>
		</div>
	);
}

export const DataViewWithStoreDemo: Story = {
	render: () => {
		// Create store with initial configuration
		const store = createDataViewStore<AnyResource>({
			query: {
				pageSize: 20,
			},
			view: {
				mode: 'list',
			},
			components: {
				summary: { open: false },
				sidebar: { open: true },
			},
		});

		// Set up event listeners
		store.getState().events.on('Refresh', () => {
			console.log('Refreshing data...');
		});
		store.getState().events.on('DataChanged', ({ data, total }) => {
			console.log('Data changed:', { count: data.length, total });
		});
		store.getState().events.on('SelectionChanged', ({ selected }) => {
			console.log('Selection changed:', selected);
		});
		store.getState().events.on('ActiveChanged', ({ active }) => {
			console.log('Active changed:', active?.id);
		});
		store.getState().events.on('QueryChanged', ({ query }) => {
			console.log('Query changed:', query);
		});

		return (
			<DataViewProvider value={store}>
				<DataViewWithStore />
			</DataViewProvider>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Complete DataView implementation with DataViewStore for state management. Features include search, pagination, selection, active item tracking, and component state management.',
			},
		},
	},
};
