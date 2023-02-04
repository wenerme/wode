#!/usr/bin/env zx
import fs from 'fs-extra';
import { argv, chalk, glob } from 'zx';
import 'zx/globals';
import { parseBoolean } from '@wener/utils';
import { readApkBuild, writeApkBuild } from './utils/apkbuild';
import { getAportsRepos, readAportsContext } from './utils/aports';
import { ParsedPackageId, parsePackageId } from './utils/pkg';

if (argv.cwd) {
  cd(argv.cwd);
}
const aports = await readAportsContext();

let ids: ParsedPackageId[] = [];
for (let pkg of argv._) {
  let id = parsePackageId(pkg);
  if (!id) {
    for (let repo of getAportsRepos()) {
      if (await fs.exists(path.join(aports.root, repo, pkg))) {
        id = parsePackageId(`${repo}/${pkg}`);
        break;
      }
    }
  }
  if (!id) {
    throw new Error(`Invalid package id: ${pkg}`);
  }
  ids.push(id);
}

if (ids.length) {
  console.log(`Upgrade packages: ${ids.map((v) => v.path).join(', ')}`);
  console.log(`pwd: ${process.cwd()}`);
  console.log(`aports: ${aports.root}`);
}

for (const id of ids) {
  await upgrade({
    pkg: id,
    dry: parseBoolean(argv['dry-run']),
  });
}

async function upgrade({ pkg, dry = false }: { pkg: ParsedPackageId; dry?: boolean }) {
  pkg.branch ||= 'edge';
  if (pkg.branch === 'edge') {
    await $`git switch master`;
  }
  const log = (...args: any[]) => console.log(`${chalk.green(pkg.path)}: `, ...args);
  log('upgrade');
  const aports = await readAportsContext();
  cd(path.join(aports.root, pkg.path));

  await $`git restore -WS APKBUILD`;
  const { ver, sources } = await readApkBuild();

  const { owner, repo } = sources[0]?.match(/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)/)?.groups || {};
  if (!owner && !repo) {
    throw new Error(`Unable to detect next version: ${sources}`);
  }
  const info = await fetch(`https://apis.wener.me/api/github/r/${owner}/${repo}/version`).then((v) => v.json());
  let next = info.version;
  // 匹配格式
  switch (pkg.pkg) {
    case 'seaweedfs':
      next = info.tag;
      break;
    case 'fio':
      // 默认排序取到的是 calver
      // https://apis.wener.me/api/github/r/axboe/fio/version?range=3
      break;
    case 'grpc':
  }
  if (!next) {
    throw new Error(`Failed to get next version: ${sources}`);
  }
  if (next === ver) {
    log(`${ver} unchanged`);
    return false;
  }
  const gitBranch = `${pkg.branch}/${pkg.path}/${next}`;
  await $`git checkout -B ${gitBranch}`;

  await fs.writeFile(
    'APKBUILD.next',
    await writeApkBuild({
      ver: next,
      rel: 0,
      write: false,
    }),
  );
  await $`diff APKBUILD APKBUILD.next || true`;

  await $`cp APKBUILD.next APKBUILD`;
  await $`abuild clean checksum unpack prepare`;

  if (dry) {
    await $`git add -u .`;
    await $`git commit -m "${pkg.path}: upgrade to ${next}"`;
  }
}
