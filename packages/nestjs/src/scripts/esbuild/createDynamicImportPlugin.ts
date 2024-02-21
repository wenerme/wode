import { promises as FsPromise } from 'node:fs';
import Path from 'node:path';
import { type Plugin } from 'esbuild';
import { globby } from 'globby';

export interface DynamicImportConfig {
  transformExtensions?: string[];
  changeRelativeToAbsolute?: boolean;
  filter?: RegExp;
  loader?: string;
}

/**
 * @see https://github.com/RTVision/esbuild-dynamic-import RTVision/esbuild-dynamic-import
 */
export function createDynamicImportPlugin(config: DynamicImportConfig): Plugin {
  if (!Array.isArray(config.transformExtensions) && !config.changeRelativeToAbsolute) {
    throw new Error('Either transformExtensions needs to be supplied or changeRelativeToAbsolute needs to be true');
  }
  const filter = config.filter ?? /\.js$/;
  const loader = config.loader ?? 'js';
  return {
    name: 'rtvision:dynamic-import',
    setup(build) {
      const cache = new Map();

      build.onLoad({ filter }, async (args) => {
        const resolveDir = Path.dirname(args.path);
        const fileContents = await FsPromise.readFile(args.path, 'utf8');
        let value = cache.get(args.path);

        // cache busting check
        if (!value || value.fileContents !== fileContents) {
          const contents = await replaceImports(fileContents, resolveDir, config);
          value = { fileContents, output: { contents, loader } };
          cache.set(args.path, value);
        }
        return value.output;
      });
    },
  };
}

async function replaceImports(fileContents: string, resolveDir: string, config: DynamicImportConfig) {
  const matches = fileContents.matchAll(/import\(([^)]+)\)/g);

  const globImports = [];
  const importsToReplace = [];
  for (const match of matches) {
    // remove any comments and the ` characters not handling multiline comments very well
    const destinationFile = match[1]?.replace(/(?:\/\*.*?\*\/)|(?:\/\/.*\n)|`/g, '').trim();

    // only change relative files if js file, then we can keep it a normal dynamic import
    // let node dynamically import the files. Support browser dynamic import someday?
    const fileExtension = Path.extname(destinationFile);
    if (config.changeRelativeToAbsolute && !Path.isAbsolute(destinationFile) && fileExtension === '.js') {
      const normalizedPath = Path.normalize(`${resolveDir}/${destinationFile}`);
      fileContents = fileContents.replace(match[1], `\`${normalizedPath}\``);
    } else if (
      Array.isArray(config.transformExtensions) &&
      config.transformExtensions.includes(fileExtension) &&
      /^.*\${.*?}.*$/.test(destinationFile)
    ) {
      importsToReplace.push({ fullImport: match[0], pathString: `\`${destinationFile}\`` });
      const transformedDestination = destinationFile.replace(/\${.*?}/g, '**/*');
      globImports.push(transformedDestination);
    }
  }

  if (globImports.length > 0) {
    const filenameImportPromises: Array<Promise<Array<string>>> = [];
    filenameImportPromises.push(globby(globImports, { cwd: resolveDir }));
    let importFilePaths: Array<string> = [];
    try {
      // Flatten array to array of filenames, filter out any rejected promises or duplicate entries
      importFilePaths = (await Promise.all(filenameImportPromises)).flat();
    } catch (e) {
      console.error(e);
    }
    if (importFilePaths.length === 0) {
      return fileContents;
    }

    const uniqueFilePathsMap = new Map<string, number>();
    const moduleMap = new Map<string, string>();
    const dedupedImportFilePaths = importFilePaths.filter((filePath) => {
      const pathNormalized = Path.normalize(`${resolveDir}/${filePath}`);
      let filterCondition = false;
      if (!uniqueFilePathsMap.has(pathNormalized)) {
        uniqueFilePathsMap.set(pathNormalized, uniqueFilePathsMap.size);
        filterCondition = true;
      }
      moduleMap.set(filePath, `_DynamicImportModule${uniqueFilePathsMap.get(pathNormalized)}`);
      return filterCondition;
    });

    const importString = dedupedImportFilePaths.reduce((accum, path, i) => {
      if (accum !== '') accum += '\n';
      return `${accum}import * as _DynamicImportModule${i} from '${path}';`;
    }, '');

    let objectMapString = 'const _DynamicImportModuleMap = {';

    for (const [key, value] of moduleMap) {
      objectMapString += `'${key}':${value},`;
    }

    // remove the extra comma added and add the closing bracket and semicolon
    objectMapString = objectMapString.replace(/.$/, '};');

    const importFunctionString = `function _DynamicImport(path) {const mod=_DynamicImportModuleMap[path];mod[Symbol.toStringTag]='Module';return Promise.resolve(mod); }`;

    const jsStr = `${importString}\n${objectMapString}\n${importFunctionString}\n`;

    for (const importData of importsToReplace) {
      fileContents = fileContents.replace(importData.fullImport, `_DynamicImport(${importData.pathString})`);
    }

    fileContents = jsStr + fileContents;
  }
  return fileContents;
}
