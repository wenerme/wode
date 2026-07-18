import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	Activity,
	ArrowLeft,
	BriefcaseBusiness,
	Building2,
	CalendarClock,
	Check,
	CircleDollarSign,
	ClipboardList,
	Mail,
	MapPin,
	MessageSquareText,
	Phone,
	RefreshCw,
	ShieldCheck,
	Tag,
	UserRound,
	UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
	ConsoleRecordActivityList,
	ConsoleRecordCommandBar,
	ConsoleRecordContentLayout,
	ConsoleRecordDetailPage,
	ConsoleRecordEditActions,
	type ConsoleRecordFact,
	ConsoleRecordFactList,
	ConsoleRecordHeader,
	ConsoleRecordRelatedList,
	ConsoleRecordSection,
	ConsoleRecordState,
	ConsoleRecordTabs,
} from '../../registry/default/blocks/console-record-detail';

const meta = {
	title: 'Console/Record Detail',
	component: ConsoleRecordDetailPage,
	args: {
		header: null,
	},
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'适用于 CRM、ERP 与后台系统的高密度记录详情页，提供身份头、命令栏、页签、事实字段、活动与关联记录布局。',
			},
		},
	},
} satisfies Meta<typeof ConsoleRecordDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contact: Story = {
	render: () => <ContactRecordDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('heading', { level: 1, name: '林澄' })).toBeInTheDocument();
		await expect(canvas.getByRole('toolbar', { name: '联系人操作' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('tab', { name: /活动/ }));
		await expect(canvas.getByRole('heading', { name: '全部活动' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('tab', { name: '概况' }));
		await userEvent.click(canvas.getByRole('button', { name: '编辑' }));
		await expect(canvas.getByRole('status')).toHaveTextContent('编辑中');
		const nameInput = canvas.getByRole('textbox', { name: '姓名' });
		await userEvent.clear(nameInput);
		await userEvent.type(nameInput, '林澄（更新）');
		await expect(canvas.getByRole('status')).toHaveTextContent('有未保存的更改');
		await userEvent.click(canvas.getByRole('button', { name: '取消' }));
		await expect(canvas.getByRole('status')).toHaveTextContent('已保存');
		await expect(canvas.getByRole('heading', { level: 1, name: '林澄' })).toBeInTheDocument();
		await expect(canvas.queryByRole('textbox', { name: '姓名' })).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '编辑' }));
		const savedNameInput = canvas.getByRole('textbox', { name: '姓名' });
		await userEvent.clear(savedNameInput);
		await userEvent.type(savedNameInput, '林澄（更新）');
		await userEvent.click(canvas.getByRole('tab', { name: '详情' }));
		await userEvent.click(canvas.getByRole('tab', { name: '概况' }));
		await expect(canvas.getByRole('textbox', { name: '姓名' })).toHaveValue('林澄（更新）');
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await expect(canvas.getByRole('status')).toHaveTextContent('已保存');
		await expect(canvas.getByRole('heading', { level: 1, name: '林澄（更新）' })).toBeInTheDocument();
		await expect(canvas.queryByRole('textbox', { name: '姓名' })).not.toBeInTheDocument();
	},
};

export const States: Story = {
	render: () => (
		<main className='bg-base-300 grid min-h-screen gap-px lg:grid-cols-3'>
			<h1 className='sr-only'>记录详情状态</h1>
			<div className='bg-base-100'>
				<ConsoleRecordState state='loading' description='正在同步联系人、活动和关联业务数据。' />
			</div>
			<div className='bg-base-100'>
				<ConsoleRecordState title='未找到联系人' description='该记录可能已归档，或当前账号没有查看权限。' />
			</div>
			<div className='bg-base-100'>
				<ConsoleRecordState
					state='error'
					description='服务暂时不可用，请稍后重试。'
					actions={
						<button className='btn btn-sm' type='button'>
							重试
						</button>
					}
				/>
			</div>
		</main>
	),
};

