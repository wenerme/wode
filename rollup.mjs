import { readFile } from 'node:fs/promises';
import path from 'path';
import esbuild from 'rollup-plugin-esbuild';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { globby } from 'globby';
import { visualizer } from 'rollup-plugin-visualizer';
import json from '@rollup/plugin-json';

// const pkg = JSON.parse((await readFile(new URL(process.cwd()+'/package.json', import.meta.url))).toString());
const pkg = JSON.parse((await readFile(process.cwd() + '/package.json')).toString());
let toRegex = (v) => new RegExp(`^${v}(/|$)`);
const externalProd = [/^node:/, ...(pkg.rollup?.external || []).map(toRegex), ...Object.keys(pkg.peerDependencies || {})].map(toRegex);
const externalDev = [...externalProd, ...Object.keys(pkg.dependencies || {}).map(toRegex)];

const input = pkg.rollup?.input || await globby(['./src/index.ts', './src/index.tsx']);

/** @type import('rollup').RollupOptions */
const dev = {
  input,
  external: externalDev,
  plugins: [esbuild({ charset: 'utf8', target: 'esnext' })],
  output: {
    entryFileNames: '[name].js',
    exports: 'named',
    preserveModules: true,
    dir: 'lib',
    format: 'esm',
    interop: 'esModule',
    sourcemap: true,
  },
};

const entryFileNames = (ci) => {
  // src/index.js => index.js
  // src/resources/User/index.ts -> resources/User.js
  let filename = path
    .relative(process.cwd(), ci.facadeModuleId)
    .replace(/^src./, '')
    .replace(/.tsx?$/, '.js');
  // preserve pages dir index
  if (!filename.startsWith('pages')) {
    filename = filename.replace(/\/index.js$/, '.js');
  }
  return filename;
};

/** @type import('rollup').RollupOptions */
const prod = {
  input,
  external: externalProd,
  plugins: [
    json(),
    commonjs(),
    nodeResolve(),
    esbuild({
      minify: process.env.NODE_ENV === 'production',
      charset: 'utf8',
      target: 'chrome90',
      define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
      },
    }),
    visualizer({
      filename: `out/report/stats.html`,
    }),
    visualizer({
      filename: `out/report/stats.json`,
      template: 'raw-data',
    }),
  ],
  output: [
    {
      entryFileNames: entryFileNames,
      dir: 'dist/system',
      format: 'systemjs',
      sourcemap: true,
    },
    {
      entryFileNames: entryFileNames,
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      entryFileNames: entryFileNames,
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
    },
  ],
};
export { dev, prod };