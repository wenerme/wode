import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const libraryName = 'wener-utils';
const globalName = 'WenerUtils';

/* Common Rollup Script
 * =====================
 */

function onwarn(warning) {
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return;
  }
  console.warn(warning.code, warning.message);
}

export default [
  {
    input: 'src/index.ts',
    plugins: [
      nodeResolve({
        browser: true,
        extensions: ['.js', '.ts'],
      }),

      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        extensions: ['.js', '.ts'],
      }),
    ],
    onwarn,
    output: [
      {
        file: `dist/${libraryName}.umd.js`,
        format: 'umd',
        name: globalName,
        sourcemap: true,
      },
      {
        file: `dist/${libraryName}.system.js`,
        format: 'system',
        sourcemap: true,
      },
      {
        file: `dist/${libraryName}.cjs`,
        format: 'cjs',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/index.ts',
    plugins: [
      nodeResolve({
        browser: true,
        extensions: ['.js', '.ts'],
      }),

      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        extensions: ['.js', '.ts'],
      }),
    ],
    onwarn,
    output: [
      {
        file: `dist/${libraryName}.esm.js`,
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
];
