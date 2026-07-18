'use client';

import { useLiveQuery } from '@tanstack/react-db';
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConsolePage } from '../../registry/default/blocks/console-shell';
import { Status } from '../../registry/default/ui/status';
import { ConsoleCrmDeleteDialog as DeleteDialog } from './console-demo-crm-delete-dialog';
import { useConsoleDemoDataRuntime } from './console-demo-data-runtime';
import type { ContactRecord, CustomerRecord, CustomerStatus } from './console-demo-database';

export type ConsoleCrmPage = 'account' | 'contact';

export function ConsoleCrmDemo({ page }: { page: ConsoleCrmPage }) {
	const runtime = useConsoleDemoDataRuntime();
	const customersQuery = useLiveQuery(
		(query) => query.from({ customer: runtime.customers }).orderBy(({ customer }) => customer.name),
		[runtime.customers],
	);
	const contactsQuery = useLiveQuery(
		(query) => query.from({ contact: runtime.contacts }).orderBy(({ contact }) => contact.name),
		[runtime.contacts],
	);
	const customers = customersQuery.data ?? [];
	const contacts = contactsQuery.data ?? [];
	const [search, setSearch] = useState('');
	const [editor, setEditor] = useState<{ kind: 'create' | 'edit'; id?: string }>();
	const [deleteId, setDeleteId] = useState<string>();
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState<string>();
	const [error, setError] = useState<string>();
	useEffect(() => {
		setSearch('');
		setEditor(undefined);
		setDeleteId(undefined);
		setMessage(undefined);
		setError(undefined);
	}, [page]);
	const query = search.trim().toLocaleLowerCase();
	const filteredCustomers = useMemo(
		() => customers.filter((record) => !query || `${record.name} ${record.owner}`.toLocaleLowerCase().includes(query)),
		[customers, query],
	);
	const filteredContacts = useMemo(
		() =>
			contacts.filter(
				(record) => !query || `${record.name} ${record.email} ${record.role}`.toLocaleLowerCase().includes(query),
			),
		[contacts, query],
	);
	const customerById = useMemo(() => new Map(customers.map((record) => [record.id, record])), [customers]);
	const current =
		page === 'account'
			? customers.find((record) => record.id === editor?.id)
			: contacts.find((record) => record.id === editor?.id);

	const execute = async (operation: () => Promise<unknown>, success: string) => {
		setPending(true);
		setError(undefined);
		try {
			await operation();
			setMessage(success);
			setEditor(undefined);
			setDeleteId(undefined);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : '操作失败');
		} finally {
			setPending(false);
		}
	};

	const reset = () => execute(() => runtime.reset(), '演示数据已重置');
	const save = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		if (page === 'account') {
			const record: CustomerRecord = {
				id: current?.id ?? crypto.randomUUID(),
				name: String(data.get('name') ?? '').trim(),
				owner: String(data.get('owner') ?? '').trim(),
				status: String(data.get('status')) as CustomerStatus,
				updatedAt: new Date().toISOString(),
			};
			void execute(
				async () => {
					const transaction = current
						? runtime.customers.update(record.id, (draft) => Object.assign(draft, record))
						: runtime.customers.insert(record);
					await transaction.isPersisted.promise;
				},
				current ? '客户已更新' : '客户已创建',
			);
			return;
		}
		const record: ContactRecord = {
			id: current?.id ?? crypto.randomUUID(),
			customerId: String(data.get('customerId') ?? ''),
			name: String(data.get('name') ?? '').trim(),
			role: String(data.get('role') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			phone: String(data.get('phone') ?? '').trim(),
			updatedAt: new Date().toISOString(),
		};
		void execute(
			async () => {
				const transaction = current
					? runtime.contacts.update(record.id, (draft) => Object.assign(draft, record))
					: runtime.contacts.insert(record);
				await transaction.isPersisted.promise;
			},
			current ? '联系人已更新' : '联系人已创建',
		);
	};

	const remove = () => {
		if (!deleteId) return;
		void execute(
			async () => {
				const transaction = page === 'account' ? runtime.customers.delete(deleteId) : runtime.contacts.delete(deleteId);
				await transaction.isPersisted.promise;
			},
			page === 'account' ? '客户及其联系人已删除' : '联系人已删除',
		);
	};

	return (
		<ConsolePage
			title={page === 'account' ? '客户' : '联系人'}
			description={page === 'account' ? 'IndexedDB 持久化的客户档案与联系人数量。' : '维护联系人及其所属客户关系。'}
			actions={
				<>
					<button type='button' className='btn btn-ghost btn-sm' disabled={pending} onClick={() => void reset()}>
						<RotateCcw aria-hidden='true' className='size-4' />
						重置演示数据
					</button>
					<button
						type='button'
						className='btn btn-neutral btn-sm'
						disabled={pending || (page === 'contact' && customers.length === 0)}
						onClick={() => setEditor({ kind: 'create' })}
					>
						<Plus aria-hidden='true' className='size-4' />
						新建{page === 'account' ? '客户' : '联系人'}
					</button>
				</>
			}
		>
			<div className='mb-4 flex flex-wrap items-center gap-3'>
				<label className='input input-bordered flex h-9 min-w-52 flex-1 items-center gap-2 sm:max-w-sm'>
					<Search aria-hidden='true' className='size-4 opacity-55' />
					<input
						aria-label={`搜索${page === 'account' ? '客户' : '联系人'}`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className='min-w-0 flex-1'
					/>
				</label>
				<span className='text-base-content/55 text-xs'>
					{page === 'account' ? filteredCustomers.length : filteredContacts.length} 条记录
				</span>
			</div>
			{error ? (
				<div role='alert' className='alert alert-error mb-4 text-sm'>
					{error}
				</div>
			) : null}
			{message ? (
				<div role='status' className='alert alert-success mb-4 text-sm'>
					{message}
				</div>
			) : null}
			{page === 'account' ? (
				<CustomerTable
					records={filteredCustomers}
					contacts={contacts}
					pending={pending}
					onEdit={(id) => setEditor({ kind: 'edit', id })}
					onDelete={setDeleteId}
				/>
			) : (
				<ContactTable
					records={filteredContacts}
					customerById={customerById}
					pending={pending}
					onEdit={(id) => setEditor({ kind: 'edit', id })}
					onDelete={setDeleteId}
				/>
			)}
			{editor ? (
				<EditorDialog
					page={page}
					current={current}
					customers={customers}
					pending={pending}
					onCancel={() => setEditor(undefined)}
					onSubmit={save}
				/>
			) : null}
			{deleteId ? (
				<DeleteDialog page={page} pending={pending} onCancel={() => setDeleteId(undefined)} onConfirm={remove} />
			) : null}
		</ConsolePage>
	);
}

