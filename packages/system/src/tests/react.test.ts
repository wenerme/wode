import React from 'react';
import test, { ExecutionContext } from 'ava';
import { createNoopLogger } from '@wener/utils';
import { loadBrowserSystem } from '../loaders/loadBrowserSystem';
import { addPreload } from '../utils/addPreload';
import { getGlobalSystem, SystemJS } from '../utils/getGlobalSystem';
import { browserEnv } from '../utils/testing/browserEnv';

test.before(async (t) => {
  await browserEnv();
  t.truthy(fetch);
  t.truthy(window);
  t.truthy(document);
  await loadBrowserSystem({ script: false, logger: createNoopLogger() });
});

test('nested resolve', async (t) => {
  // https://ga.system.jspm.io/npm:prop-types@15.8.1/index.js
  // will import "./_/eb83dd95.js"
  const System = getGlobalSystem();
  t.truthy(await System.import('prop-types'));
  t.log('====== Second import');
  t.truthy(await System.import('prop-types'));
});

test('subpath resolve', async (t) => {
  // https://cdn.jsdelivr.net/npm/@heroicons/react@2.0.11/20/solid/
  const System = getGlobalSystem();
  t.truthy((await System.import('@heroicons/react@2.0.11/20/solid')).AdjustmentsHorizontalIcon);
});

test('React render using preload', async (t) => {
  t.timeout(30_000, 'networking high latency');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  const System = getGlobalSystem();
  t.truthy(System);

  const BuiltinModules = {
    react: () => import('react'),
    'react/jsx-runtime': () => import('react/jsx-runtime'),
    'react-dom': () => import('react-dom'),
    'react-dom/client': () => import('react-dom/client'),
    'react-dom/test-utils': () => import('react-dom/test-utils'),
  };
  Object.entries(BuiltinModules).map(([k, v]) => addPreload(k, v));
  // same
  t.is((await System.import('react')).isValidElement, React.isValidElement);
  await testReactRender(t, System);
});

export async function testReactRender(t: ExecutionContext, System: SystemJS) {
  const { ErrorSuspenseBoundary } = await System.import('@wener/reaction');
  const React = await System.import('react');

  let mounted = false;
  const Comp = () => {
    React.useEffect(() => {
      mounted = true;
      t.log(`mounted`);
    }, []);
    return React.createElement('span', {}, 'Hello');
  };

  let $root = document.createElement('div');
  const ReactTestUtils = await System.import('react-dom/test-utils');
  const ReactDOMClient = await System.import('react-dom/client');
  ReactTestUtils.act(() => {
    ReactDOMClient.createRoot($root).render(
      React.createElement(ErrorSuspenseBoundary, {}, React.createElement(Comp, {})),
    );
  });

  t.is($root.innerHTML, '<span>Hello</span>');
  t.true(mounted);
}
