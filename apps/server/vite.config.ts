import process from 'node:process';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = Object.assign(process.env, env);
  return defineConfig({
    plugins: [
      //
      // { enforce: 'pre', ...mdx({}) },
      react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    ],
    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },
  });
};
