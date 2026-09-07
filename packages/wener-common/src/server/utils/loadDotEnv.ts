import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { Logger } from '@wener/utils/logger';
import consola from 'consola';

import { parseDotEnv } from './parseDotEnv';
import { uniq } from 'es-toolkit';

export interface LoadDotEnvOptions {
  /** Paths ordered from highest to lowest precedence. */
  files?: readonly string[];
  cwd?: string;
  log?: Logger;
  name?: string;
  mode?: string;
  env?: string;
  profiles?: readonly string[];
  envs?: Record<string, string | undefined>;
  autoConfig?: boolean;
  strict?: boolean;
}

export async function loadDotEnv({
                                   cwd = process.cwd(),
                                   files,
                                   log = consola,
                                   autoConfig = false,
                                   envs = globalThis.process?.env ?? {},
                                   profiles = envs.NODE_PROFILES?.split(',') ?? [],
                                   name = envs.APP_NAME,
                                   mode = envs.NODE_ENV,
                                   env = envs.APP_ENV,
                                   strict = true,
                                 }: LoadDotEnvOptions = {}): Promise<Record<string, string>> {
  const resolvedFiles = files ? uniq(files) : resolveDefaultDotEnvFiles({name, mode, env, profiles});
  const out: Record<string, string> = {};

  for (const file of [...resolvedFiles].reverse()) {
    const path = resolve(cwd, file);
    try {
      Object.assign(out, parseDotEnv(await readFile(path, 'utf8')));
      log.debug(`Loaded env vars from ${path}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      if (strict) throw new Error(`Failed to load env file ${path}`, {cause: error});
      log.warn(`Failed to load env file ${path}`);
    }
  }

  if (autoConfig) {
    for (const [key, value] of Object.entries(out)) {
      if (envs[key] === undefined) envs[key] = value;
    }
  }

  return out;
}

function resolveDefaultDotEnvFiles({
                                     name,
                                     mode,
                                     env,
                                     profiles,
                                   }: {
  name: string | undefined;
  mode: string | undefined;
  env: string | undefined;
  profiles: readonly string[];
}): string[] {
  const appName = normalizeSelector(name, 'name');
  const nodeMode = normalizeSelector(mode, 'mode');
  let appEnv = normalizeSelector(env, 'env');
  if (appEnv === nodeMode) appEnv = undefined;

  const profileNames = [
    ...uniq((profiles ?? []).map((value) => normalizeSelector(value, 'profile')).filter(Boolean)),
  ].filter((value) => value !== nodeMode && value !== appEnv) as string[];
  const highToLow: string[] = [];
  const addPair = (selector: string): void => {
    highToLow.push(`.env.${selector}.local`, `.env.${selector}`);
  };

  if (appName) {
    for (const profile of [...profileNames].reverse()) addPair(`${appName}.${profile}`);
    if (appEnv) addPair(`${appName}.${appEnv}`);
    if (nodeMode) addPair(`${appName}.${nodeMode}`);
    addPair(appName);
  }
  for (const profile of [...profileNames].reverse()) addPair(profile);
  if (appEnv) addPair(appEnv);
  if (nodeMode) addPair(nodeMode);
  highToLow.push('.env.local', '.env');

  return uniq(highToLow);
}

function normalizeSelector(value: string | undefined, label: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/u.test(normalized)) {
    throw new Error(`Invalid dotenv ${label} selector`);
  }
  return normalized;
}
