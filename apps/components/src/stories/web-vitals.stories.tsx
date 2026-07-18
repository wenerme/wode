'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, MousePointerClick } from 'lucide-react';
import { useCallback, useState } from 'react';
import { type WebVitalMetric, WebVitals } from '../../registry/default/ui/web-vitals';
import { cn } from '../lib/utils';

const meta = {
	title: 'Utilities/Web Vitals',
	component: WebVitals,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'A headless Core Web Vitals collector that loads its runtime on demand and reports through a callback or browser event.',
			},
		},
	},
} satisfies Meta<typeof WebVitals>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reporter: Story = {
	render: () => <WebVitalsReporterDemo />,
};

export const Disabled: Story = {
	render: () => (
		<main className='bg-base-200 text-base-content grid min-h-screen place-items-center p-5'>
			<WebVitals enabled={false} />
			<div className='border-base-300 bg-base-100 flex w-full max-w-md items-center gap-3 border px-4 py-3'>
				<span className='bg-base-200 grid size-9 place-items-center rounded-md'>
					<Activity className='size-4' />
				</span>
				<div className='min-w-0 flex-1'>
					<h1 className='text-sm font-semibold'>Collection disabled</h1>
					<div className='text-base-content/70 mt-0.5 text-xs'>No performance collector is scheduled.</div>
				</div>
				<span className='badge badge-ghost badge-sm'>Off</span>
			</div>
		</main>
	),
};

const metricNames: WebVitalMetric['name'][] = ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'];

function WebVitalsReporterDemo() {
	const [metrics, setMetrics] = useState<Partial<Record<WebVitalMetric['name'], WebVitalMetric>>>({});
	const [interactionCount, setInteractionCount] = useState(0);
	const onMetric = useCallback((metric: WebVitalMetric) => {
		setMetrics((current) => ({ ...current, [metric.name]: metric }));
	}, []);
	const collected = Object.keys(metrics).length;

	return (
		<main data-console-density='' className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<WebVitals loadStrategy='immediate' reportAllChanges onMetric={onMetric} />
			<section className='mx-auto w-full max-w-4xl'>
				<header className='border-base-300 flex flex-wrap items-start justify-between gap-3 border-b pb-4'>
					<div>
						<div className='text-base-content/70 text-xs font-medium'>OBSERVABILITY</div>
						<h1 className='mt-1 text-lg font-semibold'>Page performance</h1>
					</div>
					<div className='flex items-center gap-2'>
						<span className='badge badge-success badge-sm'>Collecting</span>
						<span className='text-base-content/70 text-xs tabular-nums'>{collected} / 5</span>
					</div>
				</header>

				<div className='border-base-300 bg-base-100 mt-5 overflow-x-auto border'>
					<table className='w-full border-collapse text-left text-sm'>
						<thead className='bg-base-200 text-base-content/70 text-xs'>
							<tr className='border-base-300 border-b'>
								<th className='px-3 py-2 font-medium'>Metric</th>
								<th className='px-3 py-2 font-medium'>Value</th>
								<th className='hidden px-3 py-2 font-medium sm:table-cell'>Delta</th>
								<th className='px-3 py-2 font-medium'>Rating</th>
							</tr>
						</thead>
						<tbody className='divide-base-300 divide-y'>
							{metricNames.map((name) => {
								const metric = metrics[name];
								return (
									<tr key={name}>
										<td className='px-3 py-3 font-semibold'>{name}</td>
										<td className='px-3 py-3 font-mono tabular-nums'>{formatMetricValue(name, metric?.value)}</td>
										<td className='text-base-content/70 hidden px-3 py-3 font-mono tabular-nums sm:table-cell'>
											{formatMetricValue(name, metric?.delta)}
										</td>
										<td className='px-3 py-3'>{metric ? <MetricRating rating={metric.rating} /> : 'Pending'}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<footer className='border-base-300 mt-5 flex items-center justify-between gap-3 border-t pt-4'>
					<span className='text-base-content/70 text-xs tabular-nums'>Interactions: {interactionCount}</span>
					<button
						type='button'
						className='bg-neutral text-neutral-content inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium'
						onClick={() => setInteractionCount((count) => count + 1)}
					>
						<MousePointerClick className='size-3.5' />
						Record interaction
					</button>
				</footer>
			</section>
		</main>
	);
}

function formatMetricValue(name: WebVitalMetric['name'], value?: number) {
	if (value === undefined) return '-';
	return name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`;
}

function MetricRating({ rating }: { rating: WebVitalMetric['rating'] }) {
	return (
		<span
			className={cn(
				'badge badge-sm',
				rating === 'good' && 'badge-success',
				rating === 'needs-improvement' && 'badge-warning',
				rating === 'poor' && 'badge-error',
			)}
		>
			{rating}
		</span>
	);
}
