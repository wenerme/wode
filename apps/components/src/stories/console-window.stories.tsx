'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Database, FileJson, Play, Settings2, SquareTerminal } from 'lucide-react';
import { useState } from 'react';
import {
	ConsoleWindow,
	ConsoleWindowContent,
	ConsoleWindowControls,
	ConsoleWindowStatusBar,
	ConsoleWindowTitleBar,
	ConsoleWindowToolbar,
	ConsoleWindowWorkspace,
} from '../../registry/default/blocks/console-window';
import {
	AddressableFrame,
	AddressableFrameAddress,
	AddressableFrameBar,
	AddressableFrameContent,
	AddressableFrameHeader,
} from '../../registry/default/ui/addressable-frame';

function WindowWorkspaceDemo() {
	const [message, setMessage] = useState('Ready');
	return (
		<main aria-label='Console window workspace'>
			<h1 className='sr-only'>Console window workspace</h1>
			<ConsoleWindowWorkspace>
				<ConsoleWindow
					titleBar={
						<ConsoleWindowTitleBar
							icon={<SquareTerminal className='size-4' />}
							title='Query Console'
							subtitle='core-postgres · readonly'
							controls={
								<ConsoleWindowControls
									onMinimize={() => setMessage('Minimize requested')}
									onMaximize={() => setMessage('Maximize requested')}
									onClose={() => setMessage('Close requested')}
								/>
							}
						/>
					}
					toolbar={
						<ConsoleWindowToolbar>
							<button
								type='button'
								className='bg-neutral text-neutral-content inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs'
								onClick={() => setMessage('Query completed in 42 ms')}
							>
								<Play className='size-3.5' />
								运行
							</button>
							<button
								type='button'
								aria-label='查询设置'
								title='查询设置'
								className='hover:bg-base-200 grid size-7 place-items-center rounded'
							>
								<Settings2 className='size-3.5' />
							</button>
						</ConsoleWindowToolbar>
					}
					statusBar={
						<ConsoleWindowStatusBar>
							<span className='bg-success size-1.5 rounded-full' />
							{message}
							<span className='flex-1' />
							<span>Ln 4, Col 18</span>
						</ConsoleWindowStatusBar>
					}
				>
					<ConsoleWindowContent className='font-mono text-sm leading-7'>
						<div>
							<span className='text-secondary'>select</span> id, name, status
						</div>
						<div>
							<span className='text-secondary'>from</span> service_resource
						</div>
						<div>
							<span className='text-secondary'>where</span> environment ={' '}
							<span className='text-base-content font-medium'>'production'</span>
							{';'}
						</div>
					</ConsoleWindowContent>
				</ConsoleWindow>

				<div className='grid min-h-0 grid-rows-2 gap-3'>
					<ConsoleWindow
						titleBar={
							<ConsoleWindowTitleBar
								icon={<Database className='size-4' />}
								title='Connection'
								controls={<ConsoleWindowControls onClose={() => setMessage('Connection panel closed')} />}
							/>
						}
						statusBar={<ConsoleWindowStatusBar>Healthy · 12 pooled connections</ConsoleWindowStatusBar>}
					>
						<ConsoleWindowContent>
							<dl className='grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
								<dt className='text-base-content/65'>Host</dt>
								<dd>postgres.internal</dd>
								<dt className='text-base-content/65'>Database</dt>
								<dd>platform</dd>
								<dt className='text-base-content/65'>Role</dt>
								<dd>console_readonly</dd>
							</dl>
						</ConsoleWindowContent>
					</ConsoleWindow>
					<AddressableFrame aria-labelledby='json-result-title'>
						<AddressableFrameBar>
							<AddressableFrameAddress
								icon={<FileJson className='size-3.5' />}
								title='https://example.com/api/resources'
							>
								https://example.com/api/resources
							</AddressableFrameAddress>
						</AddressableFrameBar>
						<AddressableFrameHeader title='JSON Result' titleAs='h3' titleId='json-result-title' />
						<AddressableFrameContent>
							<pre className='min-h-full overflow-auto p-3 text-xs leading-5'>
								<code>{`{\n  "items": 128,\n  "healthy": 124,\n  "warning": 3,\n  "offline": 1\n}`}</code>
							</pre>
						</AddressableFrameContent>
					</AddressableFrame>
				</div>
			</ConsoleWindowWorkspace>
		</main>
	);
}

const meta = {
	title: 'Console/Window',
	component: ConsoleWindow,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Controlled visual chrome for tools. Dragging, z-index arbitration, persistence, and portals belong to a separate window runtime.',
			},
		},
	},
} satisfies Meta<typeof ConsoleWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Workspace: Story = {
	render: () => <WindowWorkspaceDemo />,
};
