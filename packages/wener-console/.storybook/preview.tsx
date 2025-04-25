import React, { useEffect, type PropsWithChildren } from 'react';
import type { Decorator, Preview } from '@storybook/react';
import { DaisyTheme, getSupportedThemes } from '../src/daisy';
import '../src/console/globals.css';
import { DynamicRender } from '../src/components/DynamicRender';
import { StaticRootReactor } from '../src/console';

const ClientContext: React.FC<PropsWithChildren> = ({ children }) => {
	return children;
};

// polyfills
if (!globalThis.process) {
	globalThis.process = { env: {} } as any;
}

const preview: Preview = {
	parameters: {
		// padded centered fullscreen
		layout: 'centered',
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

const withThemeProvider: Decorator = (Story: any, context: any) => {
	const [, update] = DaisyTheme.useThemeState();
	useEffect(() => {
		update({ theme: context.globals.theme });
	}, [context.globals.theme]);
	return (
		<>
			<ClientContext>
				<DynamicRender.Outlet />
				<StaticRootReactor />
				<Story {...context} />
			</ClientContext>
		</>
	);
};

export default preview;
export const decorators = [withThemeProvider];
export const globalTypes = {
	theme: {
		name: 'Theme',
		description: 'Global theme for components',
		defaultValue: 'corporate',
		toolbar: {
			icon: 'circlehollow',
			items: [...getSupportedThemes().map((v) => v.value)],
			dynamicTitle: true,
		},
	},
};
