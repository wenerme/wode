import React, { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react';
import { DaisyTheme, getSupportedThemes } from '@wener/console/daisy';
import '@/console/globals.css';
import { DayJSInit } from '@/console/base.init';
import { RootContext } from '@/console/RootContext';

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
    <RootContext init={[DayJSInit]}>
      <DaisyTheme.Sidecar />
      <Story {...context} />
    </RootContext>
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
