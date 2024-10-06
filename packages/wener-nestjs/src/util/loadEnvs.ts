import fs from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import dotenv from 'dotenv';

/**
 * Load `.env[.{name.env|name|profile|env}][.local]`
 */
export async function loadEnvs({
  log = new Logger(loadEnvs.name),
  name,
  env = process.env.NODE_ENV || 'development',
  profiles = process.env.NODE_PROFILES?.split(',').filter(Boolean) || [],
}: {
  name?: string;
  env?: string;
  profiles?: string[];
  log?: Logger;
} = {}) {
  profiles = profiles.filter(Boolean);

  const files = [`.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'];
  for (let profile of profiles) {
    files.unshift(`.env.${profile}.local`, `.env.${profile}`);
  }
  if (name) {
    files.unshift(`.env.${name}.${env}.local`, `.env.${name}.${env}`, `.env.${name}.local`, `.env.${name}`);

    for (let profile of profiles) {
      files.unshift(`.env.${name}.${profile}.local`, `.env.${name}.${profile}`);
    }
  }
  for (const v of files) {
    try {
      await fs.stat(v);
    } catch (e) {
      continue;
    }
    if (!dotenv.config({ path: v }).error) {
      log.log(`Load env from ${v}`);
    }
  }
}
