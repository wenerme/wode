import fs from 'node:fs/promises';
import path from 'node:path';
import { inspect } from 'node:util';
import type { Plugin } from 'esbuild';
import typescript from 'typescript';

const theFinder = new RegExp(/((?<![\(\s]\s*['"])@\w*[\w\d]\s*(?![;])[\((?=\s)])/);

// const stripComments = require('strip-comments');
// const findDecorators = (fileContent?: string) => theFinder.test(stripComments(fileContent));

// ok with false positive
const findDecorators = (fileContent: string) => theFinder.test(fileContent);

interface TscPluginOptions {
  // If empty, uses tsconfig.json
  tsconfigPath?: string;
  // If true, force compilation with tsc
  force?: boolean;
  // If true, enables tsx file support
  tsx?: boolean;
}

/**
 * @see https://github.com/thomaschaaf/esbuild-plugin-tsc thomaschaaf/esbuild-plugin-tsc
 */
export const createTscPlugin = ({
  tsconfigPath = path.join(process.cwd(), './tsconfig.json'),
  force: forceTsc = false,
  tsx = true,
}: TscPluginOptions = {}): Plugin => ({
  name: 'tsc',
  setup(build) {
    let parsedTsConfig: typescript.ParsedCommandLine | null = null;

    build.onLoad({ filter: tsx ? /\.tsx?$/ : /\.ts$/ }, async (args) => {
      if (!parsedTsConfig) {
        parsedTsConfig = parseTsConfig(tsconfigPath, process.cwd());
        if (parsedTsConfig.options.sourceMap) {
          parsedTsConfig.options.sourceMap = false;
          parsedTsConfig.options.inlineSources = true;
          parsedTsConfig.options.inlineSourceMap = true;
        }
      }

      // Just return if we don't need to search the file.
      if (!forceTsc && (!parsedTsConfig || !parsedTsConfig.options || !parsedTsConfig.options.emitDecoratorMetadata)) {
        return;
      }

      const ts = (await fs.readFile(args.path, 'utf8').catch((err) => printDiagnostics({ file: args.path, err })))!;

      // Find the decorator and if there isn't one, return out
      const hasDecorator = findDecorators(ts);
      if (!hasDecorator) {
        return;
      }

      const program = typescript.transpileModule(ts, {
        compilerOptions: parsedTsConfig.options,
        fileName: path.basename(args.path),
      });
      return { contents: program.outputText };
    });
  },
});

function parseTsConfig(tsconfig?: string, cwd = process.cwd()) {
  const fileName = typescript.findConfigFile(cwd, typescript.sys.fileExists, tsconfig);

  // if the value was provided, but no file, fail hard
  if (tsconfig !== undefined && !fileName) throw new Error(`failed to open '${fileName}'`);

  let loadedConfig = {};
  let baseDir = cwd;
  let configFileName;
  if (fileName) {
    const text = typescript.sys.readFile(fileName);
    if (text === undefined) throw new Error(`failed to read '${fileName}'`);

    const result = typescript.parseConfigFileTextToJson(fileName, text);

    if (result.error !== undefined) {
      printDiagnostics(result.error);
      throw new Error(`failed to parse '${fileName}'`);
    }

    loadedConfig = result.config;
    baseDir = path.dirname(fileName);
    configFileName = fileName;
  }

  const parsedTsConfig = typescript.parseJsonConfigFileContent(loadedConfig, typescript.sys, baseDir);

  if (parsedTsConfig.errors[0]) printDiagnostics(parsedTsConfig.errors);

  return parsedTsConfig;
}

function printDiagnostics(...args: any[]) {
  console.log(inspect(args, false, 10, true));
}
