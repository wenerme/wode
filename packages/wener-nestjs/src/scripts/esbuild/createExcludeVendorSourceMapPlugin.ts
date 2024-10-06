import fs from 'node:fs';
import type { Plugin } from 'esbuild';

// source map 过大会导致 nodejs 启动过慢
// https://github.com/evanw/esbuild/issues/1685#issuecomment-944916409
export const createExcludeVendorSourceMapPlugin = ({ filter }: { filter: RegExp }): Plugin => ({
  name: 'excludeVendorFromSourceMap',
  setup(build) {
    build.onLoad({ filter }, (args) => {
      if (args.path.endsWith('.js')) {
        return {
          contents:
            fs.readFileSync(args.path, 'utf8') +
            '\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
          loader: 'default',
        };
      }
    });
  },
});
