import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsoleShell } from '../../registry/default/blocks/console-shell';
import { ConsoleWorkspaceDemo } from './ConsoleWorkspaceDemo';

const meta = {
	title: 'Console/Shell',
	component: ConsoleShell,
	tags: ['autodocs'],
	parameters: {
		consoleThemeOwner: 'story',
		docs: {
			description: {
				component:
					'A router-agnostic console shell with global rail, collapsible module navigation, content header, and optional utility dock.',
			},
		},
	},
} satisfies Meta<typeof ConsoleShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
	render: () => <ConsoleWorkspaceDemo />,
};

export const CollapsedNavigation: Story = {
	render: () => <ConsoleWorkspaceDemo initialCollapsed />,
};

export const Mobile: Story = {
	parameters: {
		viewport: { defaultViewport: 'mobile2' },
	},
	render: () => <ConsoleWorkspaceDemo />,
};
