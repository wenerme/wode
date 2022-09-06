import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import { readFile } from 'node:fs/promises';

const { name } = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));
const outputName = name.replaceAll('@', '').replaceAll('/', '-');

const env = process.env.NODE_ENV ?? 'production';
const isProduction = env === 'production';
const ReplaceProd = replace({
  'process.env.NODE_ENV': JSON.stringify(env),
  __DEV__: String(!isProduction),
  preventAssignment: true,
});
const ReplaceDev = replace({
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
    ],
    plugins: [ReplaceProd, typescript(), terser()],
    external: ['react', 'react-dom', 'prop-types'],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/system/${outputName}.development.js`,
        format: 'system',
        sourcemap: true,
      },
    ],
    plugins: [ReplaceDev, typescript()],
    external: ['react', 'react-dom', 'prop-types'],
  },
];
