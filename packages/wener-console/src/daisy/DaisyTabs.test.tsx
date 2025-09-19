import React from 'react';
import { DaisyTabs } from './DaisyTabs';

// Simple test component to verify Composite functionality
export function TestDaisyTabsComposite() {
	const tabs = [
		{
			key: 'tab1',
			label: 'Home',
			icon: () => <span>🏠</span>,
			content: <div className="p-4">Welcome home!</div>,
		},
		{
			key: 'tab2',
			label: 'Settings',
			content: <div className="p-4">Configure settings</div>,
		},
	];

	return (
		<div>
			<h2>DaisyTabs Composite Test</h2>
			
			{/* Basic Composite usage */}
			<div className="mb-8">
				<h3>Basic Composite</h3>
				<DaisyTabs.Composite
					defaultValue="tab1"
					tabs={tabs}
				/>
			</div>

			{/* Boxed variant */}
			<div className="mb-8">
				<h3>Boxed Variant</h3>
				<DaisyTabs.Composite
					defaultValue="tab1"
					variant="boxed"
					tabs={tabs}
				/>
			</div>

			{/* Lifted variant with title and action */}
			<div className="mb-8">
				<h3>Lifted with Title and Action</h3>
				<DaisyTabs.Composite
					defaultValue="tab1"
					variant="lifted"
					title="Dashboard"
					action={<button className="btn btn-sm">Action</button>}
					tabs={tabs}
				/>
			</div>

			{/* Manual composition for comparison */}
			<div className="mb-8">
				<h3>Manual Composition (Traditional)</h3>
				<DaisyTabs.Root defaultValue="manual1">
					<DaisyTabs.List>
						<DaisyTabs.Tab value="manual1">Manual Tab 1</DaisyTabs.Tab>
						<DaisyTabs.Tab value="manual2">Manual Tab 2</DaisyTabs.Tab>
					</DaisyTabs.List>
					<DaisyTabs.Panel value="manual1">
						<div className="p-4">Manual content 1</div>
					</DaisyTabs.Panel>
					<DaisyTabs.Panel value="manual2">
						<div className="p-4">Manual content 2</div>
					</DaisyTabs.Panel>
				</DaisyTabs.Root>
			</div>
		</div>
	);
}