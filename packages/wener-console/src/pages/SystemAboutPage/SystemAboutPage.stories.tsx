import type { Meta, StoryObj } from '@storybook/react-vite';
import { GrSystem } from 'react-icons/gr';
import { getBuildInfo } from '../../buildinfo';
import { SystemAboutPage } from './SystemAboutPage';

const meta: Meta<typeof SystemAboutPage.Composite> = {
	title: 'pages/SystemAboutPage',
	component: SystemAboutPage.Composite,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SystemAboutPage.Composite>;

export const Default: Story = {
	args: {},
};

export const WithCustomBuild: Story = {
	args: {
		build: {
			title: 'Custom Build',
			logo: <GrSystem className={'h-8 w-8'} />,
			info: {
				...getBuildInfo(),
				version: '2.0.0',
				isDev: false,
			},
		},
	},
};

export const WithCustomAuthor: Story = {
	args: {
		author: {
			title: '企业管理系统',
			author: {
				name: 'Custom Author',
				link: 'https://example.com',
			},
		},
	},
};

export const WithCustomAgent: Story = {
	args: {
		agent: <div className='rounded-lg border p-4 text-sm shadow'>Custom Agent Info</div>,
	},
};

export const WithDisabledBuild: Story = {
	args: {
		build: false,
	},
};

export const WithDisabledAuthor: Story = {
	args: {
		author: false,
	},
};

export const WithDisabledAgent: Story = {
	args: {
		agent: false,
	},
};

export const WithChildren: Story = {
	args: {
		children: (
			<div className='rounded-lg border p-4 text-sm shadow'>
				<p>Additional content goes here</p>
			</div>
		),
	},
};

export const FullFeatured: Story = {
	args: {
		build: {
			title: 'Production Build',
			logo: <GrSystem className={'h-8 w-8'} />,
			info: {
				...getBuildInfo(),
				version: '1.0.0',
				isDev: false,
			},
		},
		author: {
			title: '企业管理系统',
			author: {
				name: 'Custom Team',
				link: 'https://example.com',
			},
		},
		children: (
			<div className='rounded-lg border p-4 text-sm shadow'>
				<p>Additional system information</p>
			</div>
		),
	},
};

// Stories for individual components
export const AuthorInfoStory: Story = {
	render: () => {
		return (
			<div className='max-w-md'>
				<SystemAboutPage.AuthorInfo
					title='系统名称'
					author={{
						name: 'Wener',
						link: 'https://wener.me',
					}}
				/>
			</div>
		);
	},
};

export const BuildInfoStory: Story = {
	render: () => {
		return (
			<div className='max-w-md'>
				<SystemAboutPage.BuildInfo logo={<GrSystem className={'h-6 w-6'} />} title='系统名称' info={getBuildInfo()} />
			</div>
		);
	},
};

export const BrowserInfoStory: Story = {
	render: () => {
		return (
			<div className='max-w-md'>
				<SystemAboutPage.BrowserInfo />
			</div>
		);
	},
};

export const SectionStory: Story = {
	render: () => {
		return (
			<div className='max-w-md space-y-4'>
				<SystemAboutPage.Section title='Section with Title' icon={<GrSystem className={'h-6 w-6'} />}>
					<p>This is a section with title and icon in the header.</p>
				</SystemAboutPage.Section>

				<SystemAboutPage.Section title='Section with Title Only'>
					<p>This is a section with title only (no icon).</p>
				</SystemAboutPage.Section>

				<SystemAboutPage.Section
					header={
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<GrSystem className={'h-6 w-6'} />
								<span className={'text-xl font-medium'}>Custom Header</span>
							</div>
							<span className='badge badge-sm'>Badge</span>
						</div>
					}
				>
					<p>This is a section with a custom header.</p>
				</SystemAboutPage.Section>

				<SystemAboutPage.Section
					title='Section with Footer'
					icon={<GrSystem className={'h-6 w-6'} />}
					footer={<small className='text-gray-500'>Footer content goes here</small>}
				>
					<p>This is a section with a footer.</p>
				</SystemAboutPage.Section>

				<SystemAboutPage.Section title='Section with Custom Padding' className='p-0'>
					<div className='p-3'>
						<p>This section has custom padding. Content handles its own padding.</p>
					</div>
				</SystemAboutPage.Section>
			</div>
		);
	},
};

export const LayoutStory: Story = {
	render: () => {
		return (
			<SystemAboutPage.Layout>
				<SystemAboutPage.Section title='First Section' icon={<GrSystem className={'h-6 w-6'} />}>
					<p>This is the first section in the layout.</p>
				</SystemAboutPage.Section>
				<SystemAboutPage.Section title='Second Section'>
					<p>This is the second section in the layout.</p>
				</SystemAboutPage.Section>
				<SystemAboutPage.Section title='Third Section' icon={<GrSystem className={'h-6 w-6'} />}>
					<p>This is the third section in the layout.</p>
				</SystemAboutPage.Section>
			</SystemAboutPage.Layout>
		);
	},
};
