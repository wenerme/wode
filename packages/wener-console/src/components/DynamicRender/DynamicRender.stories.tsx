import React from 'react';
import type { Meta } from '@storybook/react';
import { DynamicRender } from './';
import { showDialog } from './showDialog';

const meta: Meta = {
	title: 'components/DynamicRender',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Demo = () => {
	return (
		<div className={'prose'}>
			<h2>TopLevel</h2>
			<Control />
			<div className={'p-6'}>
				<DynamicRender.Root>
					<h3>Nested</h3>
					<Control />
					<DynamicRender.Outlet />
				</DynamicRender.Root>
			</div>
		</div>
	);
};

const Control = () => {
	const { render } = DynamicRender.useRenderer();
	return (
		<div className={'flex gap-2'}>
			<button
				className={'btn'}
				onClick={() => {
					render({
						id: 'foo',
						content: <div>Foo</div>,
					});
				}}
			>
				Foo
			</button>
			<button
				className={'btn'}
				onClick={() => {
					render({
						id: 'bar',
						content: <div>Bar</div>,
					});
				}}
			>
				Bar
			</button>

			<button
				className={'btn'}
				onClick={() => {
					showDialog({
						title: '测试',
						description: '测试描述',
						content: <div>测试内容</div>,
					});
				}}
			>
				Dialog
			</button>
		</div>
	);
};
