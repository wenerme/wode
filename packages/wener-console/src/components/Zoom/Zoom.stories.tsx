import React from 'react';
import type { Meta } from '@storybook/react';
import { Zoom } from './Zoom';

const meta: Meta = {
	title: 'components/Zoom',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Default = () => {
	return (
		<div>
			<Zoom>
				<img alt={'placeholder'} src={'https://placehold.co/600x400'} className={'max-w-10'} />
			</Zoom>
		</div>
	);
};
