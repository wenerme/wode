import { Pencil, Trash2 } from 'lucide-react';
import { DataViewLayout, type DataViewColumn } from '@/resource/console-data-view';
import { Status } from '@/ui/status';
import type { ContactRecord, CustomerRecord, CustomerStatus } from './console-demo-database';

type TableActionProps = {
	pending: boolean;
	activeId?: string;
	onActiveIdChange: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
};

export type CustomerTableProps = TableActionProps & {
	records: CustomerRecord[];
	contacts: ContactRecord[];
};

export function CustomerTable({
	records,
	contacts,
	pending,
	activeId,
	onActiveIdChange,
	onEdit,
	onDelete,
}: CustomerTableProps) {
	const columns: readonly DataViewColumn<CustomerRecord>[] = [
		{
			id: 'name',
			label: '客户',
			hideable: false,
			width: '15rem',
			cell: (record) => <span className='font-medium'>{record.name}</span>,
		},
		{ id: 'owner', label: '负责人', width: '10rem', cell: (record) => record.owner },
		{ id: 'status', label: '状态', width: '8rem', cell: (record) => <CustomerStatus status={record.status} /> },
		{
			id: 'contacts',
			label: '联系人',
			width: '7rem',
			cell: (record) => contacts.filter((contact) => contact.customerId === record.id).length,
		},
		{
			id: 'actions',
			label: '操作',
			hideable: false,
			align: 'end',
			width: '5rem',
			cell: (record) => (
				<RowActions
					label={record.name}
					pending={pending}
					onEdit={() => onEdit(record.id)}
					onDelete={() => onDelete(record.id)}
				/>
			),
		},
	];
	return (
		<DataViewLayout.Table
			aria-label='客户列表'
			rows={records}
			columns={columns}
			getRowId={(record) => record.id}
			getRowLabel={(record) => record.name}
			activeId={activeId}
			onActiveIdChange={onActiveIdChange}
			empty={<EmptyState>没有匹配的客户</EmptyState>}
		/>
	);
}

export type ContactTableProps = TableActionProps & {
	records: ContactRecord[];
	customerById: Map<string, CustomerRecord>;
};

export function ContactTable({
	records,
	customerById,
	pending,
	activeId,
	onActiveIdChange,
	onEdit,
	onDelete,
}: ContactTableProps) {
	const columns: readonly DataViewColumn<ContactRecord>[] = [
		{
			id: 'name',
			label: '联系人',
			hideable: false,
			width: '12rem',
			cell: (record) => <span className='font-medium'>{record.name}</span>,
		},
		{
			id: 'customer',
			label: '客户',
			width: '13rem',
			cell: (record) => customerById.get(record.customerId)?.name ?? '客户已删除',
		},
		{ id: 'role', label: '职位', width: '11rem', cell: (record) => record.role },
		{ id: 'email', label: 'Email', width: '15rem', cell: (record) => record.email },
		{
			id: 'actions',
			label: '操作',
			hideable: false,
			align: 'end',
			width: '5rem',
			cell: (record) => (
				<RowActions
					label={record.name}
					pending={pending}
					onEdit={() => onEdit(record.id)}
					onDelete={() => onDelete(record.id)}
				/>
			),
		},
	];
	return (
		<DataViewLayout.Table
			aria-label='联系人列表'
			rows={records}
			columns={columns}
			getRowId={(record) => record.id}
			getRowLabel={(record) => record.name}
			activeId={activeId}
			onActiveIdChange={onActiveIdChange}
			empty={<EmptyState>没有匹配的联系人</EmptyState>}
		/>
	);
}

function EmptyState({ children }: { children: string }) {
	return <div className='text-base-content/55 py-12 text-center'>{children}</div>;
}

function RowActions({
	label,
	pending,
	onEdit,
	onDelete,
}: {
	label: string;
	pending: boolean;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className='flex justify-end gap-1'>
			<button
				type='button'
				aria-label={`编辑 ${label}`}
				className='btn btn-ghost btn-xs btn-square'
				disabled={pending}
				onClick={onEdit}
			>
				<Pencil className='size-3.5' />
			</button>
			<button
				type='button'
				aria-label={`删除 ${label}`}
				className='btn btn-ghost btn-xs btn-square text-error'
				disabled={pending}
				onClick={onDelete}
			>
				<Trash2 className='size-3.5' />
			</button>
		</div>
	);
}

function CustomerStatus({ status }: { status: CustomerStatus }) {
	const values = { active: ['success', '正常'], prospect: ['warning', '潜在'], inactive: ['neutral', '停用'] } as const;
	return (
		<Status tone={values[status][0]} size='xs'>
			{values[status][1]}
		</Status>
	);
}
