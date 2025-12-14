import type { Meta, StoryObj } from '@storybook/react-vite';
import { getVersion } from '#/info/const';

const meta: Meta = {
	title: 'common/hello',
	parameters: {
		layout: 'padded',
	},
};

export default meta;

export const Hello = () => {
	return <div>Hello v{getVersion()}</div>;
};
