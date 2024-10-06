import { createChildLogger, sleep, type Logger } from '@wener/utils';
import { type Browser, type ElementHandle, type Page } from 'puppeteer-core';
import { YqdzUrls } from './const';
import { getSession } from './getSession';

export interface RunLoginFlowOptions {
  browser: Browser;
  username: string;
  password: string;
  reload?: boolean;
  force?: boolean;
  close?: boolean;
  logger?: Logger;
  page?: Page;
}

export async function runLoginFlow({
  browser,
  logger = console,
  username,
  password,
  force = false,
  reload = true,
  close = true,
  page: previousPage,
}: RunLoginFlowOptions) {
  // fixme 如果重定向到了 https://17dz.com/home/loginUpdate.html 则说明在升级
  logger = createChildLogger(logger, { action: '17dz/login' });

  const {
    login,
    cookie,
    page: sessionPage,
  } = await getSession({
    browser,
    logger,
    page: previousPage,
    reload,
  });
  if (login && !force) {
    logger.info('session valid, skip login');
    if (close) {
      await sessionPage.close();
    }

    return { cookie, page: close ? undefined : sessionPage };
  }

  if (force) {
    logger.info('session valid, force login');
  }

  const page = sessionPage;
  if (page.url().startsWith(YqdzUrls.login)) {
  } else {
    await page.goto(YqdzUrls.login, { waitUntil: 'networkidle0' });
  }

  try {
    logger.info(`login with ${username}`);
    const loginContainer = (await page.waitForSelector('div.password-login-container')) as ElementHandle;
    // const loginFrame = await loginContainer.contentFrame();
    if (!loginContainer) {
      throw new Error('loginFrame not found');
    }

    const $username = await loginContainer.$('.phone-input input');
    const $password = await loginContainer.$('input[type=password]');
    if (!$username || !$password) {
      throw new Error('username or password input not found');
    }

    await $username.click({ clickCount: 3, button: 'left' });
    await $username.type(username);
    await $password.click({ clickCount: 3, button: 'left' });
    await $password.type(password);

    logger.debug('enter account info');
    await sleep(300);

    await loginContainer.evaluate(() => {
      const check = document.querySelector('.password-login-container input[type=checkbox]')! as HTMLInputElement;
      if (!check?.checked) {
        check?.parentElement?.click();
      }
    });

    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type=button]'),
    ]);

    const url = response?.url();
    if (url?.startsWith(YqdzUrls.login)) {
      throw new Error('login failed');
    }

    logger.info(`login to ${url}`);

    return {
      cookie: await page.cookies(),
      page: close ? undefined : page,
    };
  } catch (error) {
    logger.error({ error }, 'login failed');
    throw error;
  } finally {
    if (close) {
      await page.close();
    }
  }
}
