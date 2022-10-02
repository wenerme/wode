import { prod } from '@wener/wode/rollup.mjs';

export default {
  input: prod.input,
  output: prod.output,
  plugins: prod.plugins,
  external: prod.external,
};
