import React from 'react';
import { createNoopLogger } from '@wener/utils';
import { assert, beforeAll, expect, test, TestContext } from 'vitest';
import { loadBrowserSystem } from '../loaders/loadBrowserSystem';
import { addPreload } from '../utils/addPreload';
import type { SystemJS } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';
import { polyfillBrowser } from './react-remote.test';

beforeAll(async () => {
  await polyfillBrowser();
  await loadBrowserSystem({ script: false, logger: createNoopLogger() });
});

test('nested resolve', async () => {
  // https://ga.system.jspm.io/npm:prop-types@15.8.1/index.js
  // will import "./_/eb83dd95.js"
  const System = getGlobalSystem();
  expect(await System.import('prop-types')).toBeTruthy();
  console.log('====== Second import');
  expect(await System.import('prop-types')).toBeTruthy();
}, 30_000);

test('subpath resolve', async () => {
  // https://cdn.jsdelivr.net/npm/@heroicons/react@2.0.11/20/solid/
  const System = getGlobalSystem();
  expect((await System.import('@heroicons/react@2.0.11/20/solid')).AdjustmentsHorizontalIcon).toBeTruthy();
}, 30_000);

test('React render using preload', async (t) => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  const System = getGlobalSystem();
  expect(System).toBeTruthy();

  const BuiltinModules = {
    react: () => import('react'),
    'react/jsx-runtime': () => import('react/jsx-runtime'),
    'react-dom': () => import('react-dom'),
    'react-dom/client': () => import('react-dom/client'),
    'react-dom/test-utils': () => import('react-dom/test-utils'),
  };
  Object.entries(BuiltinModules).map(([k, v]) => addPreload(k, v));
  // same
  assert.equal((await System.import('react')).isValidElement, React.isValidElement);
  await testReactRender(t, System);
}, 30_000);

export async function testReactRender(_: TestContext, System: SystemJS) {
  const { ErrorSuspenseBoundary } = await System.import('@wener/reaction');
  const React = await System.import('react');

  let mounted = false;
  const Comp = () => {
    React.useEffect(() => {
      mounted = true;
      console.log(`mounted`);
    }, []);
    return React.createElement('span', {}, 'Hello');
  };

  const $root = document.createElement('div');
  const ReactTestUtils = await System.import('react-dom/test-utils');
  const ReactDOMClient = await System.import('react-dom/client');
  ReactTestUtils.act(() => {
    ReactDOMClient.createRoot($root).render(
      React.createElement(ErrorSuspenseBoundary, {}, React.createElement(Comp, {})),
    );
  });

  assert.equal($root.innerHTML, '<span>Hello</span>');
  assert.isTrue(mounted);
}
