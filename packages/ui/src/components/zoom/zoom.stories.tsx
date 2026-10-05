'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { Zoom } from './index';

const sampleImage = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067"><rect width="1600" height="1067" fill="#dbeafe"/><path d="M0 1067 550 250 1100 1067" fill="#60a5fa"/><path d="m600 1067 550-650 450 650" fill="#2563eb"/><circle cx="1250" cy="200" r="100" fill="#fbbf24"/></svg>',
)}`;

const meta = {
	id: 'primitives-zoom',
	title: 'Components/Zoom',
	component: Zoom,
	args: {
		children: <img src={sampleImage} alt='Sample mountain landscape' />,
	},
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'An accessible image zoom primitive with controlled and uncontrolled state, native dialog focus behavior, and no zoom runtime dependency.',
			},
		},
	},
} satisfies Meta<typeof Zoom>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<section className='mx-auto w-full max-w-5xl'>
				<header className='border-base-300 mb-4 border-b pb-4'>
					<div className='text-base-content/70 text-xs font-medium'>MEDIA LIBRARY</div>
					<h1 className='mt-1 text-lg font-semibold'>Sample image</h1>
				</header>
				<div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]'>
					<Zoom className='block overflow-hidden rounded-md'>
						<img
							src={sampleImage}
							alt='Sample mountain landscape'
							className='aspect-[3/2] w-full object-cover'
							width='1600'
							height='1067'
						/>
					</Zoom>
					<dl className='divide-base-300 border-base-300 divide-y border-y text-sm'>
						{[
							['Collection', 'Sample illustrations'],
							['Format', 'SVG'],
							['Resolution', '1600 x 1067'],
							['Status', 'Approved'],
						].map(([label, value]) => (
							<div key={label} className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'>
								<dt className='text-base-content/70'>{label}</dt>
								<dd className='font-medium'>{value}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>
		</main>
	),
};

export const Controlled: Story = {
	render: () => <ControlledZoomExample />,
};

function ControlledZoomExample() {
	const [active, setActive] = useState(false);
	return (
		<main className='bg-base-200 text-base-content grid min-h-screen place-items-center p-5'>
			<div className='w-full max-w-xl'>
				<div className='mb-3 flex items-center justify-between gap-3'>
					<h1 className='text-sm font-semibold'>Selected media</h1>
					<button
						type='button'
						className='border-base-300 bg-base-100 hover:bg-base-200 inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium'
						onClick={() => setActive(true)}
					>
						<Maximize2 className='size-3.5' />
						Open preview
					</button>
				</div>
				<Zoom
					active={active}
					onActiveChange={setActive}
					zoomImg={{ src: sampleImage }}
					className='block overflow-hidden rounded-md'
				>
					<img
						src={sampleImage}
						alt='Sample mountain landscape'
						className='aspect-[16/9] w-full object-cover'
						width='1600'
						height='900'
					/>
				</Zoom>
			</div>
		</main>
	);
}
