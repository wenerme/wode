import { Logger } from '@nestjs/common';
import dotenv from 'dotenv';

export async function loadEnvs({ log = new Logger('loadEnvs') }: { log?: Logger } = {}) {
  const { NODE_ENV: mode = 'production' } = process.env;
  Object.assign(process.env, {
    NODE_ENV: mode,
  });
  const envs = [`.env.${mode}.local`, `.env.${mode}`, `.env.local`, `.env`];
  for (const env of envs) {
    if (!dotenv.config({ path: env }).error) {
      log.debug(`loaded env from \`${env}\``);
    }
  }
}
