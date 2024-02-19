import fs from 'node:fs/promises';
import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApkIndexEntity } from '../entity/ApkIndexEntity';
import { RepoClient } from './RepoClient';
import { parseApkIndexArchive } from './parseApkIndexArchive';

function byteLength(str: string) {
  // returns the byte length of an utf8 string
  let s = str.length;
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
  }
  return s;
}

export interface FetchApkIndexOptions {
  force?: boolean;
  variants: {
    branches: string[];
    architectures: string[];
    repos: string[];
  }[];
  em: EntityManager;
}

export async function fetchApkIndex({ variants, em, force }: FetchApkIndexOptions) {
  // get path list
  const paths = variants.flatMap((v) => {
    return v.branches.flatMap((branch) => {
      return v.architectures.flatMap((arch) => {
        return v.repos.map((repo) => {
          return `${branch}/${repo}/${arch}`;
        });
      });
    });
  });

  let repo = em.getRepository(ApkIndexEntity);
  let foundAll: ApkIndexEntity[] = [];
  if (!force) {
    foundAll = await repo.findAll({
      where: {
        path: { $in: paths },
      },
      fields: ['path', 'description'],
    });
  }

  const stats = {
    total: paths.length,
    size: 0,
    changed: 0,
  };
  let indexes: EntityData<ApkIndexEntity>[] = [];
  const client = new RepoClient();

  for (const { branches, repos, architectures } of variants) {
    for (let branch of branches) {
      for (let arch of architectures) {
        for (let repo of repos) {
          const cc = client.with({ branch, arch, repo });
          let path = `${branch}/${repo}/${arch}`;
          let found: ApkIndexEntity | undefined = foundAll.find((v: ApkIndexEntity) => v.path === path);
          const data = await parseApkIndexArchive(await fetch(cc.buildPackageIndexUrl()).then((v) => v.body!), {
            skip: ({ content, name }) => {
              // this is large, avoid load in memory
              if (!force && name === 'APKINDEX') {
                if (found?.description === content.description) {
                  return true;
                }
              }
              return false;
            },
          });
          const { apkindex, description, mtime } = data;
          let size = byteLength(apkindex) || found?.size || 0;
          stats.size += size;
          indexes.push({
            path: path,
            branch,
            arch,
            repo,
            description,
            lastModifiedTime: mtime,
            content: apkindex,
            size,
          });
        }
      }
    }
  }
  const changed = indexes.filter((v) => v.content);
  stats.changed = changed.length;

  for (let data of changed) {
    if (!data.content) {
      throw new Error(`content is missing: ${data.path}`);
    }
    await fs.mkdir(`/tmp/cache/alpine/${data.path}`, { recursive: true });
    await fs.writeFile(`/tmp/cache/alpine/${data.path}/APKINDEX-${data.description}.txt`, data.content!);
  }

  let changedEntities: ApkIndexEntity[] = [];
  if (changed.length) {
    changedEntities = await em.upsertMany(
      ApkIndexEntity,
      // content is too large
      changed.map(({ content, ...rest }) => {
        return rest;
      }),
      {
        onConflictFields: ['path'],
        onConflictMergeFields: ['description', 'lastModifiedTime', 'size'],
      },
    );
  }

  return {
    stats,
    changed: changedEntities,
    found: foundAll,
  };
}
