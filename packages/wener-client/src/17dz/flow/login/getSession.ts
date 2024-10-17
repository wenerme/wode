import { createChildLogger, type Logger } from '@wener/utils';
import type { Browser, Frame, Page } from 'puppeteer-core';
import { getLoginSession } from '../../operator';
import { YqdzUrls } from './const';
import { cookieToString } from './cookieToString';

/**
 * 尝试获取会话信息，如果失效则登录
 */
export async function getSession({
  browser,
  page: lastPage,
  logger = console,
  close = false,
  reload = false,
}: {
  browser: Browser;
  page?: Page;
  logger?: Logger;
  close?: boolean;
  reload?: boolean;
}) {
  logger = createChildLogger(logger, { action: '17dz/getSession' });

  lastPage ||= await browser.pages().then((v) => v.find((vv) => vv.url().startsWith(YqdzUrls.admin)));
  lastPage ||= await browser.newPage();
  const page: Page = lastPage;

  // try direct access
  if (!page.url().startsWith(YqdzUrls.admin)) {
    await page.goto(YqdzUrls.admin, { waitUntil: 'networkidle2' });
  }

  // verify cookie valid
  let valid = page.url().startsWith(YqdzUrls.admin);
  if (valid) {
    logger.debug('detect valid previous session page');

    const cookie = await page.cookies();
    try {
      const { accountId, accountName, companyId, companyName } = await getLoginSession({
        cookie: cookieToString(cookie),
      });
      logger.debug(`getLoginSession success: ${accountId} ${accountName} ${companyId} ${companyName}`);
      return {
        login: true,
        cookie,
        page,
      };
    } catch (error: any) {
      logger.debug(`getLoginSession failed: ${error}`);
      valid = false;
    }
  }

  let login = true;
  const handler = (frame: Frame) => {
    const url = frame.url();
    logger.info(`frame navigated to: ${url}`);
    if (url === YqdzUrls.login) {
      login = false;
      logger.info('detect redirect to login page');
      page?.off('framenavigated', handler);
    }
  };

  page.on('framenavigated', handler);
  try {
    await (valid && reload
      ? page.reload({ waitUntil: 'networkidle2' })
      : page.goto(YqdzUrls.admin, { waitUntil: 'networkidle2' }));
  } finally {
    page.off('framenavigated', handler);
  }

  // 可能会在前端跳转
  login = await page.evaluate(() => document.querySelectorAll('.mg-navigation-loginInfo').length > 0);

  logger.info(`is login ${login}`);

  return {
    login,
    cookie: login ? await page.cookies() : [],
    page,
  };
}
