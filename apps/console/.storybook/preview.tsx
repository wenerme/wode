import type { Decorator, Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DynamicRender } from '@wener/console/components';
import { DaisyTheme, getSupportedThemes } from '@wener/console/daisy';
import { Window } from '@wener/console/window';
import React, { useEffect, useState } from 'react';
import '@/console/globals.css';

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
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
		},
	},
});
const withThemeProvider: Decorator = (Story: any, context: any) => {
	const store = DaisyTheme.useThemeStore();
	useEffect(() => {
		store.setState((s) => {
			s.theme = context.globals.theme;
		});
	}, [context.globals.theme]);

	return (
		<>
			<QueryClientProvider client={queryClient}>
				<DaisyTheme.Sidecar />
				<Story {...context} />
				<Window.Host />
			</QueryClientProvider>
			<DynamicRender.Outlet />
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
