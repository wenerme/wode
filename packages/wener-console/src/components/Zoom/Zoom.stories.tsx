import React from 'react';
import type { Meta } from '@storybook/react-vite';
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
		<div className={'flex flex-col gap-8 p-8'}>
			<Zoom>
				<img alt={'placeholder'} src={placeholderUrl} className={'max-w-10'} />
			</Zoom>
			<Zoom>
				<img alt={'placeholder'} src={dataUrl} className={'max-w-10'} />
			</Zoom>
		</div>
	);
};

const placeholderUrl = 'https://placehold.co/600x400';
const dataUrl =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8//8/AwAI/wH+9Q4AAAAASUVORK5CYII=';
