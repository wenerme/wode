import fs from 'node:fs/promises';
import path from 'node:path';
import { createChildLogger, createLogger, type Logger } from '@wener/utils';
import type { Browser, PuppeteerLaunchOptions } from 'puppeteer';
import { connect } from './connect';

export interface LaunchOptions {
  name?: string;
  dataDir?: string;
  cacheDir?: string;
  defaultViewport?: { width: number; height: number };
  args?: string[];
  logger?: Logger;
  plugins?: { adblock?: boolean };
  options?: PuppeteerLaunchOptions;
}

export async function launch({
  name: uid = 'default',
  dataDir = process.env.BROWSER_DATA_DIR || 'data/browsers',
  cacheDir = path.join(dataDir, 'cache'),
  defaultViewport = { width: 1265, height: 617 },
  plugins: { adblock = false } = {},
  args = [],
  ...options
}: LaunchOptions) {
  const logger = createChildLogger(options.logger ?? createLogger(), { uid });
  const userDataDir = path.join(dataDir, uid);

  // try reconnect
  {
    try {
      const browser = await connect({
        name: uid,
        dataDir,
        cacheDir,
        ...options,
      });
      if (browser) {
        return { browser, reuse: true };
      }
    } catch (error) {
      logger.debug(`Failed to connect browser: ${error}`);
    }

    logger.info('Browser is not running');
  }

  // prepare & cleanup
  await fs.mkdir(userDataDir, { recursive: true });
  // rm -rf $DataDir/Singleton*
  try {
    await fs.rm(path.join(userDataDir, 'SingletonSocket'), { force: true });
    await fs.rm(path.join(userDataDir, 'SingletonCookie'), { force: true });
    await fs.rm(path.join(userDataDir, 'SingletonLock'), { force: true });
  } catch (error) {
    logger.warn({ error }, 'remove Singleton* failed');
  }

  const extraArgs = (process.env.PUPPETEER_LAUNCH_ARGS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const finalArgs = [
    // '--start-maximized',
    // '--disable-gpu'，
    // '--no-sandbox', // root 启动
    // `--proxy-server=127.0.0.1:8080`,
    ...extraArgs,
    ...args,
    ...(options.options?.args || []),
  ];

  const { default: puppeteer } = await import('puppeteer');
  let browser: Browser;
  try {
    const launchOptions: PuppeteerLaunchOptions = {
      headless: false,
      userDataDir,
      channel: 'chrome',
      defaultViewport,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      // 不退出
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      ...options.options,
      args: finalArgs,
    };
    logger.info(launchOptions, 'launching browser');
    browser = await puppeteer.launch(launchOptions);
    logger.info(
      {
        uid,
        endpoint: browser.wsEndpoint(),
      },
      'browser launched',
    );
  } catch (error) {
    logger.error({ uid, error: String(error) }, 'launch browser failed');
    throw error;
  }

  return { browser };
}
