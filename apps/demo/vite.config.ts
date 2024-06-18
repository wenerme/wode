import process from 'node:process';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, PluginOption } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = Object.assign(process.env, env);

  return defineConfig({
    plugins: [
      // 太多地方会有问题
      // million.vite({
      //   auto: true
      // }),
      react(),
    ] as PluginOption[],
    server: {
      proxy: {
        // '/api/trpc': {
        '/api/': {
          target: `http://127.0.0.1:${process.env.WEB_API_SERVER_PORT || '3001'}`,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },
    build: {
      sourcemap: false, // 在没有合适的 auth 前提下，关闭 sourcemap
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          // https://github.com/vitejs/vite/issues/15012
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
  });
};
