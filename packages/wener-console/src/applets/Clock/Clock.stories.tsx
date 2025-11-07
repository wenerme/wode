import React from 'react';
import type { Meta } from '@storybook/react-vite';
import { Clock } from './Clock';

const meta: Meta = {
	title: 'console/applet/Clock',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Demo = () => {
	return <Clock />;
};
