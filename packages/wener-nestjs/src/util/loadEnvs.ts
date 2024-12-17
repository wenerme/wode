import fs from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import dotenv from 'dotenv';

/**
 * Load `.env[.{name.env|name|profile|env}][.local]`
 */
export async function loadEnvs({
  log = new Logger(loadEnvs.name),
  name,
  mode = process.env.NODE_ENV,
  env = process.env.APP_ENV,
  profiles = process.env.NODE_PROFILES?.split(',').filter(Boolean) || [],
}: {
  name?: string;
  mode?: string; // NODE_ENV - What mode is current running
  env?: string; // APP_ENV - Which env we want to run in
  profiles?: string[];
  log?: Logger;
} = {}) {
  profiles = profiles.filter(Boolean);

  const files = [`.env.local`, '.env'];
  if (mode === env) {
    env = undefined;
  }
  if (mode) {
    files.unshift(`.env.${mode}.local`, `.env.${mode}`);
  }
  if (env) {
    files.unshift(`.env.${env}.local`, `.env.${env}`);
  }
  for (let profile of profiles) {
    files.unshift(`.env.${profile}.local`, `.env.${profile}`);
  }
  if (name) {
    files.unshift(`.env.${name}.local`, `.env.${name}`);
    if (mode) {
      files.unshift(`.env.${name}.${mode}.local`, `.env.${name}.${mode}`);
    }
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
