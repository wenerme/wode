#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '@wener/utils';
import { getPackageDir } from '@wener/utils/server';
import { Command } from 'commander';
import { $ } from 'execa';
import { runCommand } from '@/poc/cli/run';
import { createEsbuildCommand } from '@/poc/esbuild/createEsbuildCommand';

function createRootCommand() {
  // Node Dev
  const root = new Command('ndev').description('Devtool for NodeJS Dev');
  root
    .option('--debug', 'output extra debugging')
    .option('--dry-run', 'dry run')
    .version('0.0.1', '-v, --version', 'output the current version');

  root.addCommand(createPkgCommand());
  root.addCommand(createBuildCommand());
  root.addCommand(createRepoCommand());
  root.addCommand(createEsbuildCommand());
  root.addCommand(createJsonCommand());
  root.command('info').action(async () => {
    const o = {
      self: process.argv[1],
      cwd: process.cwd(),
      pkg_dir: getPackageDir(),
      repo_dir: await getRepoDir(),
    };
    Object.entries(o).forEach(([k, v]) => {
      console.log(`${k}: ${v}`);
    });
  });
  root.command('self-update').action(async () => {
    const f = process.argv[1];
    if (!f.endsWith('.mjs')) {
      console.error(`not mjs, skip update: ${path.basename(f)}`);
      return;
    }
    const next = await fetch('https://get.wener.me/ndev.mjs').then((v) => {
      if (!v.ok) {
        throw new Error(`failed to fetch: ${v.statusText}`);
      }
      return v.text();
    });
    await fs.writeFile(next, f);
    console.log(`update\nsha256 ${await sha256(next)}`);
  });

  return root;
}

runCommand(createRootCommand());

export function createJsonCommand() {
  const root = new Command('json');
  root
    .command('fmt <files...>')
    .option('-M,--minify')
    //
    .action(async (args: string[], opts) => {
      for (let arg of args) {
        let o = JSON.parse(await fs.readFile(arg, 'utf-8'));
        await fs.writeFile(arg, JSON.stringify(o, null, opts.minify ? 0 : 2));
      }
    });
  return root;
}

export function createBuildCommand() {
  const root = new Command('build');
  root.command('lib').action(async () => {
    await runBuildLib();
  });
  return root;
}

async function getRepoDir() {
  return (await $`git rev-parse --show-toplevel`).stdout;
}

export function createRepoCommand() {
  const root = new Command('repo');

  root.command('dir').action(async () => {
    console.log(await getRepoDir());
  });

  return root;
}

export function createPkgCommand() {
  const root = new Command('pkg');

  root.command('fmt').action(async () => {
    await runNormalizePackageJson();
  });
  root.command('dir').action(async () => {
    console.log(getPackageDir());
  });

  root.command('scan-dup').action(async () => {
    const out = await scanPnpmLockDup();
    console.log(JSON.stringify(out, null, 2));
  });

  return root;
}

async function runBuildLib() {
  $({});
  await $`rm -rf lib2`;
  await $`pnpm swc ./src -d ./lib2 --strip-leading-paths`;
  await $`npx -y ts-add-js-extension --dir=lib2`;
  await $`rsync ./src/ ./lib2/ -a --include="*.css" --include="*/" --exclude="*"`;
  await $({ reject: false })`mv lib lib3`;
  await $`mv lib2 lib`;
  await $`rm -rf lib3`;
}

async function runNormalizePackageJson() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  normalizePackageExports(pkg);
  await fs.writeFile('package.json', JSON.stringify(pkg, null, 2));
}

function normalizePackageExports(pkg: any) {
  if (!pkg.exports) {
    console.warn('no exports', pkg.name);
    return;
  }
  pkg.publishConfig ||= {};

  pkg.exports = map(pkg.exports, (v) => {
    if (typeof v === 'object' && v && Object.keys(v).length === 1 && 'default' in v) {
      return v.default;
    }
    return v;
  });

  // ./src/index.ts -> ./lib/index.js
  pkg.publishConfig.exports = map(pkg.exports, (v: any) => {
    let def = v.default || v;
    if (typeof def !== 'string') {
      return v;
    }
    if (!/(?![.]d)[.]m?tsx?$/.test(def)) {
      return v;
    }
    const vv = {
      types: def,
      default: def.replace(/^[.]\/src\//, './lib/').replace(/\.tsx?$/, '.js'),
    };
    return vv;
  });
}

function map(obj: any, fn: (v: any, k: string) => any) {
  const all = Object.entries(obj).map(([k, v]) => [k, fn(v, k)] as [string, any]);
  all.sort(([a], [b]) => sort(a, b));
  return Object.fromEntries(all);
}

function sort(a: string, b: string) {
  if (a.endsWith('/package.json') || a.endsWith('/*') || (a.includes('*') && !b.includes('*'))) {
    return 1;
  }
  if (b.endsWith('/package.json') || b.endsWith('/*') || (!a.includes('*') && b.includes('*'))) {
    return -1;
  }

  return a.localeCompare(b);
}

async function scanPnpmLockDup() {
  const deps = (await fs.readFile('./pnpm-lock.yaml', 'utf8'))
    .split('\n')
    .filter((v) => /^\s*[/]/.test(v))
    .map((v) => v.trim())
    .map((v) => {
      const { name, version, spec } =
        v.match(/^\/(?<name>(@[^\/]+\/)?[^@]+)@(?<version>[^:(]+)(\((?<spec>.*?)\))?:$/)?.groups || {};
      return { name, version, spec };
    });

  let dups: Record<string, { name: string; version: string; spec: string }[]> = {};
  for (const dep of deps) {
    if (!dep) continue;
    const { name, version, spec } = dep;
    if (!dups[name]) dups[name] = [];
    dups[name].push({ name, version, spec });
  }

  dups = Object.fromEntries(Object.entries(dups).filter(([, v]) => v.length > 1));

  return dups;
}

// https://github.com/pnpm/pnpm/tree/main/lockfile/lockfile-file
// import { type Lockfile, type ProjectSnapshot } from '@pnpm/lockfile-types'
// https://github.com/pnpm/pnpm/blob/main/lockfile/lockfile-types/src/index.ts
