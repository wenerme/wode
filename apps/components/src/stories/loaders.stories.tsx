import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
	Loader,
	type LoaderSize,
	type LoaderVariant,
	LoadingIndicator,
	LoadingOverlay,
	LoadingRows,
	PendingButton,
	Skeleton,
} from '../../registry/default/ui/loaders';

const meta = {
	title: 'Utilities/Loaders',
	component: Loader,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Accessible inline loaders, pending buttons, page and section fallbacks, local overlays, and deterministic list/table skeletons.',
			},
		},
	},
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: LoaderVariant[] = ['spinner', 'dots', 'bars', 'ring'];
const sizes: LoaderSize[] = ['xs', 'sm', 'md', 'lg'];

export const Variants: Story = {
	render: () => (
		<main className='mx-auto min-h-screen w-full max-w-5xl p-4 md:p-8'>
			<header className='border-base-300 border-b pb-5'>
				<h1 className='text-xl font-semibold'>Loading indicators</h1>
				<p className='text-base-content/65 mt-1 text-sm'>Current color, four motion styles, and stable size steps.</p>
			</header>
			<div className='border-base-300 bg-base-300 mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border md:grid-cols-4'>
				{variants.map((variant) => (
					<section key={variant} className='bg-base-100 min-w-0 p-4'>
						<h2 className='text-sm font-semibold capitalize'>{variant}</h2>
						<div className='text-primary mt-5 flex min-h-16 items-center justify-between gap-3'>
							{sizes.map((size) => (
								<Loader key={size} label={`${variant} ${size}`} size={size} variant={variant} />
							))}
						</div>
					</section>
				))}
			</div>
		</main>
	),
};

export const OperationalPatterns: Story = {
	render: () => <OperationalLoadingDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.loadingPlay = 'running';
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Reset pending state' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Finish refresh' }));
		const idleButton = canvas.getByRole('button', { name: 'Save changes' });
		const idleWidth = idleButton.getBoundingClientRect().width;
		await userEvent.click(idleButton);
		const pendingButton = canvas.getByRole('button', { name: 'Saving changes' });
		await expect(pendingButton).toBeDisabled();
		await expect(Math.abs(pendingButton.getBoundingClientRect().width - idleWidth)).toBeLessThan(0.5);
		await userEvent.click(canvas.getByRole('button', { name: 'Reset pending state' }));
		await expect(canvas.getByRole('button', { name: 'Save changes' })).toBeEnabled();

		await userEvent.click(canvas.getByRole('button', { name: 'Refresh inventory' }));
		await expect(canvas.getByText('Refreshing inventory').closest('[role="status"]')).toBeInTheDocument();
		const coveredContent = canvasElement.querySelector('[data-slot="loading-overlay-content"]');
		await expect(coveredContent).toHaveAttribute('inert');
		await expect(coveredContent).toHaveAttribute('aria-hidden', 'true');
		await userEvent.click(canvas.getByRole('button', { name: 'Finish refresh' }));
		await expect(canvas.queryByText('Refreshing inventory')).not.toBeInTheDocument();
		canvasElement.dataset.loadingPlay = 'complete';
	},
};

export const PageFallback: Story = {
	render: () => (
		<main className='bg-base-100 min-h-screen'>
			<header className='border-base-300 flex h-14 items-center border-b px-5 text-sm font-semibold'>Operations</header>
			<LoadingIndicator
				description='Connecting to the service catalog'
				label='Preparing workspace'
				layout='page'
				size='lg'
				variant='dots'
			/>
		</main>
	),
};

function OperationalLoadingDemo() {
	const [pending, setPending] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	return (
		<main className='mx-auto min-h-screen w-full max-w-6xl p-4 md:p-8'>
			<header className='border-base-300 border-b pb-5'>
				<h1 className='text-xl font-semibold'>Operational loading patterns</h1>
				<p className='text-base-content/65 mt-1 text-sm'>
					Use motion for short waits and skeletons where layout is already known.
				</p>
			</header>

			<section className='border-base-300 grid gap-5 border-b py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
				<div>
					<h2 className='text-sm font-semibold'>Inline and pending actions</h2>
					<div className='mt-3 flex flex-wrap items-center gap-3'>
						<LoadingIndicator label='Checking permissions' layout='inline' size='sm' variant='ring' />
						<PendingButton
							className='btn-primary'
							pending={pending}
							pendingLabel='Saving changes'
							onClick={() => setPending(true)}
						>
							Save changes
						</PendingButton>
					</div>
				</div>
				<button className='btn btn-ghost btn-sm justify-self-start' type='button' onClick={() => setPending(false)}>
					Reset pending state
				</button>
			</section>

			<section className='border-base-300 py-6'>
				<div className='flex flex-wrap items-end justify-between gap-3'>
					<div>
						<h2 className='text-sm font-semibold'>Local refresh overlay</h2>
						<p className='text-base-content/65 mt-1 text-xs'>
							The existing surface keeps its dimensions while controls become inert.
						</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						<button className='btn btn-outline btn-sm' type='button' onClick={() => setRefreshing(true)}>
							Refresh inventory
						</button>
						<button className='btn btn-ghost btn-sm' type='button' onClick={() => setRefreshing(false)}>
							Finish refresh
						</button>
					</div>
				</div>
				<LoadingOverlay
					active={refreshing}
					className='border-base-300 mt-4 overflow-hidden rounded-md border'
					contentClassName='min-h-52'
					description='Keeping the current rows in place'
					label='Refreshing inventory'
				>
					<div className='border-base-300 bg-base-200/70 grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b px-4 py-2 text-xs font-semibold sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.75fr)]'>
						<span>Service</span>
						<span className='hidden sm:block'>Region</span>
						<span>State</span>
					</div>
					{['Gateway API', 'Event worker', 'Search index'].map((name, index) => (
						<div
							key={name}
							className='border-base-300 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.75fr)]'
						>
							<span className='font-medium'>{name}</span>
							<span className='text-base-content/65 col-start-1 row-start-2 text-xs sm:col-start-auto sm:row-start-auto sm:text-sm'>
								{index === 1 ? 'Singapore' : 'Shanghai'}
							</span>
							<span className='text-success col-start-2 row-start-1 font-medium sm:col-start-auto sm:row-start-auto'>
								Healthy
							</span>
						</div>
					))}
				</LoadingOverlay>
			</section>

			<div className='grid gap-6 py-6 lg:grid-cols-2'>
				<section className='min-w-0'>
					<h2 className='text-sm font-semibold'>List skeleton</h2>
					<LoadingRows className='border-base-300 mt-3 overflow-hidden rounded-md border' rows={4} />
				</section>
				<section className='min-w-0'>
					<h2 className='text-sm font-semibold'>Table skeleton</h2>
					<LoadingRows
						className='border-base-300 mt-3 overflow-hidden rounded-md border'
						columns={3}
						rows={4}
						variant='table'
					/>
				</section>
			</div>

			<section className='border-base-300 border-t py-6'>
				<h2 className='text-sm font-semibold'>Primitive skeletons</h2>
				<div className='mt-3 flex items-center gap-3'>
					<Skeleton shape='circle' />
					<div className='min-w-0 flex-1 space-y-2'>
						<Skeleton className='w-2/5' />
						<Skeleton className='h-3 w-4/5' />
					</div>
				</div>
			</section>
		</main>
	);
}
