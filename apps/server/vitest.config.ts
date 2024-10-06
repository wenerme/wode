import process from 'node:process';
import react from '@vitejs/plugin-react';
import { loadEnv, type PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = Object.assign(process.env, env);

  return defineConfig({
    plugins: [react()] as PluginOption[],
    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },
    test: {
      server: {
        deps: {
          // fix .css extension error
          // inline: ['@wener/console'],
        },
      },
      deps: {
        optimizer: {
          web: {},
        },
      },
    },
  });
};
