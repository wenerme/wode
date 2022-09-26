import { dev } from '@wener/wode/rollup.mjs';

export default {
  input: dev.input,
  output: dev.output,
  plugins: dev.plugins,
  external: dev.external,
};
