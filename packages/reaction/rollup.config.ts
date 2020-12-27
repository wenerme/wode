import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  external: ['react'],
  plugins: [typescript()],
  output: [
    {
      file: 'dist/reaction.umd.js',
      format: 'umd',
      sourcemap: true,
    },
    {
      file: 'dist/reaction.systemjs.js',
      format: 'systemjs',
      sourcemap: true,
    },
  ],
};
