import dayjs from 'dayjs';
import { z } from 'zod';
import { EntityManager } from '@mikro-orm/core';
import { HttpException, Logger } from '@nestjs/common';
import { type RegistryPackage } from '@wener/unpkg';
import { FetchLike } from '@wener/utils';
import { PackageMeta } from './entity/PackageMeta';

export interface RegistryMetaStoreInit {
  em: EntityManager;
  registry?: string;
  fetch?: FetchLike;
}

export class RegistryMetaStore {
  private readonly log = new Logger('RegistryMetaStore');
  private readonly em: EntityManager;
  private readonly registry: string;
  private readonly fetch: FetchLike;

  constructor({ em, registry = 'https://registry.npmjs.org', fetch = globalThis.fetch }: RegistryMetaStoreInit) {
    this.em = em;
    this.registry = registry;
    this.fetch = fetch;
  }

  async getPackageMeta(pkg: string) {
    if (!PackageNameSchema.safeParse(pkg).success) {
      throw new HttpException('Invalid package name', 400);
    }

    const { em, registry, fetch, log } = this;
    let repo = em.getRepository(PackageMeta);
    let last = await repo.findOne(pkg);
    let stale = !last;
    if (last) {
      // 15m
      stale = dayjs().unix() - dayjs(last.updatedAt).unix() > 15 * 60;
    }
    if (stale) {
      log.debug(`[${pkg}] fetch, last ${last?.updatedAt}`);
      const meta: RegistryPackage = await fetch(`${registry}/${pkg}`).then((v) => v.json());
      if (meta.name !== pkg) {
        throw new HttpException('Invalid package', 400);
      }
      last = await repo.upsert({
        name: meta.name,
        createdAt: meta.time.created,
        updatedAt: meta.time.modified,
        meta,
      });
      await repo.persistAndFlush(last);
    }
    return last!;
  }
}

export const PackageNameSchema = z.string().regex(/[-0-9a-z]+|@[0-9a-z]\/[0-9a-z]/);
