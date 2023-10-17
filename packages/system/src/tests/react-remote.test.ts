import React from 'react';
import { createNoopLogger } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { polyfillJsDom } from '@wener/utils/server/jsdom';
import { polyfillWebSocket } from '@wener/utils/server/ws';
import { assert, beforeAll, expect, test, TestContext } from 'vitest';
import { loadBrowserSystem } from '../loaders/loadBrowserSystem';
import { addPreload } from '../utils/addPreload';
import type { SystemJS } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';

export async function polyfillBrowser() {
  await polyfillJsDom();
  await polyfillWebSocket();
  await polyfillCrypto();
}

beforeAll(async () => {
  await polyfillBrowser();
  expect(fetch).toBeTruthy();
  expect(window).toBeTruthy();
  expect(document).toBeTruthy();
  await loadBrowserSystem({ script: false, logger: createNoopLogger() });
});

test('React render using remote', async (t) => {
  const System = getGlobalSystem();

  // dev env - can not get react dev build
  // addPreload('react', await System.import('react/dev.index.js'));
  // addPreload('react/jsx-runtime', await System.import('react/dev.jsx-runtime.js'));
  // addPreload('react-dom/test-utils', await System.import('react-dom/dev.test-utils.js'));
  // addPreload('react-dom/client', await System.import('react-dom/dev.client.js'));

  addPreload('util', () => import('node:util'));
  addPreload('stream', () => import('node:stream'));

  assert.notEqual((await System.import('react')).isValidElement, React.isValidElement);
  await testReactRender(t, System);
}, 60_000);

export async function testReactRender(_: TestContext, System: SystemJS) {
  const ReactDOMServer = await System.import('react-dom/server');
  const React = await System.import('react');
  const { ErrorSuspenseBoundary } = await System.import('@wener/reaction');
  // let mounted = false;
  // ac not works in System env
  const Comp = () => {
    React.useEffect(() => {
      // mounted = true;
      console.log(`mounted`);
    }, []);
    return React.createElement('span', {}, 'Hello');
  };
  const ele = React.createElement(ErrorSuspenseBoundary, {}, React.createElement(Comp, {}));
  assert.equal(ReactDOMServer.renderToString(ele), `<!--$--><span>Hello</span><!--/$-->`);

  // Not works in pure System env - maybe caused by not dev build
  // const ReactTestUtils = await System.import('react-dom/test-utils');
  // ReactTestUtils.act(() => {
  //   ReactDOMClient.createRoot($root).render(
  //     React.createElement(ErrorSuspenseBoundary, {}, React.createElement(Comp, {})),
  //   );
  // });
  // t.is($root.innerHTML, '<span>Hello</span>');
  // t.true(mounted);
}