function CustomerTable({
	records,
	contacts,
	pending,
	onEdit,
	onDelete,
}: {
	records: CustomerRecord[];
	contacts: ContactRecord[];
	pending: boolean;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<div className='border-base-300 overflow-x-auto border-y'>
			<table className='table-sm table min-w-[44rem]'>
				<thead>
					<tr>
						<th>客户</th>
						<th>负责人</th>
						<th>状态</th>
						<th>联系人</th>
						<th>
							<span className='sr-only'>操作</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{records.map((record) => (
						<tr key={record.id}>
							<td className='font-medium'>{record.name}</td>
							<td>{record.owner}</td>
							<td>
								<CustomerStatusBadge status={record.status} />
							</td>
							<td>{contacts.filter((contact) => contact.customerId === record.id).length}</td>
							<td>
								<RowActions
									label={record.name}
									pending={pending}
									onEdit={() => onEdit(record.id)}
									onDelete={() => onDelete(record.id)}
								/>
							</td>
						</tr>
					))}
					{records.length === 0 ? (
						<tr>
							<td colSpan={5} className='text-base-content/55 py-10 text-center'>
								没有匹配的客户
							</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}

function ContactTable({
	records,
	customerById,
	pending,
	onEdit,
	onDelete,
}: {
	records: ContactRecord[];
	customerById: Map<string, CustomerRecord>;
	pending: boolean;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<div className='border-base-300 overflow-x-auto border-y'>
			<table className='table-sm table min-w-[48rem]'>
				<thead>
					<tr>
						<th>联系人</th>
						<th>客户</th>
						<th>职位</th>
						<th>Email</th>
						<th>
							<span className='sr-only'>操作</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{records.map((record) => (
						<tr key={record.id}>
							<td className='font-medium'>{record.name}</td>
							<td>{customerById.get(record.customerId)?.name ?? '客户已删除'}</td>
							<td>{record.role}</td>
							<td>{record.email}</td>
							<td>
								<RowActions
									label={record.name}
									pending={pending}
									onEdit={() => onEdit(record.id)}
									onDelete={() => onDelete(record.id)}
								/>
							</td>
						</tr>
					))}
					{records.length === 0 ? (
						<tr>
							<td colSpan={5} className='text-base-content/55 py-10 text-center'>
								没有匹配的联系人
							</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
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

function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
	const values = { active: ['success', '正常'], prospect: ['warning', '潜在'], inactive: ['neutral', '停用'] } as const;
	return (
		<Status tone={values[status][0]} size='xs'>
			{values[status][1]}
		</Status>
	);
}

function EditorDialog({
	page,
	current,
	customers,
	pending,
	onCancel,
	onSubmit,
}: {
	page: ConsoleCrmPage;
	current?: CustomerRecord | ContactRecord;
	customers: CustomerRecord[];
	pending: boolean;
	onCancel: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
		return () => dialog.close();
	}, []);
	return (
		<dialog
			ref={dialogRef}
			aria-label={`${current ? '编辑' : '新建'}${page === 'account' ? '客户' : '联系人'}`}
			className='modal'
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
		>
			<div className='modal-box max-w-lg'>
				<h2 className='text-base font-semibold'>
					{current ? '编辑' : '新建'}
					{page === 'account' ? '客户' : '联系人'}
				</h2>
				<form className='mt-5 space-y-4' onSubmit={onSubmit}>
					<label className='form-control block'>
						<span className='label px-0 text-sm'>{page === 'account' ? '客户名称' : '联系人姓名'}</span>
						<input
							autoFocus
							name='name'
							className='input input-bordered w-full'
							defaultValue={current?.name}
							required
						/>
					</label>
					{page === 'account' ? (
						<>
							<label className='form-control block'>
								<span className='label px-0 text-sm'>负责人</span>
								<input
									name='owner'
									className='input input-bordered w-full'
									defaultValue={(current as CustomerRecord | undefined)?.owner}
									required
								/>
							</label>
							<label className='form-control block'>
								<span className='label px-0 text-sm'>状态</span>
								<select
									name='status'
									className='select select-bordered w-full'
									defaultValue={(current as CustomerRecord | undefined)?.status ?? 'prospect'}
								>
									<option value='active'>正常</option>
									<option value='prospect'>潜在</option>
									<option value='inactive'>停用</option>
								</select>
							</label>
						</>
					) : (
						<ContactFields current={current as ContactRecord | undefined} customers={customers} />
					)}
					<div className='modal-action'>
						<button type='button' className='btn btn-ghost' disabled={pending} onClick={onCancel}>
							取消
						</button>
						<button type='submit' className='btn btn-neutral' disabled={pending}>
							保存{page === 'account' ? '客户' : '联系人'}
						</button>
					</div>
				</form>
			</div>
		</dialog>
	);
}

function ContactFields({ current, customers }: { current?: ContactRecord; customers: CustomerRecord[] }) {
	return (
		<>
			<label className='form-control block'>
				<span className='label px-0 text-sm'>所属客户</span>
				<select
					name='customerId'
					className='select select-bordered w-full'
					defaultValue={current?.customerId ?? customers[0]?.id}
					required
				>
					{customers.map((customer) => (
						<option key={customer.id} value={customer.id}>
							{customer.name}
						</option>
					))}
				</select>
			</label>
			<label className='form-control block'>
				<span className='label px-0 text-sm'>职位</span>
				<input name='role' className='input input-bordered w-full' defaultValue={current?.role} required />
			</label>
			<label className='form-control block'>
				<span className='label px-0 text-sm'>Email</span>
				<input
					name='email'
					type='email'
					className='input input-bordered w-full'
					defaultValue={current?.email}
					required
				/>
			</label>
			<label className='form-control block'>
				<span className='label px-0 text-sm'>电话</span>
				<input name='phone' className='input input-bordered w-full' defaultValue={current?.phone} required />
			</label>
		</>
	);
}
