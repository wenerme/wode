import React, { PropsWithChildren, useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react';
import { getSupportedThemes, useThemeState } from '../src/daisy';
import '@/console/globals.css';
import { StaticRootReactor } from '@/console/components/StaticRootReactor';

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
  let state = useThemeState();
  // const log = useDebugRender('withThemeProvider', context.globals);
  useEffect(() => {
    state.theme = context.globals.theme;
  }, [context.globals.theme]);
  return (
    <>
      <ClientContext>
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