function ContactRecordDemo() {
	const [editing, setEditing] = useState(false);
	const [savedAt, setSavedAt] = useState('今天 14:32');
	const [record, setRecord] = useState(initialContactRecord);
	const [draft, setDraft] = useState(initialContactRecord);
	const dirty =
		editing &&
		Object.keys(record).some((key) => record[key as keyof ContactRecord] !== draft[key as keyof ContactRecord]);

	const startEditing = () => {
		setDraft(record);
		setEditing(true);
	};
	const cancelEditing = () => {
		setDraft(record);
		setEditing(false);
	};

	const save = () => {
		if (!dirty) return;
		setRecord(draft);
		setEditing(false);
		setSavedAt('刚刚');
	};

	return (
		<main>
			<ConsoleRecordDetailPage
				className='min-h-screen'
				commandBar={
					<ConsoleRecordCommandBar
						label='联系人操作'
						end={
							<span role='status' className='text-base-content/70 flex items-center gap-1.5 text-xs'>
								{editing ? (
									<span className={dirty ? 'status status-warning' : 'status status-info'} />
								) : (
									<Check className='text-success size-3.5' />
								)}
								{editing ? (dirty ? '有未保存的更改' : '编辑中 · 尚无更改') : `已保存 · ${savedAt}`}
							</span>
						}
					>
						<button
							className='btn btn-ghost btn-square btn-sm'
							type='button'
							title='返回联系人列表'
							aria-label='返回联系人列表'
						>
							<ArrowLeft className='size-4' />
						</button>
						<div aria-hidden='true' className='bg-base-300 mx-1 h-5 w-px' />
						<ConsoleRecordEditActions
							dirty={dirty}
							editing={editing}
							onCancel={cancelEditing}
							onEdit={startEditing}
							onSave={save}
						/>
						<button className='btn btn-ghost btn-square btn-sm' type='button' title='刷新记录' aria-label='刷新记录'>
							<RefreshCw className='size-4' />
						</button>
					</ConsoleRecordCommandBar>
				}
				header={
					<ConsoleRecordHeader
						avatar={record.name.slice(0, 1)}
						eyebrow='联系人 · CRM'
						title={record.name}
						subtitle={
							<span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
								<span>{record.jobTitle}</span>
								<span aria-hidden='true'>·</span>
								<a className='link link-hover text-base-content font-medium' href='#account'>
									示例科技有限公司
								</a>
							</span>
						}
						status={<span className='badge badge-success badge-sm'>活跃客户</span>}
						badges={
							<>
								<span className='badge badge-outline badge-sm'>
									<Tag className='size-3' /> 关键联系人
								</span>
								<span className='badge badge-outline badge-sm'>
									<ShieldCheck className='size-3' /> 决策者
								</span>
							</>
						}
						metadata='负责人：林洁 · 最近更新：今天 14:32 · 创建于 2025-11-08'
						actions={
							<>
								<a className='btn btn-outline btn-sm' href='tel:+8613800000000'>
									<Phone className='size-4' /> 致电
								</a>
								<a className='btn btn-outline btn-sm' href='mailto:contact@example.com'>
									<Mail className='size-4' /> 邮件
								</a>
							</>
						}
					/>
				}
				footer='联系人编号 CON-2026-00186 · 数据仅用于组件展示'
			>
				<ConsoleRecordTabs
					listLabel='联系人详情视图'
					tabs={[
						{
							value: 'overview',
							label: '概况',
							icon: <UserRound className='size-4' />,
							content: (
								<ContactOverview
									draft={draft}
									editing={editing}
									onDraftChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
									record={record}
								/>
							),
						},
						{
							value: 'details',
							label: '详情',
							icon: <ClipboardList className='size-4' />,
							content: <ContactDetails />,
						},
						{
							value: 'activity',
							label: '活动',
							icon: <Activity className='size-4' />,
							badge: <span className='badge badge-sm'>4</span>,
							content: <ContactActivity />,
						},
						{
							value: 'related',
							label: '关联记录',
							icon: <BriefcaseBusiness className='size-4' />,
							content: <ContactRelated />,
						},
					]}
				/>
			</ConsoleRecordDetailPage>
		</main>
	);
}

type ContactRecord = {
	address: string;
	department: string;
	email: string;
	jobTitle: string;
	language: string;
	name: string;
	phone: string;
	wechat: string;
};

