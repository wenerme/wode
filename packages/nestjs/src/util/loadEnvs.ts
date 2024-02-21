import fs from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import dotenv from 'dotenv';

export async function loadEnvs({
  log = new Logger(loadEnvs.name),
  name,
  env = process.env.NODE_ENV || 'development',
}: { name?: string; env?: string; log?: Logger } = {}) {
  const envs = [`.env.${env}.local`, `.env.${env}`, `.env.local`, '.env'];
  if (name) {
    envs.unshift(`.env.${name}.${env}.local`, `.env.${name}.${env}`, `.env.${name}.local`, `.env.${name}`);
  }
  for (const v of envs) {
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
