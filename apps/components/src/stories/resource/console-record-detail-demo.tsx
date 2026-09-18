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
	Phone,
	RefreshCw,
	ShieldCheck,
	Tag,
	UserRound,
} from 'lucide-react';
import { useState } from 'react';
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
	ConsoleRecordTabs,
} from '@/resource/console-record-detail';
import {
	type ContactRecord,
	contactActivities,
	contactOpportunities,
	contactOrders,
	initialContactRecord,
} from './console-record-detail-fixtures';

export function ContactRecordDemo() {
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
						<ConsoleRecordRelatedList items={contactOpportunities} />
					</ConsoleRecordSection>
					<ConsoleRecordSection title='订单'>
						<ConsoleRecordRelatedList items={contactOrders} />
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
