'use client';

import {
	createJustBashAgentSession,
	createJustBashWorkspaceFromLoader,
	type JustBashModuleLoader,
} from '@wener/common/fs/just-bash';
import { useEffect, useState } from 'react';
import { type AgentCommandExecutor, createJustBashCommandExecutor } from '../agent-coding';
import type { AgentWorkspace } from '../agent-work';

export type JustBashExecutorState = {
	error?: Error;
	executor?: AgentCommandExecutor;
	status: 'disabled' | 'error' | 'idle' | 'loading' | 'ready';
};

export function useJustBashExecutor(options: {
	enabled: boolean;
	loader?: JustBashModuleLoader;
	onWorkspaceChanged: () => void;
	workspace: AgentWorkspace;
}): JustBashExecutorState {
	const { enabled, loader, onWorkspaceChanged, workspace } = options;
	const [state, setState] = useState<JustBashExecutorState>({ status: loader ? 'idle' : 'disabled' });
	useEffect(() => {
		let current = true;
		if (!loader) {
			setState({ status: 'disabled' });
			return () => {
				current = false;
			};
		}
		if (!enabled) {
			setState({ status: 'idle' });
			return () => {
				current = false;
			};
		}
		setState({ status: 'loading' });
		void createJustBashWorkspaceFromLoader(loader, {
			cwd: '/workspace',
			fs: workspace.fileSystem,
			fsRoot: workspace.rootPath,
			onWorkspaceChanged,
			workspaceRoot: '/workspace',
		}).then(
			(bashWorkspace) => {
				if (!current) return;
				const session = createJustBashAgentSession({ workspace: bashWorkspace });
				setState({ executor: createJustBashCommandExecutor(session), status: 'ready' });
			},
			(error: unknown) => {
				if (current) setState({ error: error instanceof Error ? error : new Error(String(error)), status: 'error' });
			},
		);
		return () => {
			current = false;
		};
	}, [enabled, loader, onWorkspaceChanged, workspace.fileSystem, workspace.id, workspace.rootPath]);
	return state;
}
