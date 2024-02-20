import process from 'node:process';
import { webUpdateNotice } from '@plugin-web-update-notification/vite';
import { unstable_vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';
import { defineConfig, loadEnv, PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = Object.assign(process.env, env);

  return defineConfig({
    plugins: [
      remix({
        // ignoredRouteFiles: ['**/.*'],
        appDirectory: './src/remix/app',
        // routes(defineRoutes) {
        //   return defineRoutes((route) => {
        //     route('/about', 'about.tsx');
        //   });
        // },
      }),
      // million.vite({
      //   auto: {
      //     threshold: 0.3,
      //   },
      // }),
      // react(),
      tsconfigPaths(),
      webUpdateNotice({
        logVersion: true,
      }),
    ] as PluginOption[],
    server: {
      // proxy: {
      //   // '/api/trpc': {
      //   '/api/': {
      //     target: `http://127.0.0.1:${process.env.WEB_API_SERVER_PORT || '3001'}`,
      //     changeOrigin: true,
      //     // rewrite: (path) => path.replace(/^\/api/, ''),
      //   },
      // },
    },
  });
};
