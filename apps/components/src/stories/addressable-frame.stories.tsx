'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, ArrowRight, Copy, ExternalLink, FileCode2, Globe2, RotateCw } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useState } from 'react';
import {
	AddressableFrame,
	AddressableFrameActions,
	AddressableFrameAddress,
	AddressableFrameBar,
	AddressableFrameContent,
	AddressableFrameFooter,
	AddressableFrameHeader,
	AddressableFrameNavigation,
} from '../../registry/default/ui/addressable-frame';
import { Status } from '../../registry/default/ui/status';

const browserPages = [
	{
		address: 'https://example.com/schema',
		title: 'Schema Inspector',
		description: 'Resource schema and compatibility details',
		content: 'The schema is valid and compatible with the current resource catalog.',
	},
	{
		address: 'https://example.com/schema/history',
		title: 'Schema History',
		description: 'Recent schema revisions',
		content: 'Revision 18 added lifecycle status and ownership metadata.',
	},
] as const;

function BrowserFrameDemo() {
	const [pageIndex, setPageIndex] = useState(0);
	const [refreshCount, setRefreshCount] = useState(0);
	const [activity, setActivity] = useState('Ready');
	const [activitySequence, setActivitySequence] = useState(0);
	const page = browserPages[pageIndex];
	const announce = (message: string) => {
		setActivity(message);
		setActivitySequence((current) => current + 1);
	};

	return (
		<AddressableFrame className='h-[34rem]' aria-labelledby='browser-frame-title'>
			<AddressableFrameBar>
				<AddressableFrameNavigation aria-label='Browser history'>
					<FrameIconButton
						label='后退'
						disabled={pageIndex === 0}
						onClick={() => {
							const nextIndex = Math.max(0, pageIndex - 1);
							setPageIndex(nextIndex);
							announce(`Opened ${browserPages[nextIndex].title}`);
						}}
					>
						<ArrowLeft className='size-4' />
					</FrameIconButton>
					<FrameIconButton
						label='前进'
						disabled={pageIndex === browserPages.length - 1}
						onClick={() => {
							const nextIndex = Math.min(browserPages.length - 1, pageIndex + 1);
							setPageIndex(nextIndex);
							announce(`Opened ${browserPages[nextIndex].title}`);
						}}
					>
						<ArrowRight className='size-4' />
					</FrameIconButton>
					<FrameIconButton
						label='刷新'
						onClick={() => {
							setRefreshCount((current) => current + 1);
							announce('Refresh requested');
						}}
					>
						<RotateCw className='size-3.5' />
					</FrameIconButton>
				</AddressableFrameNavigation>
				<AddressableFrameAddress icon={<Globe2 className='size-3.5' />} title={page.address}>
					{page.address}
				</AddressableFrameAddress>
				<AddressableFrameActions>
					<FrameIconButton label='请求在新窗口打开' onClick={() => announce('Open requested')}>
						<ExternalLink className='size-3.5' />
					</FrameIconButton>
				</AddressableFrameActions>
			</AddressableFrameBar>
			<AddressableFrameHeader title={page.title} titleId='browser-frame-title' description={page.description} />
			<AddressableFrameContent className='p-4 text-sm leading-6'>{page.content}</AddressableFrameContent>
			<AddressableFrameFooter>
				<Status role='status' aria-live='polite' tone='success' size='xs'>
					{activity}
					<span className='sr-only'> Event {activitySequence}</span>
				</Status>
				<span className='ml-auto'>Refresh {refreshCount}</span>
			</AddressableFrameFooter>
		</AddressableFrame>
	);
}

function FileFrameDemo() {
	const address = 'file:///workspace/schema.prisma';
	const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');
	const [copySequence, setCopySequence] = useState(0);
	const copyAddress = async () => {
		setCopyState('copying');
		setCopySequence((current) => current + 1);
		if (!navigator.clipboard) {
			setCopyState('failed');
			return;
		}
		try {
			await navigator.clipboard.writeText(address);
			setCopyState('copied');
		} catch {
			setCopyState('failed');
		}
	};

	return (
		<AddressableFrame className='h-[34rem]' aria-labelledby='file-frame-title'>
			<AddressableFrameBar>
				<AddressableFrameAddress icon={<FileCode2 className='size-3.5' />} title={address}>
					{address}
				</AddressableFrameAddress>
				<AddressableFrameActions>
					<FrameIconButton label='复制文件地址' onClick={() => void copyAddress()}>
						<Copy className='size-3.5' />
					</FrameIconButton>
				</AddressableFrameActions>
			</AddressableFrameBar>
			<AddressableFrameHeader title='schema.prisma' titleId='file-frame-title' description='Prisma schema · 12 lines' />
			<AddressableFrameContent className='bg-base-200/25 p-4 font-mono text-xs leading-6'>
				<pre>
					<code>{`model Resource {
  id        String   @id
  name      String
  status    String
  ownerId   String
  createdAt DateTime @default(now())
}`}</code>
				</pre>
			</AddressableFrameContent>
			<AddressableFrameFooter>
				<span role='status' aria-live='polite'>
					{copyState === 'copying'
						? 'Copying address'
						: copyState === 'copied'
							? 'Address copied'
							: copyState === 'failed'
								? 'Copy unavailable'
								: 'UTF-8'}
					<span className='sr-only'> Event {copySequence}</span>
				</span>
				<span className='ml-auto'>Prisma</span>
			</AddressableFrameFooter>
		</AddressableFrame>
	);
}

type FrameIconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'title'> & {
	label: string;
	children: ReactNode;
};

function FrameIconButton({ label, children, className, ...props }: FrameIconButtonProps) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			className={`hover:bg-base-300/60 grid size-9 shrink-0 place-items-center rounded disabled:pointer-events-none disabled:opacity-30 sm:size-7 ${className ?? ''}`}
			{...props}
		>
			{children}
		</button>
	);
}

const meta = {
	title: 'UI/Addressable Frame',
	component: AddressableFrame,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Composable chrome for URL, file, object, and other addressable content. Navigation, parsing, loading, and embedded runtimes remain application concerns.',
			},
		},
	},
} satisfies Meta<typeof AddressableFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Frame: Story = {
	render: () => (
		<main className='p-3 sm:p-5'>
			<h1 className='sr-only'>Browser addressable frame</h1>
			<BrowserFrameDemo />
		</main>
	),
};

export const File: Story = {
	render: () => (
		<main className='p-3 sm:p-5'>
			<h1 className='sr-only'>File addressable frame</h1>
			<FileFrameDemo />
		</main>
	),
};