const initialContactRecord: ContactRecord = {
	address: '上海市浦东新区示例路 88 号',
	department: '产品体验中心',
	email: 'contact@example.com',
	jobTitle: '产品设计负责人',
	language: '简体中文',
	name: '林澄',
	phone: '+86 138 0000 0000',
	wechat: 'example-contact',
};

type ContactOverviewProps = {
	draft: ContactRecord;
	editing: boolean;
	onDraftChange: (key: keyof ContactRecord, value: string) => void;
	record: ContactRecord;
};

function ContactOverview({ draft, editing, onDraftChange, record }: ContactOverviewProps) {
	const field = (key: keyof ContactRecord, label: string) =>
		editing ? (
			<input
				aria-label={label}
				className='input input-bordered input-sm w-full'
				value={draft[key]}
				onChange={(event) => onDraftChange(key, event.currentTarget.value)}
			/>
		) : (
			record[key]
		);
	return (
		<ConsoleRecordContentLayout
			main={
				<>
					<ConsoleRecordSection title='基本信息' description='联系人身份、沟通方式与组织关系。'>
						<ConsoleRecordFactList
							facts={withFactIds([
								{ label: '姓名', value: field('name', '姓名') },
								{ label: '职务', value: field('jobTitle', '职务') },
								{ label: '手机', value: field('phone', '手机') },
								{ label: '电子邮件', value: field('email', '电子邮件') },
								{ label: '部门', value: field('department', '部门') },
								{ label: '首选语言', value: field('language', '首选语言') },
								{ label: '地址', value: field('address', '地址'), description: '工作地址' },
								{ label: '微信', value: field('wechat', '微信') },
							])}
						/>
					</ConsoleRecordSection>
					<ConsoleRecordSection title='最近活动' actions={<button className='btn btn-ghost btn-xs'>查看全部</button>}>
						<ConsoleRecordActivityList activities={contactActivities.slice(0, 3)} />
					</ConsoleRecordSection>
				</>
			}
			aside={
				<>
					<ConsoleRecordSection title='业务上下文'>
						<ConsoleRecordFactList
							columns={1}
							facts={withFactIds([
								{ label: '客户阶段', value: '方案评估' },
								{ label: '关系评分', value: '82 / 100' },
								{ label: '负责人', value: '林洁 · 华东大客户组' },
								{ label: '下次跟进', value: '7 月 18 日 10:00' },
							])}
						/>
					</ConsoleRecordSection>
					<ConsoleRecordSection title='沟通偏好'>
						<div className='flex flex-wrap gap-2'>
							<span className='badge badge-neutral badge-sm'>工作日</span>
							<span className='badge badge-neutral badge-sm'>邮件优先</span>
							<span className='badge badge-neutral badge-sm'>中文</span>
						</div>
					</ConsoleRecordSection>
					<ConsoleRecordSection title='下一步'>
						<div className='flex items-start gap-3 text-sm'>
							<CalendarClock className='text-warning mt-0.5 size-4 shrink-0' />
							<div>
								<div className='font-medium'>产品方案复盘</div>
								<div className='text-base-content/70 mt-1 text-xs'>7 月 18 日 10:00 · 线上会议</div>
							</div>
						</div>
					</ConsoleRecordSection>
				</>
			}
		/>
	);
}

function ContactDetails() {
	return (
		<ConsoleRecordContentLayout
			main={
				<>
					<ConsoleRecordSection title='组织与职责'>
						<ConsoleRecordFactList
							columns={3}
							facts={withFactIds([
								{ label: '公司', value: '示例科技有限公司' },
								{ label: '汇报对象', value: '产品副总裁' },
								{ label: '影响范围', value: '产品与采购委员会' },
								{ label: '员工规模', value: '500–999 人' },
								{ label: '行业', value: '企业软件' },
								{ label: '所在区域', value: '华东' },
							])}
						/>
					</ConsoleRecordSection>
					<ConsoleRecordSection title='备注'>
						<p className='text-sm leading-7'>
							关注跨部门协作效率和数据权限治理。对可视化方案接受度高，采购决策需要信息安全团队共同参与。
						</p>
					</ConsoleRecordSection>
				</>
			}
			aside={
				<ConsoleRecordSection title='审计信息'>
					<ConsoleRecordFactList
						columns={1}
						facts={withFactIds([
							{ label: '记录 ID', value: 'CON-2026-00186' },
							{ label: '来源', value: '市场活动导入' },
							{ label: '创建人', value: '王宁' },
							{ label: '数据授权', value: '已确认' },
						])}
					/>
				</ConsoleRecordSection>
			}
		/>
	);
}

