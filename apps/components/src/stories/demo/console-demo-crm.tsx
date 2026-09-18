'use client';

import { useLiveQuery } from '@tanstack/react-db';
import { Pencil, Plus, RotateCcw } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DataViewLayout, DataViewSearch } from '@/resource/console-data-view';
import { ConsoleCrmDeleteDialog as DeleteDialog } from './console-demo-crm-delete-dialog';
import { CrmSummaryBody } from './console-demo-crm-summary';
import { ContactTable, CustomerTable } from './console-demo-crm-table';
import { useConsoleDemoDataRuntime } from './console-demo-data-runtime';
import type { ContactRecord, CustomerRecord, CustomerStatus } from './console-demo-database';
import { consoleDemoDataset } from './console-demo-dataset';

export type ConsoleCrmPage = 'account' | 'contact';

const demoTenantById = new Map(consoleDemoDataset.tenants.map((record) => [record.id, record]));

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
	const [activeId, setActiveId] = useState<string>();
	const [summaryTab, setSummaryTab] = useState<'overview' | 'relations'>('overview');
	const [pageNumber, setPageNumber] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState<string>();
	const [error, setError] = useState<string>();
	useEffect(() => {
		setSearch('');
		setEditor(undefined);
		setDeleteId(undefined);
		setActiveId(undefined);
		setSummaryTab('overview');
		setPageNumber(1);
		setPageSize(20);
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
	const resultTotal = page === 'account' ? filteredCustomers.length : filteredContacts.length;
	const resultPageCount = Math.max(1, Math.ceil(resultTotal / pageSize));
	const resultPage = Math.min(pageNumber, resultPageCount);
	const resultOffset = (resultPage - 1) * pageSize;
	const visibleCustomers = filteredCustomers.slice(resultOffset, resultOffset + pageSize);
	const visibleContacts = filteredContacts.slice(resultOffset, resultOffset + pageSize);
	const customerById = useMemo(() => new Map(customers.map((record) => [record.id, record])), [customers]);
	const current =
		page === 'account'
			? customers.find((record) => record.id === editor?.id)
			: contacts.find((record) => record.id === editor?.id);
	const active =
		page === 'account'
			? customers.find((record) => record.id === activeId)
			: contacts.find((record) => record.id === activeId);

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
			const currentCustomer = current as CustomerRecord | undefined;
			const tenantId = currentCustomer?.tenantId ?? (consoleDemoDataset.tenants[0]?.id as string);
			const ownerUser = consoleDemoDataset.metaUsers.find(
				(user) => user.id === String(data.get('ownerUserId') ?? '') && user.tenantIds.includes(tenantId),
			);
			if (!ownerUser) throw new Error('客户负责人不属于当前租户');
			const record: CustomerRecord = {
				id: currentCustomer?.id ?? `customer-${crypto.randomUUID()}`,
				tenantId,
				ownerUserId: ownerUser.id,
				name: String(data.get('name') ?? '').trim(),
				owner: ownerUser.name,
				industry: currentCustomer?.industry ?? '其他',
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
		const currentContact = current as ContactRecord | undefined;
		const customerId = String(data.get('customerId') ?? '');
		const customer = customers.find((record) => record.id === customerId);
		if (!customer) throw new Error('联系人必须关联有效客户');
		const record: ContactRecord = {
			id: currentContact?.id ?? `contact-${crypto.randomUUID()}`,
			tenantId: customer.tenantId,
			customerId,
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
		<DataViewLayout.Composite
			aria-busy={pending}
			data-demo-data-page={page}
			header={
				<DataViewLayout.Header
					headingLevel={1}
					title={page === 'account' ? '客户' : '联系人'}
					search={
						<DataViewSearch
							aria-label={`搜索${page === 'account' ? '客户' : '联系人'}`}
							value={search}
							placeholder={`搜索${page === 'account' ? '客户' : '联系人'}`}
							onChange={(event) => {
								setSearch(event.target.value);
								setPageNumber(1);
							}}
							onClear={() => {
								setSearch('');
								setPageNumber(1);
							}}
						/>
					}
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
				/>
			}
			toolbar={
				error || message ? (
					<div
						role={error ? 'alert' : 'status'}
						className={
							error
								? 'bg-error/10 text-error border-error/25 border-b px-3 py-2 text-xs'
								: 'bg-success/10 text-success border-success/25 border-b px-3 py-2 text-xs'
						}
					>
						{error ?? message}
					</div>
				) : undefined
			}
			footer={
				<DataViewLayout.ResourceFooter
					page={resultPage}
					pageSize={pageSize}
					total={resultTotal}
					onPageChange={setPageNumber}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPageNumber(1);
					}}
					status={
						pending ? (
							<span role='status' aria-label='查询状态'>
								处理中
							</span>
						) : undefined
					}
				/>
			}
			summaryOpen={Boolean(active)}
			onSummaryClose={() => setActiveId(undefined)}
			summary={
				active ? (
					<DataViewLayout.Summary
						aria-label={page === 'account' ? '客户概要' : '联系人概要'}
						title={active.name}
						description={
							page === 'account'
								? (active as CustomerRecord).owner
								: customerById.get((active as ContactRecord).customerId)?.name
						}
						tabs={[
							{ value: 'overview', label: '概要' },
							{ value: 'relations', label: page === 'account' ? '联系人' : '联系信息' },
						]}
						value={summaryTab}
						onValueChange={setSummaryTab}
						onClose={() => setActiveId(undefined)}
						footerInfo={`更新于 ${new Date(active.updatedAt).toLocaleString('zh-CN')}`}
						footerActions={
							<button
								type='button'
								className='btn btn-ghost btn-xs'
								onClick={() => setEditor({ kind: 'edit', id: active.id })}
							>
								<Pencil className='size-3.5' />
								编辑
							</button>
						}
					>
						<CrmSummaryBody
							page={page}
							record={active}
							tab={summaryTab}
							contacts={contacts}
							customerById={customerById}
							tenantById={demoTenantById}
						/>
					</DataViewLayout.Summary>
				) : undefined
			}
		>
			{page === 'account' ? (
				<CustomerTable
					records={visibleCustomers}
					contacts={contacts}
					pending={pending}
					activeId={activeId}
					onActiveIdChange={setActiveId}
					onEdit={(id) => setEditor({ kind: 'edit', id })}
					onDelete={setDeleteId}
				/>
			) : (
				<ContactTable
					records={visibleContacts}
					customerById={customerById}
					pending={pending}
					activeId={activeId}
					onActiveIdChange={setActiveId}
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
		</DataViewLayout.Composite>
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
	const currentCustomer = page === 'account' ? (current as CustomerRecord | undefined) : undefined;
	const customerTenantId = currentCustomer?.tenantId ?? (consoleDemoDataset.tenants[0]?.id as string);
	const availableOwnerUsers = consoleDemoDataset.metaUsers.filter((user) => user.tenantIds.includes(customerTenantId));
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
								<select
									name='ownerUserId'
									className='select select-bordered w-full'
									defaultValue={currentCustomer?.ownerUserId ?? availableOwnerUsers[0]?.id}
									required
								>
									{availableOwnerUsers.map((user) => (
										<option key={user.id} value={user.id}>
											{user.name}
										</option>
									))}
								</select>
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
