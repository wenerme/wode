'use client';

import { Activity, BookOpenCheck, Database, FileClock, Gauge, Server, SquareTerminal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Status } from '@/ui/status';
import { type ManagedWindow, useWindowManagerActions } from '@/window/window-manager';

export function WindowManagerStoryContent({ win }: { win: ManagedWindow }) {
	if (win.kind === 'overview') return <OverviewContent />;
	if (win.kind === 'query') return <QueryContent />;
	if (win.kind === 'runbook') return <RunbookContent />;
	if (win.kind === 'audit') return <AuditContent />;
	if (win.kind === 'metrics') return <MetricsContent win={win} />;
	return <div className='p-4'>{win.title}</div>;
}

function OverviewContent() {
	const services = [
		['API gateway', 'Healthy', '12 ms'],
		['PostgreSQL', 'Healthy', '8 ms'],
		['Event stream', 'Delayed', '2.4 s'],
		['Object storage', 'Healthy', '41 ms'],
	];
	return (
		<div className='min-h-full p-4'>
			<div className='grid grid-cols-2 gap-px border md:grid-cols-4'>
				{[
					['Availability', '99.98%'],
					['Requests', '1.82M'],
					['P95 latency', '184 ms'],
					['Open alerts', '3'],
				].map(([label, value]) => (
					<div key={label} className='bg-base-100 p-3'>
						<div className='text-base-content/55 text-[11px]'>{label}</div>
						<div className='mt-1 text-lg font-semibold'>{value}</div>
					</div>
				))}
			</div>
			<div className='mt-4 overflow-hidden border'>
				{services.map(([name, state, latency]) => (
					<div key={name} className='border-base-300 flex items-center gap-3 border-b px-3 py-2.5 last:border-0'>
						<Database className='text-base-content/40 size-4' />
						<span className='min-w-0 flex-1 truncate text-sm'>{name}</span>
						<Status tone={state === 'Delayed' ? 'warning' : 'success'} size='sm'>
							{state}
						</Status>
						<span className='text-base-content/55 w-12 text-right font-mono text-xs'>{latency}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function QueryContent() {
	return (
		<div className='grid min-h-full grid-rows-[minmax(11rem,1fr)_minmax(8rem,0.75fr)]'>
			<pre className='bg-neutral text-neutral-content min-h-0 overflow-auto p-4 font-mono text-xs leading-6'>
				<code>{`select service, region, status, p95_latency_ms\nfrom service_health\nwhere environment = 'production'\norder by p95_latency_ms desc;`}</code>
			</pre>
			<div className='min-h-0 overflow-auto'>
				<table className='table-xs table-pin-rows table'>
					<thead>
						<tr>
							<th>Service</th>
							<th>Region</th>
							<th>Status</th>
							<th className='text-right'>P95</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>events</td>
							<td>ap-east-1</td>
							<td>delayed</td>
							<td className='text-right'>2410</td>
						</tr>
						<tr>
							<td>objects</td>
							<td>ap-southeast-1</td>
							<td>healthy</td>
							<td className='text-right'>184</td>
						</tr>
						<tr>
							<td>gateway</td>
							<td>ap-east-1</td>
							<td>healthy</td>
							<td className='text-right'>96</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}

function RunbookContent() {
	return (
		<div className='p-4'>
			<div className='mb-4 flex items-start gap-3'>
				<div className='bg-info/12 text-info grid size-9 shrink-0 place-items-center rounded-sm'>
					<BookOpenCheck className='size-4' />
				</div>
				<div>
					<h3 className='text-sm font-semibold'>Event stream delay</h3>
					<p className='text-base-content/60 mt-1 text-xs'>Owned by Platform Operations</p>
				</div>
			</div>
			<ol className='space-y-2'>
				{[
					'Confirm consumer lag by region',
					'Inspect the last deployment',
					'Pause non-critical replay jobs',
					'Escalate after 15 minutes',
				].map((step, index) => (
					<li key={step} className='border-base-300 flex gap-3 border-b py-3 text-sm'>
						<span className='bg-base-200 grid size-6 shrink-0 place-items-center rounded-sm text-xs font-semibold'>
							{index + 1}
						</span>
						<span className='pt-0.5'>{step}</span>
					</li>
				))}
			</ol>
		</div>
	);
}

function AuditContent() {
	return (
		<div className='min-h-full overflow-auto'>
			<table className='table-sm table-pin-rows table'>
				<thead>
					<tr>
						<th>Time</th>
						<th>Actor</th>
						<th>Action</th>
						<th>Resource</th>
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: 10 }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic audit fixture rows have no state.
						<tr key={index}>
							<td className='font-mono text-xs'>14:{String(32 - index).padStart(2, '0')}:08</td>
							<td>operator-{(index % 3) + 1}</td>
							<td>{index % 2 ? 'policy.read' : 'service.update'}</td>
							<td>service/ac-{index + 1}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function MetricsContent({ win }: { win: ManagedWindow }) {
	const actions = useWindowManagerActions();
	return (
		<div className='border-primary/30 bg-neutral text-neutral-content flex size-full flex-col overflow-hidden rounded-sm border shadow-xl'>
			<div className='flex h-9 items-center border-b border-white/10 px-3 text-xs'>
				<Activity className='mr-2 size-3.5 text-emerald-400' />
				Live metrics
				<span className='flex-1' />
				<button
					type='button'
					aria-label='Close live metrics'
					className='grid size-7 place-items-center hover:bg-white/10'
					onClick={() => actions.close(win.id)}
				>
					<X className='size-3.5' />
				</button>
			</div>
			<div className='grid flex-1 grid-cols-6 items-end gap-1 px-4 pt-8 pb-4'>
				{[42, 64, 38, 78, 55, 88, 48, 68, 81, 61, 91, 72].map((height) => (
					<div key={height} className='min-h-1 bg-emerald-400/75' style={{ height: `${height}%` }} />
				))}
			</div>
		</div>
	);
}

export function WindowManagerStoryToolbar({ win }: { win: ManagedWindow }) {
	if (win.kind === 'overview')
		return (
			<>
				<Status tone='success' size='sm'>
					Production
				</Status>
				<span className='text-base-content/50 text-xs'>Updated now</span>
			</>
		);
	if (win.kind === 'query')
		return (
			<>
				<button type='button' className='btn btn-neutral btn-xs'>
					<SquareTerminal className='size-3' />
					Run
				</button>
				<span className='text-base-content/50 text-xs'>readonly</span>
			</>
		);
	if (win.kind === 'audit')
		return (
			<>
				<FileClock className='size-3.5' />
				<span className='text-xs'>Last 30 minutes</span>
			</>
		);
	return null;
}

export function WindowManagerStoryStatus({ win }: { win: ManagedWindow }) {
	return (
		<>
			<span className='bg-success size-1.5 rounded-full' />
			<span>{win.kind === 'query' ? 'Connected · 3 rows' : 'Ready'}</span>
			<span className='flex-1' />
			<span>{win.mode}</span>
		</>
	);
}

export function renderWindowManagerStoryIcon(win: ManagedWindow): ReactNode {
	if (win.icon === 'overview') return <Gauge className='size-4' />;
	if (win.icon === 'query') return <SquareTerminal className='size-4' />;
	if (win.icon === 'runbook') return <BookOpenCheck className='size-4' />;
	if (win.icon === 'audit') return <FileClock className='size-4' />;
	if (win.icon === 'metrics') return <Activity className='size-4' />;
	return <Server className='size-4' />;
}
