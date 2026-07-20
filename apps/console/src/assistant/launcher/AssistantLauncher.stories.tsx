import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AssistantLauncher } from './AssistantLauncher';

const meta: Meta<typeof AssistantLauncher> = {
	title: 'Assistant/Launcher',
	component: AssistantLauncher,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof AssistantLauncher>;

export const Default: Story = {};
