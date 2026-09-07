import type { ContactRecord, CustomerRecord, TenantRecord } from './console-demo-resource-schema';
import type { ConsoleCrmPage } from './console-demo-crm';

export function CrmSummaryBody({
	page,
	record,
	tab,
	contacts,
	customerById,
	tenantById,
}: {
	page: ConsoleCrmPage;
	record: CustomerRecord | ContactRecord;
	tab: 'overview' | 'relations';
	contacts: ContactRecord[];
	customerById: Map<string, CustomerRecord>;
	tenantById: Map<string, TenantRecord>;
}) {
	if (page === 'account') {
		const customer = record as CustomerRecord;
		if (tab === 'relations') {
			const related = contacts.filter((contact) => contact.customerId === customer.id);
			return related.length ? (
				<ul className='divide-base-300 divide-y text-sm'>
					{related.map((contact) => (
						<li key={contact.id} className='py-2'>
							<div className='font-medium'>{contact.name}</div>
							<div className='text-base-content/55 text-xs'>{contact.role}</div>
						</li>
					))}
				</ul>
			) : (
				<div className='text-base-content/55 text-sm'>暂无联系人</div>
			);
		}
		return (
			<SummaryFacts
				rows={[
					['负责人', customer.owner],
					['行业', customer.industry],
					['租户', tenantById.get(customer.tenantId)?.name ?? '租户已删除'],
					['状态', customer.status],
					['联系人', String(contacts.filter((contact) => contact.customerId === customer.id).length)],
				]}
			/>
		);
	}

	const contact = record as ContactRecord;
	if (tab === 'relations')
		return (
			<SummaryFacts
				rows={[
					['Email', contact.email],
					['电话', contact.phone],
				]}
			/>
		);
	return (
		<SummaryFacts
			rows={[
				['所属客户', customerById.get(contact.customerId)?.name ?? '客户已删除'],
				['所属租户', tenantById.get(contact.tenantId)?.name ?? '租户已删除'],
				['职位', contact.role],
			]}
		/>
	);
}

function SummaryFacts({ rows }: { rows: Array<[string, string]> }) {
	return (
		<dl className='grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
			{rows.map(([label, value]) => (
				<div key={label} className='contents'>
					<dt className='text-base-content/55'>{label}</dt>
					<dd className='break-words'>{value}</dd>
				</div>
			))}
		</dl>
	);
}
