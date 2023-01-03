import { useEffect } from 'react';
import { ErrorSuspenseBoundary } from 'common/src/components';
import { useThemeState } from 'common/src/daisy/theme';
import { getSupportedThemes, ThemeStateReactor } from 'common/src/daisy/theme';
import 'common/src/styles/globals.css';
import { Decorator } from '@storybook/react';
import { useDebugRender } from '@wener/reaction';

export const parameters = {
  layout: 'fullscreen', // no padding
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const withThemeProvider: Decorator = (Story: any, context: any) => {
  let state = useThemeState();
  const log = useDebugRender('withThemeProvider', context.globals);
  useEffect(() => {
    state.theme = context.globals.theme;
  }, [context.globals.theme]);
  return (
    <div className={'min-h-screen h-screen'}>
      <ErrorSuspenseBoundary>
        <ThemeStateReactor />
        <Story {...context} />
      </ErrorSuspenseBoundary>
    </div>
  );
};

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
