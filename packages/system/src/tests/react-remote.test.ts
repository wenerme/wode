import React from 'react';
import test, { ExecutionContext } from 'ava';
import { createNoopLogger } from '@wener/utils';
import { polyfillBrowser } from '@wener/utils/server';
import { loadBrowserSystem } from '../loaders/loadBrowserSystem';
import { addPreload } from '../utils/addPreload';
import { getGlobalSystem, SystemJS } from '../utils/getGlobalSystem';

test.before(async (t) => {
  await polyfillBrowser();
  t.truthy(fetch);
  t.truthy(window);
  t.truthy(document);
  await loadBrowserSystem({ script: false, logger: createNoopLogger() });
});

test('React render using remote', async (t) => {
  t.timeout(30_000, 'networking high latency');
  const System = getGlobalSystem();

  // dev env - can not get react dev build
  // addPreload('react', await System.import('react/dev.index.js'));
  // addPreload('react/jsx-runtime', await System.import('react/dev.jsx-runtime.js'));
  // addPreload('react-dom/test-utils', await System.import('react-dom/dev.test-utils.js'));
  // addPreload('react-dom/client', await System.import('react-dom/dev.client.js'));

  addPreload('util', () => import('node:util'));
  addPreload('stream', () => import('node:stream'));

  t.not((await System.import('react')).isValidElement, React.isValidElement);
  await testReactRender(t, System);
});

export async function testReactRender(t: ExecutionContext, System: SystemJS) {
  const ReactDOMServer = await System.import('react-dom/server');
  const React = await System.import('react');
  const { ErrorSuspenseBoundary } = await System.import('@wener/reaction');
  // let mounted = false;
  // ac not works in System env
  const Comp = () => {
    React.useEffect(() => {
      // mounted = true;
      t.log(`mounted`);
    }, []);
    return React.createElement('span', {}, 'Hello');
  };
  const ele = React.createElement(ErrorSuspenseBoundary, {}, React.createElement(Comp, {}));
  t.is(ReactDOMServer.renderToString(ele), `<!--$--><span>Hello</span><!--/$-->`);

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
