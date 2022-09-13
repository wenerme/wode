import { readFile } from 'node:fs/promises';
import type { MergedRollupOptions, RollupOptions } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

const pkg = JSON.parse((await readFile(new URL('./package.json', import.meta.url))).toString());
// missing types
const { default: size } = await import('rollup-plugin-size' as any);

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

const env = process.env['NODE_ENV'] ?? 'production';
const isProduction = env === 'production';
const replaceProd = replace({
  'process.env.NODE_ENV': JSON.stringify(env),
  __DEV__: String(!isProduction),
  preventAssignment: true,
});
const replaceDev = replace({
  'process.env.NODE_ENV': JSON.stringify('development'),
  __DEV__: String(true),
  preventAssignment: true,
});
const ts = typescript({
  noForceEmit: true,
});
export default function (): RollupOptions[] {
  let prod: MergedRollupOptions = {
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
      replaceProd,
      ts,
      json(),
      commonjs(),
      nodeResolve({ extensions: ['.ts', '.tsx'], browser: true }),
      terser({
        mangle: true,
        compress: true,
      }),
      size({}),
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
  let dev: MergedRollupOptions = {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/esm/${outputName}.development.js`,
        format: 'esm',
        interop: 'esModule',
        sourcemap: true,
      },
    ],
    plugins: [replaceDev, ts, json(), commonjs(), nodeResolve({ extensions: ['.ts', '.tsx'] })],
    external: externalDev,
  };
  let neutral: MergedRollupOptions = {
    input: 'src/index.ts',
    output: [
      {
        entryFileNames: '[name].mjs',
        exports: 'named',
        preserveModules: true,
        dir: 'lib',
        format: 'esm',
        interop: 'esModule',
        sourcemap: true,
      },
    ],
    plugins: [ts, json(), commonjs(), nodeResolve({ extensions: ['.ts', '.tsx'] })],
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
    neutral.output.push({
      file: `dist/cjs/${outputName}.js`,
      format: 'cjs',
      sourcemap: true,
    });
  }

  return [
    prod,
    dev,
    neutral,
    // types - failed
    // {
    //   input: 'src/index.ts',
    //   output: [
    //     {
    //       file: 'dist/types/index.d.ts',
    //       format: 'esm',
    //       interop: 'esModule',
    //     },
    //   ],
    //   plugins: [nodeResolve({ extensions: ['.ts', '.tsx'] }), dts()],
    //   external: externalDev,
    // },
  ];
}
