import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'esbuild';

export function createEmbedPlugin(): Plugin {
  return {
    name: 'embed',
    setup(build) {
      build.onResolve({ filter: /^embed:.*/, namespace: 'file' }, (args) => {
        switch (args.kind) {
          case 'import-statement':
          case 'dynamic-import':
            break;
          default:
            return null;
        }

        let p = args.path.slice('embed:'.length);
        if (p.startsWith('.')) {
          p = path.resolve(args.resolveDir, p);
        }
        return {
          path: p,
          namespace: 'embed',
          pluginData: {
            resolveDir: args.resolveDir,
          },
        };
      });

      build.onLoad({ filter: /.*/, namespace: 'embed' }, async (args) => {
        const resolveDir = args.pluginData.resolveDir;
        if (args.with?.type !== 'embed') {
          return null;
        }
        const cwd = args.with.cwd || '/app';
        console.log(`embed ${path.relative(resolveDir, args.path)} to ${cwd}`);
        const stat = await fs.stat(args.path);
        if (!stat.isDirectory()) {
          throw new Error(`Embed need a directory: ${args.path}`);
        }

        async function readDirectory(dir: string, basePath = dir, result: Record<string, any> = {}) {
          const files = await fs.readdir(dir, { withFileTypes: true });

          for (const file of files) {
            const filePath = path.join(dir, file.name);
            const relativePath = path.relative(basePath, filePath);

            if (file.isDirectory()) {
              readDirectory(filePath, basePath, result);
            } else {
              result[path.resolve(cwd, relativePath)] = await fs.readFile(filePath, 'utf8');
            }
          }

          return result;
        }

        const o = await readDirectory(args.path);

        return {
          contents: `
import { memfs } from 'memfs';

const {fs:lfs,vol} = memfs(${JSON.stringify(o)}, '/app/');
const fs = lfs.promises
export {
  fs,vol,lfs
}
        `,
          loader: 'js',
          resolveDir: resolveDir,
        };
      });
    },
  };
}
