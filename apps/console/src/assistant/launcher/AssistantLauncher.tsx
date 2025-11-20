import React, { useEffect } from 'react';
import { FiClock, FiFileText } from 'react-icons/fi';
import { AssistantLayout } from './components/AssistantLayout';
import { AssistantSidebar } from './components/AssistantSidebar';
import type { AssistantTool } from './types';
import { TimeParserTool } from './tools/TimeParserTool';
import { JsonYamlConverterTool } from './tools/JsonYamlConverterTool';
import { useAssistantLauncherState, useAssistantLauncherMutate } from './AssistantLauncherState';

const TOOLS: AssistantTool[] = [
	{
		id: 'time-parser',
		name: 'Time Parser',
		description: 'Parse and format dates/times',
		icon: <FiClock />,
		component: TimeParserTool,
	},
	{
		id: 'json-yaml',
		name: 'JSON <> YAML',
		description: 'Convert between JSON and YAML',
		icon: <FiFileText />,
		component: JsonYamlConverterTool,
	},
];

const AssistantContent: React.FC = () => {
	const state = useAssistantLauncherState();

	const activeTool = state.tools.find((t) => t.id === state.activeToolId);
	const ActiveComponent = activeTool?.component as React.ComponentType;

	return ActiveComponent ? (
		<ActiveComponent />
	) : (
		<div className="flex h-full items-center justify-center text-base-content/50">
			Select a tool to get started
		</div>
	);
};

const AssistantInitializer: React.FC = () => {
	const mutate = useAssistantLauncherMutate();
	const state = useAssistantLauncherState();

	useEffect(() => {
		// Initialize tools if not set
		if (mutate.tools.length === 0) {
			mutate.tools = TOOLS;
			mutate.activeToolId = TOOLS[0].id;
		}

		// Sync User Info
		state.sidecar.getUserInfo().then(user => {
			mutate.user = {
				displayName: user.name,
				username: user.username
			};
		});
	}, [mutate, state.sidecar]);

	return null;
};

export const AssistantLauncher: React.FC = () => {
	// Independent Window Logic
	const searchParams = new URLSearchParams(window.location.search);
	const mode = searchParams.get('mode');
	const toolId = searchParams.get('toolId');

	if (mode === 'tool' && toolId) {
		const tool = TOOLS.find(t => t.id === toolId);
		const ToolComponent = tool?.component as React.ComponentType;

		if (ToolComponent) {
			return (
				<div className="h-screen w-screen bg-base-100 text-base-content overflow-hidden">
					<ToolComponent />
				</div>
			);
		}
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-base-100 text-error">
				Tool not found: {toolId}
			</div>
		);
	}

	return (
		<>
			<AssistantInitializer />
			<AssistantLayout
				sidebar={<AssistantSidebar />}
				content={<AssistantContent />}
			/>
		</>
	);
};
