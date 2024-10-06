import * as util from 'node:util';
import { act, useEffect, useState } from 'react';
import Reconciler, { type HostConfig } from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import { sleep } from '@wener/utils';
import { expect, test } from 'vitest';
import { renderReactNodeToMarkdown } from './renderReactNodeToMarkdown';
import { renderReactNodeToText } from './renderReactNodeToText';

type Element = {
  type: any;
  props: Record<string, any>;
  children?: any;
};

type Type = {};
type Props = Record<string, any>;
type Container = Omit<Element, 'children'> & {
  children: Element[];
};
type Instance = Element;
type TextInstance = Element & {
  children: string;
};
type SuspenseInstance = {};
type HydratableInstance = {};
type PublicInstance = {};
type HostContext = {};
type UpdatePayload = Record<string, any>;
type ChildSet = {};
type TimeoutHandle = number;
type NoTimeout = -1;
const hostConfig: HostConfig<
  Type,
  Props,
  Container,
  Instance,
  TextInstance,
  SuspenseInstance,
  HydratableInstance,
  PublicInstance,
  HostContext,
  UpdatePayload,
  ChildSet,
  TimeoutHandle,
  NoTimeout
> = {
  supportsHydration: false,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  isPrimaryRenderer: false,
  supportsMutation: true,
  supportsPersistence: false,

  preparePortalMount: () => {},
  getCurrentEventPriority: () => DefaultEventPriority,
  getInstanceFromNode: (node) => {
    return node;
  },
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  getPublicInstance(instance: Instance | TextInstance): PublicInstance {
    return instance;
  },
  prepareScopeUpdate: () => {},
  getInstanceFromScope: (scope) => scope,
  getRootHostContext: (rootContainer) => ({}),
  getChildHostContext: (parentHostContext, type, rootInstance) => ({}),
  prepareForCommit: () => {
    return null;
  },
  resetAfterCommit: () => {},
  createInstance: (type, props, rootContainerInstance, hostContext, internalInstanceHandle) => {
    return { type, props };
  },
  appendInitialChild: (parentInstance, child) => {
    parentInstance.children = parentInstance.children || [];
    parentInstance.children.push(child);
  },
  finalizeInitialChildren: (wordElement, type, props, rootContainerInstance, hostContext) => {
    return false;
  },
  prepareUpdate(instance, type, oldProps, newProps, rootContainer, hostContext) {
    let updatePayload: UpdatePayload = {};
    let needsUpdate = false;

    // 比较每个属性
    for (let key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        updatePayload[key] = newProps[key];
        needsUpdate = true;
      }
    }
    // 如果需要更新，返回 updatePayload
    return needsUpdate ? updatePayload : null;
  },
  shouldSetTextContent: (type, props) => {
    return false;
  },
  createTextInstance: (text, rootContainerInstance, hostContext, internalInstanceHandle) => {
    return { children: text, type: 'TEXT', props: {} };
  },
  commitUpdate: (instance, updatePayload, type, prevProps, nextProps, internalHandle) => {
    Object.assign(instance, updatePayload);
  },
  appendChild: (parentInstance, child) => {
    parentInstance.children = parentInstance.children || [];
    parentInstance.children.push(child);
  },
  appendChildToContainer: (container, child) => {
    container.children = container.children || [];
    container.children.push(child);
  },
  removeChildFromContainer: (container, child) => {
    container.children = container.children || [];
    container.children = container.children.filter((c) => c !== child);
  },
  removeChild: (parentInstance, child) => {
    parentInstance.children = parentInstance.children || [];
    parentInstance.children = parentInstance.children.filter((c: any) => c !== child);
  },
  insertBefore: (parentInstance, child, beforeChild) => {
    parentInstance.children = parentInstance.children || [];
    const index = parentInstance.children.indexOf(beforeChild);
    if (index !== -1) {
      parentInstance.children.splice(index, 0, child);
    }
  },
  detachDeletedInstance: (node) => {
    //
  },
  clearContainer: (container) => {
    container.children = [];
  },
  hideInstance: () => {},
  unhideInstance: () => {},
  commitTextUpdate(textInstance: TextInstance, oldText: string, newText: string) {
    textInstance.children = newText;
  },
};
const PlainObjectReconciler = Reconciler(hostConfig);

test('renderText', async () => {
  expect(
    renderReactNodeToText(
      <>
        Hello World!
        <br />
        My name is <strong>Wener</strong>.
      </>,
    ),
  ).toBe('Hello World!\nMy name is Wener.');
  expect(
    renderReactNodeToMarkdown(
      <>
        Hello World!
        <br />
        My name is <strong>Wener</strong>.
      </>,
    ),
  ).toBe('Hello World!\nMy name is **Wener**.');

  // https://github.com/pmndrs/react-nil
  {
    const createRoot = () => {
      let root: Container = { children: [], type: 'ROOT_CONTAINER', props: {} };
      let container = PlainObjectReconciler.createContainer(root, 0, null, false, null, '', console.error, null);
      return {
        root,
        container,
        render: (element: any) => {
          PlainObjectReconciler.updateContainer(element, container, null, null);
          return container;
        },
      };
    };
    const root = createRoot();

    let ele = (
      <>
        <StateComp />
        Hello World!
        <br />
        My name is <strong>Wener</strong>.
      </>
    );
    // let container = PlainObjectReconciler.createContainer(root, 0, null, false, null, '', console.error, null);
    // const { promise, resolve } = Promises.withResolvers<any>();

    // root.render(ele);
    // root.render(ele);
    await act(async () => root.render(ele));
    console.log(`Root`);
    console.log(util.inspect(root.root, { showHidden: false, depth: null, colors: true }));
    await sleep(500);
    await act(async () => root.render(ele));
    console.log(`Root`);
    console.log(util.inspect(root.root, { showHidden: false, depth: null, colors: true }));

    // PlainObjectReconciler.updateContainer(ele, container, null, null);
    // PlainObjectReconciler.updateContainer(ele, container, null, () => resolve(null));
    // await promise;
  }
});

const StateComp = () => {
  const [value, setValue] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setValue((v) => v + 1);
  }, []);
  useEffect(() => {
    const hdr = setInterval(() => {
      setCount((c) => c + 1);
    }, 50);
    return () => {
      clearInterval(hdr);
    };
  }, []);
  return (
    <span>
      Value: {value} Count: {count}
    </span>
  );
};
