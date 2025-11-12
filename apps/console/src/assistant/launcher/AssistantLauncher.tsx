import React, { useEffect, useMemo } from 'react';
import { FiClock, FiFileText } from 'react-icons/fi';
import { JsonYamlConverterTool } from '@/assistant/tools/JsonYamlConverterTool';
import { TimeParserTool } from '@/assistant/tools/TimeParserTool';
import { AssistantLayout } from './components/AssistantLayout';
import { AssistantSidebar } from './components/AssistantSidebar';
import {
	AssistantProvider,
	createAssistantStore,
	useAssistantActions,
	useAssistantStore,
} from './context/AssistantStore';
import type { AssistantTool } from './types';

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
	const activeToolId = useAssistantStore((s) => s.activeToolId);
	const tools = useAssistantStore((s) => s.tools);

	const activeTool = tools.find((t) => t.id === activeToolId);
	const ActiveComponent = activeTool?.component;

	return ActiveComponent ? (
		<ActiveComponent />
	) : (
		<div className='text-base-content/50 flex h-full items-center justify-center'>Select a tool to get started</div>
	);
};

const AssistantInitializer: React.FC = () => {
	const { setUser } = useAssistantActions();
	const sidecar = useAssistantStore((s) => s.sidecar);

	useEffect(() => {
		sidecar.getUserInfo().then((user) => {
			setUser(user);
		});
	}, [sidecar, setUser]);

	return null;
};

export const AssistantLauncher: React.FC = () => {
	const store = useMemo(
		() =>
			createAssistantStore({
				tools: TOOLS,
				activeToolId: TOOLS[0].id,
			}),
		[],
	);

	// Independent Window Logic
	const searchParams = new URLSearchParams(window.location.search);
	const mode = searchParams.get('mode');
	const toolId = searchParams.get('toolId');

	if (mode === 'tool' && toolId) {
		const tool = TOOLS.find((t) => t.id === toolId);
		const ToolComponent = tool?.component;

		if (ToolComponent) {
			return (
				<div className='h-screen w-screen overflow-hidden bg-base-100 text-base-content'>
					<ToolComponent />
				</div>
			);
		}
		return (
			<div className='flex h-screen w-screen items-center justify-center bg-base-100 text-error'>
				Tool not found: {toolId}
			</div>
		);
	}

	return (
		<AssistantProvider store={store}>
			<AssistantInitializer />
			<AssistantLayout sidebar={<AssistantSidebar />} content={<AssistantContent />} />
		</AssistantProvider>
	);
};
