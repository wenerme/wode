import { type InitDef, runInit } from '@wener/common/meta';
import { type ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { DaisyTheme } from '../daisy';
import { ConsoleAuth } from './components/ConsoleAuth/ConsoleAuth';
import { ErrorSuspenseBoundary, LoadingIndicator } from './index';

export namespace Console {
	export const App = ({ children, content }: { children?: ReactNode; content?: ReactNode }) => {
		return (
			<ConsoleAuth.Root>
				<Root>
					<ConsoleAuth.Ready>
						{children}
						<ConsoleAuth.Block>
							<ErrorSuspenseBoundary>{content}</ErrorSuspenseBoundary>
						</ConsoleAuth.Block>
					</ConsoleAuth.Ready>
				</Root>
			</ConsoleAuth.Root>
		);
	};

	export const Root = ({ init, children }: { init?: Array<InitDef>; children?: ReactNode }) => {
		const { done } = useInit(init);

		if (!done) {
			return <LoadingIndicator />;
		}
		return (
			<>
				<Toaster />
				<DaisyTheme.Sidecar />
			</>
		);
	};
}

function useInit(init?: InitDef[]) {
	const [state, setState] = useState({ done: false });
	useEffect(() => {
		runInit(init).finally(() => {
			setState({ done: true });
		});
	}, []);
	return state;
}
