import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  // No matching indexer found for .stories.mdx
  // .mdx cause translate to import js
  // stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public', '../src/assets'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {},
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {},
    },
  },
  // debug vite config
  // viteFinal: (config) => {
  //   console.log(`viteFinal`, config);
  // },
};
export default config;
