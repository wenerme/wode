import type { Meta } from '@storybook/react-vite';
import { useWindow } from '../ReactWindow';
import { StandaloneWindow } from './StandaloneWindow';

const meta: Meta = {
	title: 'console/window/standalone',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Demo = () => {
	let win = useWindow();
	return (
		<div className={'bg-base-200 h-screen w-screen'}>
			<div className={'p-4'}>
				<h1 className={'mb-4 text-2xl font-bold'}>Standalone Window Demo</h1>
				<div className={'mb-4 flex gap-2'}>
					<button
						type={'button'}
						className={'btn btn-primary'}
						onClick={() => {
							win.open({
								title: 'Calculator',
								width: 300,
								height: 400,
								render: () => (
									<div className={'p-4'}>
										<div className={'mb-4 text-center text-xl font-bold'}>Calculator</div>
										<div className={'grid grid-cols-4 gap-2'}>
											{['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
												<button key={btn} className={'btn btn-sm'}>
													{btn}
												</button>
											))}
										</div>
									</div>
								),
							});
						}}
					>
						Open Calculator
					</button>
					<button
						type={'button'}
						className={'btn btn-secondary'}
						onClick={() => {
							win.open({
								title: 'Text Editor',
								width: 600,
								height: 400,
								render: () => (
									<div className={'flex h-full flex-col p-4'}>
										<h3 className={'mb-2 text-lg font-semibold'}>Text Editor</h3>
										<textarea
											className={'textarea textarea-bordered flex-1 resize-none'}
											placeholder={'Type your text here...'}
										/>
									</div>
								),
							});
						}}
					>
						Open Text Editor
					</button>
					<button
						type={'button'}
						className={'btn btn-accent'}
						onClick={() => {
							win.open({
								title: 'Settings',
								width: 400,
								height: 300,
								render: () => (
									<div className={'p-4'}>
										<h3 className={'mb-4 text-lg font-semibold'}>Settings</h3>
										<div className={'space-y-4'}>
											<label className={'flex items-center gap-2'}>
												<input type={'checkbox'} className={'checkbox'} />
												Enable notifications
											</label>
											<label className={'flex items-center gap-2'}>
												<input type={'checkbox'} className={'checkbox'} />
												Dark mode
											</label>
											<div className={'flex gap-2'}>
												<button className={'btn btn-primary btn-sm'}>Save</button>
												<button className={'btn btn-outline btn-sm'}>Cancel</button>
											</div>
										</div>
									</div>
								),
							});
						}}
					>
						Open Settings
					</button>
				</div>
				<p className={'text-base-content/70'}>
					Click the buttons above to open different windows. Try maximizing, minimizing, and resizing them. The toggle
					button in the bottom-right controls the dock sidebar.
				</p>
			</div>
			<StandaloneWindow />
		</div>
	);
};
