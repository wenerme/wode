import process from 'node:process';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = Object.assign(process.env, env);

  return defineConfig({
    plugins: [],
    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },
    test: {
      exclude: [...configDefaults.exclude, '**/*.bun.test.ts'],
      server: {
        deps: {},
      },
      deps: {
        optimizer: {
          web: {},
        },
      },
    },
  });
};
