import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dynamicImport from 'vite-plugin-dynamic-import';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'mpa',
  define: {
    'process.env': {},
    // 'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    dynamicImport({
      // imported by
      // filter: (id) => console.log('dynamic import', id),
      // onFiles: (files, id) => {
      //   console.log('dynamic import', id, files);
      //   return files;
      // },
      loose: false,
    }),
    react(),
  ],
  /*
https://vitejs.dev/guide/build.html

native esm

- Chrome >=87
- Firefox >=78
- Safari >=14
- Edge >=88
   */
  build: {
    manifest: true,
    // lib: {
    //   entry: resolve(__dirname, 'src/modules/hash.ts'),
    //   name: 'WenerApisHash',
    //   fileName: 'wener-apis-hash',
    // },
    rollupOptions: {
      // external: ['react', 'react-dom', 'react-router-dom'],
      input: {
        main: resolve(__dirname, 'index.html'),
        // docs: resolve(__dirname, 'public/docs.html'),
      },
    },
  },
});
