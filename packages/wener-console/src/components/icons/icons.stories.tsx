import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionIcon, AppletIcon } from './ActionIcon';
import { FileExtIcon } from './FileExtIcon';
import { FileTypeIcon } from './FileTypeIcon';

const meta: Meta = {
	title: 'components/icons',
	parameters: {
		layout: 'padded',
	},
};

export default meta;

const IconGrid: React.FC<{ icons: Record<string, React.ComponentType<any>>; title: string }> = ({ icons, title }) => (
	<div className='space-y-4'>
		<h2 className='text-xl font-semibold'>{title}</h2>
		<div className='grid grid-cols-6 gap-4'>
			{Object.entries(icons).map(([name, Icon]) => (
				<div key={name} className='flex flex-col items-center space-y-2 rounded-lg border p-4'>
					<Icon className='h-6 w-6' />
					<span className='text-center font-mono text-sm'>{name}</span>
				</div>
			))}
		</div>
	</div>
);

export const AllIcons: StoryObj = {
	render: () => (
		<div className='space-y-8'>
			<IconGrid icons={ActionIcon} title='Action Icons' />
			<IconGrid icons={AppletIcon} title='Applet Icons' />
			<IconGrid icons={FileTypeIcon} title='File Type Icons' />
			<IconGrid icons={FileExtIcon} title='File Extension Icons' />
		</div>
	),
};

export const ActionIconsDemo: StoryObj = {
	render: () => <IconGrid icons={ActionIcon} title='Action Icons' />,
};

export const AppletIconsDemo: StoryObj = {
	render: () => <IconGrid icons={AppletIcon} title='Applet Icons' />,
};

export const FileTypeIconsDemo: StoryObj = {
	render: () => <IconGrid icons={FileTypeIcon} title='File Type Icons' />,
};

export const FileExtIconsDemo: StoryObj = {
	render: () => <IconGrid icons={FileExtIcon} title='File Extension Icons' />,
};

export const IconUsageExample: StoryObj = {
	render: () => (
		<div className='space-y-4'>
			<h2 className='text-xl font-semibold'>Usage Examples</h2>
			<div className='space-y-2'>
				<div className='flex items-center space-x-2'>
					<ActionIcon.Save className='h-5 w-5' />
					<span>Save Document</span>
				</div>
				<div className='flex items-center space-x-2'>
					<ActionIcon.Delete className='h-5 w-5 text-red-500' />
					<span>Delete Item</span>
				</div>
				<div className='flex items-center space-x-2'>
					<FileTypeIcon.image className='h-5 w-5 text-blue-500' />
					<span>Image File</span>
				</div>
				<div className='flex items-center space-x-2'>
					<FileExtIcon.js className='h-5 w-5 text-yellow-500' />
					<span>JavaScript File</span>
				</div>
				<div className='flex items-center space-x-2'>
					<AppletIcon.Clock className='h-5 w-5 text-green-500' />
					<span>Clock Applet</span>
				</div>
			</div>
			<div className='mt-6'>
				<h3 className='text-lg font-medium'>Code Example:</h3>
				<pre className='mt-2 rounded-lg bg-gray-100 p-4 text-sm'>
					{`import { ActionIcon, AppletIcon, FileTypeIcon, FileExtIcon } from '@wener/console/components/icons';

// Use in JSX
<ActionIcon.Save className="w-5 h-5" />
<FileTypeIcon.image className="w-5 h-5" />
<FileExtIcon.js className="w-5 h-5" />
<AppletIcon.Clock className="w-5 h-5" />

// Available icon sets:
${Object.keys(ActionIcon).length} Action Icons
${Object.keys(AppletIcon).length} Applet Icons
${Object.keys(FileTypeIcon).length} File Type Icons
${Object.keys(FileExtIcon).length} File Extension Icons`}
				</pre>
			</div>
		</div>
	),
};
