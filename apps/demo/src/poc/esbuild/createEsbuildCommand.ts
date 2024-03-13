#!/usr/bin/env node
import process from 'node:process';
import { Command } from 'commander';
import * as esbuild from 'esbuild';
import { Loader } from 'esbuild';
import { z } from 'zod';
import { createDynamicImportPlugin } from '@/poc/esbuild/createDynamicImportPlugin';
import { createEmbedPlugin } from '@/poc/esbuild/createEmbedPlugin';

export function createEsbuildCommand() {
  const root = new Command('esbuild').arguments('[entryPoints...]');

  /*
  Simple options:
    --bundle              Bundle all dependencies into the output files
    --define:K=V          Substitute K with V while parsing
    --external:M          Exclude module M from the bundle (can use * wildcards)
    --format=...          Output format (iife | cjs | esm, no default when not
                          bundling, otherwise default is iife when platform
                          is browser and cjs when platform is node)
    --loader:X=L          Use loader L to load file extension X, where L is
                          one of: base64 | binary | copy | css | dataurl |
                          empty | file | global-css | js | json | jsx |
                          local-css | text | ts | tsx
    --minify              Minify the output (sets all --minify-* flags)
    --outdir=...          The output directory (for multiple entry points)
    --outfile=...         The output file (for one entry point)
    --packages=...        Set to "external" to avoid bundling any package
    --platform=...        Platform target (browser | node | neutral,
                          default browser)
    --serve=...           Start a local HTTP server on this host:port for outputs
    --sourcemap           Emit a source map
    --splitting           Enable code splitting (currently only for esm)
    --target=...          Environment target (e.g. es2017, chrome58, firefox57,
                          safari11, edge16, node10, ie9, opera45, default esnext)
    --watch               Watch mode: rebuild on file system changes (stops when
                          stdin is closed, use "--watch=forever" to ignore stdin)

  Advanced options:
    --allow-overwrite         Allow output files to overwrite input files
    --analyze                 Print a report about the contents of the bundle
                              (use "--analyze=verbose" for a detailed report)
    --asset-names=...         Path template to use for "file" loader files
                              (default "[name]-[hash]")
    --banner:T=...            Text to be prepended to each output file of type T
                              where T is one of: css | js
    --certfile=...            Certificate for serving HTTPS (see also "--keyfile")
    --charset=utf8            Do not escape UTF-8 code points
    --chunk-names=...         Path template to use for code splitting chunks
                              (default "[name]-[hash]")
    --color=...               Force use of color terminal escapes (true | false)
    --drop:...                Remove certain constructs (console | debugger)
    --drop-labels=...         Remove labeled statements with these label names
    --entry-names=...         Path template to use for entry point output paths
                              (default "[dir]/[name]", can also use "[hash]")
    --footer:T=...            Text to be appended to each output file of type T
                              where T is one of: css | js
    --global-name=...         The name of the global for the IIFE format
    --ignore-annotations      Enable this to work with packages that have
                              incorrect tree-shaking annotations
    --inject:F                Import the file F into all input files and
                              automatically replace matching globals with imports
    --jsx-dev                 Use React's automatic runtime in development mode
    --jsx-factory=...         What to use for JSX instead of React.createElement
    --jsx-fragment=...        What to use for JSX instead of React.Fragment
    --jsx-import-source=...   Override the package name for the automatic runtime
                              (default "react")
    --jsx-side-effects        Do not remove unused JSX expressions
    --jsx=...                 Set to "automatic" to use React's automatic runtime
                              or to "preserve" to disable transforming JSX to JS
    --keep-names              Preserve "name" on functions and classes
    --keyfile=...             Key for serving HTTPS (see also "--certfile")
    --legal-comments=...      Where to place legal comments (none | inline |
                              eof | linked | external, default eof when bundling
                              and inline otherwise)
    --line-limit=...          Lines longer than this will be wrap onto a new line
    --log-level=...           Disable logging (verbose | debug | info | warning |
                              error | silent, default info)
    --log-limit=...           Maximum message count or 0 to disable (default 6)
    --log-override:X=Y        Use log level Y for log messages with identifier X
    --main-fields=...         Override the main file order in package.json
                              (default "browser,module,main" when platform is
                              browser and "main,module" when platform is node)
    --mangle-cache=...        Save "mangle props" decisions to a JSON file
    --mangle-props=...        Rename all properties matching a regular expression
    --mangle-quoted=...       Enable renaming of quoted properties (true | false)
    --metafile=...            Write metadata about the build to a JSON file
                              (see also: https://esbuild.github.io/analyze/)
    --minify-whitespace       Remove whitespace in output files
    --minify-identifiers      Shorten identifiers in output files
    --minify-syntax           Use equivalent but shorter syntax in output files
    --out-extension:.js=.mjs  Use a custom output extension instead of ".js"
    --outbase=...             The base path used to determine entry point output
                              paths (for multiple entry points)
    --preserve-symlinks       Disable symlink resolution for module lookup
    --public-path=...         Set the base URL for the "file" loader
    --pure:N                  Mark the name N as a pure function for tree shaking
    --reserve-props=...       Do not mangle these properties
    --resolve-extensions=...  A comma-separated list of implicit extensions
                              (default ".tsx,.ts,.jsx,.js,.css,.json")
    --serve-fallback=...      Serve this HTML page when the request doesn't match
    --servedir=...            What to serve in addition to generated output files
    --source-root=...         Sets the "sourceRoot" field in generated source maps
    --sourcefile=...          Set the source file for the source map (for stdin)
    --sourcemap=external      Do not link to the source map with a comment
    --sourcemap=inline        Emit the source map with an inline data URL
    --sources-content=false   Omit "sourcesContent" in generated source maps
    --supported:F=...         Consider syntax F to be supported (true | false)
    --tree-shaking=...        Force tree shaking on or off (false | true)
    --tsconfig=...            Use this tsconfig.json file instead of other ones
    --version                 Print the current version (0.19.11) and exit
   */

  root
    .option('--bundle')
    .option('--define <K=V...>')
    .option('--external <external...>')
    .option('--format <format>')
    .option('--loader <X=L...>')
    .option('--minify')
    .option('--outdir <outdir>')
    .option('--outfile <outfile>')
    .option('--packages <packages>')
    .option('--platform <platform>')
    .option('--serve <serve>')
    // .option('--sourcemap')
    .option('--splitting')
    .option('--target <target>')
    .option('--watch')
    .option('--allow-overwrite')
    .option('--analyze [verbose]')
    .option('--asset-names <asset-names>')
    .option('--banner <T=...>')
    .option('--certfile <certfile>')
    .option('--charset <charset>')
    .option('--chunk-names <chunk-names>')
    .option('--color <color>')
    .option('--drop <drop...>')
    .option('--drop-labels <drop-labels...>')
    .option('--entry-names <entry-names>')
    .option('--footer <T=...>')
    .option('--global-name <global-name>')
    .option('--ignore-annotations')
    .option('--inject <F>')
    .option('--jsx-dev')
    .option('--jsx-factory <jsx-factory>')
    .option('--jsx-fragment <jsx-fragment>')
    .option('--jsx-import-source <jsx-import-source>')
    .option('--jsx-side-effects')
    .option('--jsx <jsx>')
    .option('--keep-names')
    .option('--keyfile <keyfile>')
    .option('--legal-comments <legal-comments>')
    .option('--line-limit <line-limit>')
    .option('--log-level <log-level>')
    .option('--log-limit <log-limit>')
    .option('--log-override <X=Y...>')
    .option('--main-fields <main-fields...>')
    .option('--mangle-cache <mangle-cache>')
    .option('--mangle-props <mangle-props...>')
    .option('--mangle-quoted <mangle-quoted>')
    .option('--metafile <metafile>')
    .option('--minify-whitespace')
    .option('--minify-identifiers')
    .option('--minify-syntax')
    .option('--out-extension <out-extension...>')
    .option('--outbase <outbase>')
    .option('--preserve-symlinks')
    .option('--public-path <public-path>')
    .option('--pure <N...>')
    .option('--reserve-props <reserve-props...>')
    .option('--resolve-extensions <resolve-extensions...>')
    .option('--serve-fallback <serve-fallback>')
    .option('--servedir <servedir>')
    .option('--source-root <source-root>')
    .option('--sourcefile <sourcefile>')
    .option('--sourcemap [sourcemap]')
    .option('--sources-content <sources-content>')
    .option('--supported <F=...>')
    .option('--tree-shaking <tree-shaking>')
    .option('--tsconfig <tsconfig>');

  root.version(esbuild.version, '--version');
  root.option('--prod,--production').option('--dev,--development').option('--dry-run');

  root.action(async (args, opts, cmd: Command) => {
    if (!args.length) {
      console.error(`No entrypoint`);
      return;
    }
    console.log(`Build`, ...args);
    console.log(`  with`, opts);
    await runEsbuild({
      ...opts,
      entryPoints: args,
    });
  });
  return root;
}

