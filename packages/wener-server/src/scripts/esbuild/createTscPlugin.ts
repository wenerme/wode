import { readFile } from 'node:fs/promises';
import { transform } from '@swc/core';
import type { Plugin } from 'esbuild';

const theFinder = new RegExp(/((?<![(\s]\s*['"])@\w*[\w\d]\s*(?![;])[((?=\s)])/);

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
	tsconfigPath: _tsconfigPath,
	force: forceTsc = false,
	tsx = true,
}: TscPluginOptions = {}): Plugin => ({
	name: 'tsc',
	setup(build) {
		build.onLoad({ filter: tsx ? /\.tsx?$/ : /\.ts$/ }, async (args) => {
			const source = await readFile(args.path, 'utf8');

			// Find the decorator and if there isn't one, return out
			if (!forceTsc && !findDecorators(source)) {
				return;
			}

			const result = await transform(source, {
				filename: args.path,
				swcrc: false,
				sourceMaps: false,
				jsc: {
					parser: {
						syntax: 'typescript',
						decorators: true,
						tsx: args.path.endsWith('.tsx'),
					},
					target: 'es2022',
					transform: {
						legacyDecorator: true,
						decoratorMetadata: true,
						useDefineForClassFields: false,
					},
				},
				module: { type: 'es6' },
			});
			return { contents: result.code, loader: 'js' };
		});
	},
});
