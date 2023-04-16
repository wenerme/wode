import dotenv from 'dotenv';

export async function loadEnvs() {
  const log = console;
  const { NODE_ENV: mode = 'production' } = process.env;
  Object.assign(process.env, {
    NODE_ENV: mode,
  });
  const envs = [`.env.${mode}.local`, `.env.${mode}`, `.env.local`, `.env`];
  for (const env of envs) {
    if (!dotenv.config({ path: env }).error) {
      log.info(`loaded env from \`${env}\``);
    }
  }
}
