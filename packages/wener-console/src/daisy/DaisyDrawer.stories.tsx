import type { Meta, StoryObj } from '@storybook/react-vite';
import { DaisyDrawer } from './DaisyDrawer';

const meta: Meta<typeof DaisyDrawer.Root> = {
	title: 'daisy/DaisyDrawer',
	component: DaisyDrawer.Root,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
	render: () => (
		<DaisyDrawer.Root>
			<DaisyDrawer.Trigger className='btn btn-primary'>Open Drawer</DaisyDrawer.Trigger>
			<DaisyDrawer.Portal>
				<DaisyDrawer.Overlay />
				<DaisyDrawer.Content>
					<DaisyDrawer.Title>Drawer Title</DaisyDrawer.Title>
					<DaisyDrawer.Description>This is a description of the drawer content.</DaisyDrawer.Description>
					<div className='p-4'>
						<p>This is the main content of the drawer.</p>
						<p>It slides in from the right side of the screen.</p>
					</div>
				</DaisyDrawer.Content>
			</DaisyDrawer.Portal>
		</DaisyDrawer.Root>
	),
};

export const WithCustomContent: Story = {
	render: () => (
		<DaisyDrawer.Root>
			<DaisyDrawer.Trigger className='btn btn-secondary'>Open Settings</DaisyDrawer.Trigger>
			<DaisyDrawer.Portal>
				<DaisyDrawer.Overlay />
				<DaisyDrawer.Content className='w-80'>
					<DaisyDrawer.Title>Settings</DaisyDrawer.Title>
					<div className='space-y-4 p-4'>
						<div className='form-control'>
							<label className='label'>
								<span className='label-text'>Theme</span>
							</label>
							<select className='select select-bordered w-full'>
								<option>Light</option>
								<option>Dark</option>
								<option>Auto</option>
							</select>
						</div>
						<div className='form-control'>
							<label className='label cursor-pointer'>
								<span className='label-text'>Enable notifications</span>
								<input type='checkbox' className='toggle toggle-primary' defaultChecked />
							</label>
						</div>
						<div className='form-control'>
							<label className='label cursor-pointer'>
								<span className='label-text'>Auto-save</span>
								<input type='checkbox' className='toggle toggle-secondary' />
							</label>
						</div>
						<div className='flex gap-2 pt-4'>
							<button className='btn btn-primary flex-1'>Save</button>
							<button className='btn btn-ghost flex-1'>Cancel</button>
						</div>
					</div>
				</DaisyDrawer.Content>
			</DaisyDrawer.Portal>
		</DaisyDrawer.Root>
	),
};

export const Navigation: Story = {
	render: () => (
		<DaisyDrawer.Root>
			<DaisyDrawer.Trigger className='btn btn-outline'>Menu</DaisyDrawer.Trigger>
			<DaisyDrawer.Portal>
				<DaisyDrawer.Overlay />
				<DaisyDrawer.Content className='w-64'>
					<DaisyDrawer.Title>Navigation</DaisyDrawer.Title>
					<nav className='p-4'>
						<ul className='menu w-full'>
							<li>
								<a>Dashboard</a>
							</li>
							<li>
								<a>Projects</a>
							</li>
							<li>
								<a>Tasks</a>
							</li>
							<li>
								<a>Team</a>
							</li>
							<li className='menu-title'>Settings</li>
							<li>
								<a>Profile</a>
							</li>
							<li>
								<a>Account</a>
							</li>
							<li>
								<a>Billing</a>
							</li>
							<li className='menu-title'>Support</li>
							<li>
								<a>Help Center</a>
							</li>
							<li>
								<a>Contact</a>
							</li>
						</ul>
					</nav>
				</DaisyDrawer.Content>
			</DaisyDrawer.Portal>
		</DaisyDrawer.Root>
	),
};
