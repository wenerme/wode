'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { WindowManagerHost } from '@/window/window-manager';
import {
	createWindowManagerStoryStore,
	ManagedWindowManagerStory,
	PersistentWindowManagerStory,
	PortalWindowManagerStory,
} from './window-manager-story-fixtures';
import { playInteractiveWindowManagerStory, playPersistentWindowManagerStory } from './window-manager-story-play';

const meta = {
	id: 'blocks-window-manager',
	title: 'Window/Window Manager',
	component: WindowManagerHost,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'A context-scoped multi-window runtime with deterministic state transitions, draggable/resizable geometry, dock/task switching, portal hosting, versioned opt-in persistence, and customizable renderers.',
			},
		},
	},
} satisfies Meta<typeof WindowManagerHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveWorkspace: Story = {
	render: () => <ManagedWindowManagerStory store={createWindowManagerStoryStore()} />,
	play: playInteractiveWindowManagerStory,
};

export const PersistentLayout: Story = {
	render: () => <PersistentWindowManagerStory />,
	play: playPersistentWindowManagerStory,
};

export const PortalHost: Story = {
	render: () => <PortalWindowManagerStory />,
};

export const LeftDock: Story = {
	render: () => <ManagedWindowManagerStory store={createWindowManagerStoryStore('left')} />,
};

export const RightDockDark: Story = {
	globals: { theme: 'business' },
	render: () => <ManagedWindowManagerStory store={createWindowManagerStoryStore('right')} />,
};