async function runEsbuild(o: Record<string, any>) {
  const BuildOptions = z.object({
    dryRun: z.boolean().default(false),
    production: z.boolean().default(false),
    development: z.boolean().default(false),
  });
  const opts = BuildOptions.parse(o);

  function parseKV(s: string[] | undefined) {
    if (!s) {
      return s;
    }
    const r: Record<string, string> = {};
    for (const v of s) {
      const [k, ...vs] = v.split('=');
      r[k] = vs.join('=');
    }
    return r;
  }

  const ESBuildOptions = z.object({
    define: z.string().array().optional().transform(parseKV),
    banner: z.string().array().optional().transform(parseKV),
    footer: z.string().array().optional().transform(parseKV),
    loader: z
      .string()
      .array()
      .optional()
      .transform((v) => {
        const o = parseKV(v);
        return o as Record<string, Loader>;
      }),
    entryPoints: z.array(z.string()),
    external: z.array(z.string()).optional(),
    bundle: z.boolean().optional(),
    outfile: z.string().optional(),
    format: z.enum(['iife', 'cjs', 'esm']).optional(),
    platform: z.enum(['browser', 'node', 'neutral']).optional(),
    target: z.string().optional(),
    minify: z.boolean().optional(),
    minifySyntax: z.boolean().optional(),
    minifyWhitespace: z.boolean().optional(),
    minifyIdentifiers: z.boolean().optional(),
    legalComments: z.enum(['none', 'inline', 'eof', 'linked', 'external']).optional(),
    treeShaking: z.boolean().optional(),
  });
  const preset = {
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    minifySyntax: true,
    legalComments: 'external',
  };

  const eso = ESBuildOptions.parse({
    ...preset,
    ...o,
  });
  eso.define ||= {};
  if (opts.production) {
    Object.assign(eso.define, {
      'process.env.NODE_ENV': 'production',
      __DEV__: false,
    });
  } else if (opts.development) {
    Object.assign(eso.define, {
      'process.env.NODE_ENV': 'development',
      __DEV__: true,
    });
  }

  if (opts.dryRun) {
    console.log(eso);
    process.exit(0);
  }

  const bannerJs = `
'use strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
var __filename;
var __dirname;
{
  const {fileURLToPath} = await import('node:url');const {dirname} = await import('node:path');
  __filename = fileURLToPath(import.meta.url); 
  __dirname = dirname(__filename);
};
`.replace(/\s*\n/g, '');

  const banner: Record<string, string> = {
    js: bannerJs,
  };

  await esbuild.build({
    plugins: [
      createEmbedPlugin(),
      createDynamicImportPlugin({
        transformExtensions: ['.js'],
      }),
    ],
    banner,
    ...eso,
  });
}
