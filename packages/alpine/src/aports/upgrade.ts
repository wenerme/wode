#!/usr/bin/env zx
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fs from 'fs-extra';
import * as semver from 'semver';
import { argv, chalk, ProcessOutput } from 'zx';
import 'zx/globals';
import { parseBoolean } from '@wener/utils';
import { readApkBuild, writeApkBuild } from './utils/apkbuild';
import { getAportsRepos, readAportsContext } from './utils/aports';
import { ParsedPackageId, parsePackageId } from './utils/pkg';

export function getDayjs() {
  return (getDayjs.dayjs ||= (() => {
    dayjs.extend(relativeTime);
    dayjs.extend(duration);
    dayjs.extend(advancedFormat);
    dayjs.extend(isToday);
    dayjs.extend(dayOfYear);
    // dayjs.extend(quarterOfYear);
    // dayjs.extend(localeData);
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.locale('zh-cn');
    dayjs.tz.setDefault('Asia/Shanghai');
    return dayjs;
  })());
}

getDayjs.dayjs = undefined as any as typeof dayjs;

if (argv.cwd) {
  cd(argv.cwd);
}

await $`git switch master`;
const aports = await readAportsContext();

let ids: ParsedPackageId[] = [];
for (let pkg of argv._) {
  let id = parsePackageId(pkg, true);
  if (!id) {
    throw new Error(`Invalid package id: ${pkg}`);
  }
  if (!id.repo) {
    console.debug(`Find package ${id.pkg} in aports repos...`);
    for (let repo of getAportsRepos()) {
      if (await fs.exists(path.join(aports.root, repo, id.pkg))) {
        id.repo = repo;
        id.path = `${repo}/${id.pkg}`;
        break;
      }
    }
  }
  if (!id || !id.repo) {
    console.log(`ID`, id);
    throw new Error(`Invalid package id: ${pkg}`);
  }
  ids.push(id as ParsedPackageId);
}

if (ids.length) {
  console.log(`Upgrade packages: ${ids.map((v) => v.path).join(', ')}`);
  console.log(`pwd: ${process.cwd()}`);
  console.log(`aports: ${aports.root}`);
}

if (ids.length === 1) {
  await upgrade({
    pkg: ids[0],
    next: argv['to'],
    dry: parseBoolean(argv['dry-run']),
  });
} else if (ids.length) {
  if (argv['to']) {
    throw new Error(`--to only support single package`);
  }
  for (const id of ids) {
    await upgrade({
      pkg: id,
      dry: parseBoolean(argv['dry-run']),
    });
  }
}

async function upgrade({ pkg, dry = false, next }: { pkg: ParsedPackageId; dry?: boolean; next?: string }) {
  pkg.branch ||= 'edge';
  if (pkg.branch === 'edge') {
    await $`git switch master`;
  } else {
    await $`git fetch origin ${pkg.branch}-stable`;
    await $`git switch ${pkg.branch}-stable`;
  }

  await $`git pull`;

  const log = (...args: any[]) => console.log(`${chalk.green(pkg.path)}: `, ...args);
  log('upgrade');
  const aports = await readAportsContext();
  cd(path.join(aports.root, pkg.path));

  await $`git restore -WS APKBUILD`;
  const mtime = getDayjs()(String(await $`git log -1 --pretty="format:%ci" APKBUILD`));
  console.log(`\nAPKBUILD last modified: ${mtime.fromNow()} (${mtime.format('YYYY-MM-DD HH:mm:ss')})`);
  const { ver, sources } = await readApkBuild();

  if (ver.includes('_')) {
    throw new Error(`unable to handle version: ${ver}`);
  }

  if (!next) {
    next = process.env[`${pkg.pkg}_next`];
  }

  if (!next) {
    const { owner, repo } = sources[0]?.match(/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)/)?.groups || {};
    if (!owner && !repo) {
      throw new Error(`Unable to detect next version: ${sources}`);
    }
    const url = new URL(`https://apis.wener.me/api/github/r/${owner}/${repo}/version`);
    let sv = semver.coerce(ver);
    url.searchParams.set('calver', String((sv?.major ?? 0) > 2000));
    if (pkg.branch !== 'edge') {
      // only path
      url.searchParams.set('range', `~${ver}`);
    }

    const info = await fetch(url).then((v) => v.json());
    // tag name without prefix v
    next = info.tag.replace(/^v/, '');
    // 匹配格式
    switch (pkg.pkg) {
      case 'seaweedfs':
      case 'fio':
      case 'frp':
      case 'grpc':
    }
  }
  if (!next) {
    throw new Error(`Failed to get next version: ${sources}`);
  }
  if (next === ver) {
    log(`${ver} unchanged`);
    return false;
  }

  const verBranch = `${pkg.branch}/${pkg.path}/${next}`;
  try {
    await $`git rev-parse --verify ${verBranch}`;
    log(`${verBranch} already exists`);
    return false;
  } catch (p) {
    if (p as ProcessOutput) {
      // p.exitCode
    }
    // not found
  }

  await $`git checkout -B ${verBranch}`;

  try {
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
    // check patch still valid
    await $`abuild clean checksum unpack prepare`;
  } catch (e) {
    await $`git switch -`;
    await $`git branch -D ${verBranch}`;
    throw e;
  }

  if (!dry) {
    await $`git add -u .`;
    await $`git commit -m "${pkg.path}: upgrade to ${next}"`;
    await $`git push gl`;
  }
}