const contactActivities = [
	{
		id: 'meeting',
		title: '完成产品方案会议',
		description: '讨论了权限模型、数据迁移与试点范围。',
		actor: '林洁',
		time: '今天 14:20',
		dateTime: '2026-07-16T14:20:00+08:00',
		icon: <UsersRound className='size-3.5' />,
	},
	{
		id: 'email',
		title: '发送方案与会议纪要',
		description: '已发送第二版方案和下一步工作清单。',
		actor: '林洁',
		time: '昨天 17:45',
		dateTime: '2026-07-15T17:45:00+08:00',
		icon: <Mail className='size-3.5' />,
	},
	{
		id: 'call',
		title: '电话沟通',
		description: '确认采购和信息安全团队将参与下一轮评审。',
		actor: '周远',
		time: '7 月 12 日',
		dateTime: '2026-07-12',
		icon: <Phone className='size-3.5' />,
	},
	{
		id: 'note',
		title: '新增客户备注',
		description: '联系人偏好邮件沟通，避免周一上午安排会议。',
		actor: '系统',
		time: '7 月 10 日',
		dateTime: '2026-07-10',
		icon: <MessageSquareText className='size-3.5' />,
	},
];

function ContactActivity() {
	return (
		<ConsoleRecordContentLayout
			main={
				<ConsoleRecordSection title='全部活动' description='会议、邮件、电话和内部备注。'>
					<ConsoleRecordActivityList activities={contactActivities} />
				</ConsoleRecordSection>
			}
			aside={
				<ConsoleRecordSection title='活动摘要'>
					<ConsoleRecordFactList
						columns={1}
						facts={withFactIds([
							{ label: '最近联系', value: '今天 14:20' },
							{ label: '近 30 天互动', value: 12 },
							{ label: '待办事项', value: 2 },
						])}
					/>
				</ConsoleRecordSection>
			}
		/>
	);
}

function ContactRelated() {
	return (
		<ConsoleRecordContentLayout
			main={
				<>
					<ConsoleRecordSection title='商机'>
						<ConsoleRecordRelatedList
							items={[
								{
									id: 'opp-1',
									title: '企业协作平台升级',
									subtitle: '预计成交：2026 年 8 月',
									meta: '负责人：林洁',
									href: '#opportunity',
									status: <span className='badge badge-warning badge-sm'>方案评估</span>,
								},
							]}
						/>
					</ConsoleRecordSection>
					<ConsoleRecordSection title='订单'>
						<ConsoleRecordRelatedList
							items={[
								{
									id: 'order-1',
									title: '年度服务续订',
									subtitle: 'ORD-2026-00318',
									meta: 'CNY 186,000',
									href: '#order',
									status: <span className='badge badge-success badge-sm'>已完成</span>,
								},
							]}
						/>
					</ConsoleRecordSection>
				</>
			}
			aside={
				<ConsoleRecordSection title='关联摘要'>
					<ConsoleRecordFactList
						columns={1}
						facts={withFactIds([
							{
								label: '公司',
								value: (
									<span className='flex items-center gap-2'>
										<Building2 className='size-4' />
										示例科技有限公司
									</span>
								),
							},
							{
								label: '商机金额',
								value: (
									<span className='flex items-center gap-2'>
										<CircleDollarSign className='size-4' />
										CNY 680,000
									</span>
								),
							},
							{ label: '关联联系人', value: 6 },
							{
								label: '办公地点',
								value: (
									<span className='flex items-center gap-2'>
										<MapPin className='size-4' />
										上海
									</span>
								),
							},
						])}
					/>
				</ConsoleRecordSection>
			}
		/>
	);
}

function withFactIds(facts: Array<Omit<ConsoleRecordFact, 'id'>>): ConsoleRecordFact[] {
	return facts.map((fact, index) => ({
		...fact,
		id: typeof fact.label === 'string' ? fact.label : `fact-${index}`,
	}));
}
