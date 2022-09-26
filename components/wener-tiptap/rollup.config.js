import { readFile } from 'node:fs/promises';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { visualizer } from 'rollup-plugin-visualizer';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

const pkg = JSON.parse((await readFile(new URL('./package.json', import.meta.url))).toString());
// missing types

const buildCjs = pkg.main || pkg.exports?.['.']?.['require'];
const buildSystem = pkg.system || pkg.exports?.['.']?.['system'];

const cfg = pkg.rollup ?? {
  externals: [],
  dev: {
    externals: [],
  },
};

// more consistent & intuitive output name
const outputName = 'index';
// const outputName = pkg.name.replaceAll('@', '').replaceAll('/', '-');

const external = [
  'react/jsx-runtime',
  ...(cfg.externals || []),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
];
const externalDev = [...external, ...(cfg?.dev?.externals || []), ...Object.keys(pkg.dependencies || {})];

console.debug(`Building`, { cjs: buildCjs, system: buildSystem });

// : RollupOptions[]
export default function () {
  /**@type import('rollup').MergedRollupOptions*/
  let prod = {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/esm/${outputName}.min.js`,
        format: 'esm',
        interop: 'esModule',
        sourcemap: true,
      },
    ],
    plugins: [
      json(),
      commonjs(),
      nodeResolve({ extensions: ['.ts', '.tsx'], browser: true }),
      esbuild(),
      visualizer({
        filename: `dist/report/stats.html`,
        gzipSize: true,
      }),
      visualizer({
        filename: `dist/report/stats.json`,
        template: 'raw-data',
        gzipSize: true,
      }),
    ],
    external,
  };
  /**@type import('rollup').MergedRollupOptions*/
  let dev = {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/esm/${outputName}.development.js`,
        format: 'esm',
        interop: 'esModule',
        sourcemap: true,
      },
    ],
    plugins: [json(), commonjs(), nodeResolve({ extensions: ['.ts', '.tsx'] }), esbuild()],
    external: externalDev,
  };
  /**@type import('rollup').MergedRollupOptions*/
  let neutral = {
    input: 'src/index.ts',
    output: [
      {
        entryFileNames: '[name].js',
        exports: 'named',
        preserveModules: true,
        dir: 'lib',
        format: 'esm',
        interop: 'esModule',
        sourcemap: true,
      },
    ],
    plugins: [json(), commonjs(), nodeResolve({ extensions: ['.ts', '.tsx'] }), esbuild()],
    external: externalDev,
  };

  if (buildSystem) {
    prod.output.push({
      file: `dist/system/${outputName}.min.js`,
      format: 'system',
      interop: 'esModule',
      sourcemap: true,
    });
    dev.output.push({
      file: `dist/system/${outputName}.development.js`,
      format: 'system',
      sourcemap: true,
      interop: 'esModule',
    });
  }
  if (buildCjs) {
    dev.output.push({
      file: `dist/cjs/${outputName}.js`,
      format: 'cjs',
      sourcemap: true,
    });
  }

  // failed
  // https://github.com/Swatinem/rollup-plugin-dts/blob/master/src/transform/index.ts#L70
  // Invalid value false for option "output.interop"
  /**@type import('rollup').MergedRollupOptions*/
  let types = {
    input: 'src/index.ts',
    // input: 'lib/index.d.ts',
    output: [
      {
        file: 'dist/types/index.d.ts',
        format: 'es',
        interop: 'esModule',
      },
    ],
    plugins: [dts()],
  };

  /**@type import('rollup').RollupOptions[]*/
  let builds = [prod, dev, neutral];
  if (process.env['BUILD_TYPES']) {
    builds.push(types);
  }
  return builds;
}
