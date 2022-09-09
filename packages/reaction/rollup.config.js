import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));
// const outputName = pkg.name.replaceAll('@', '').replaceAll('/', '-');

// more consistent & intuitive output name
const outputName = 'index';
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

const env = process.env.NODE_ENV ?? 'production';
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
export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/system/${outputName}.min.js`,
        format: 'system',
        sourcemap: true,
      },
      {
        file: `dist/esm/${outputName}.min.js`,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [replaceProd, typescript(), terser()],
    external,
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/system/${outputName}.development.js`,
        format: 'system',
        sourcemap: true,
      },
      {
        file: `dist/esm/${outputName}.development.js`,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [replaceDev, typescript()],
    external,
  },
  {
    input: 'src/index.ts',
    output: [
      {
        entryFileNames: '[name].mjs',
        exports: 'named',
        preserveModules: true,
        dir: 'lib/esm',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: `dist/cjs/${outputName}.js`,
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [typescript()],
    external,
  },
];
