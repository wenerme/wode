import React from 'react';
import type { Meta } from '@storybook/react';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { NotReadyPlaceholder } from './NotReadyPlaceholder';
import { TruncateFormat } from './TruncateFormat';

const meta: Meta = {
	title: 'components/formats',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Default = () => {
	const items = [
		{
			title: 'EmptyPlaceholder',
			children: [
				{
					description: 'default',
					content: <EmptyPlaceholder />,
				},
			],
		},
		{
			title: 'TruncateFormat',
			children: [
				{
					description: 'short',
					content: <TruncateFormat>abc</TruncateFormat>,
				},
				{
					description: 'long',
					content: <TruncateFormat>abc def ghi jkl mno pqr stu vwx yz</TruncateFormat>,
				},
				{
					description: 'value',
					content: <TruncateFormat value={'abc def ghi jkl mno pqr stu vwx yz'} />,
				},
			],
		},
		{
			title: 'Not Ready Placeholder',
			children: [
				{
					description: 'default',
					content: <NotReadyPlaceholder />,
				},
				{
					description: 'loading',
					content: <NotReadyPlaceholder loading />,
				},
				{
					description: 'error',
					content: <NotReadyPlaceholder error={'error'} />,
				},
				{
					description: 'empty',
					content: <NotReadyPlaceholder empty={0} />,
				},
				{
					description: 'empty 1',
					content: <NotReadyPlaceholder empty={1} />,
				},
			],
		},
	];
	return (
		<div className={'flex flex-col p-2'}>
			{items.map((item, index) => (
				<div key={index} className={'flex flex-col gap-2'}>
					<h2 className={'text-lg font-bold'}>{item.title}</h2>
					{item.children.map((child, childIndex) => (
						<div key={childIndex} className={''}>
							<h3 className={'text-md font-semibold'}>{child.description}</h3>
							<div className={'w-fit resize overflow-auto rounded border p-4'}>{child.content}</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
};
