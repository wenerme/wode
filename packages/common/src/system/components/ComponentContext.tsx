import type { CSSProperties } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { GrSystem } from 'react-icons/gr';
import { createStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { flexRender, type FlexRenderable, useCompareEffect } from '@wener/reaction';

type ComponentStoreApi = ReturnType<typeof createComponentStore>;

export interface ComponentStore {
  parent?: any;
  components: Partial<ComponentRegistry>;
}

interface ComponentRegistry extends Record<string, React.ComponentType> {
  Logo: React.ComponentType<
    Record<string, any> & {
      className?: string;
      style?: CSSProperties;
    }
  >;
}

const createComponentStore = ({ parent, components = {} }: Partial<ComponentStore>) =>
  createStore<ComponentStore>()(() => {
    return {
      parent,
      components,
    };
  });
const DefaultContextComponents: ComponentRegistry = {
  Logo: GrSystem,
  // SystemAbout, // 循环依赖
};

export function getDefaultContextComponents() {
  return DefaultContextComponents;
}

export const ComponentContext = createContext<ReturnType<typeof createComponentStore>>(
  createComponentStore({
    components: DefaultContextComponents,
  }),
);

export function createContextComponent<P extends {}>(
  name: string,
  { fallback }: { fallback?: FlexRenderable<P> } = {},
): React.FC<P> {
  return (props) => {
    const C = useComponent(name);
    if (!C) {
      return fallback ? (flexRender(fallback, props) as any) : null;
    }
    return React.createElement(C, props);
  };
}

export const ComponentProvider: React.FC<{ children?: React.ReactNode; components: Partial<ComponentRegistry> }> = ({
  children,
  components = {},
}) => {
  const parent = useContext(ComponentContext);
  const [store] = useState(() => {
    return createComponentStore({ components, parent });
  });
  useCompareEffect(
    () => {
      store.setState({ components });
    },
    components as any,
    shallow,
  );
  return <ComponentContext.Provider value={store}>{children}</ComponentContext.Provider>;
};

export function useComponent<K extends keyof ComponentRegistry>(o: K): ComponentRegistry[K];
export function useComponent(o: any): any {
  const store = useContext(ComponentContext);
  const select = (store: ComponentStoreApi, o: any, _components?: ComponentRegistry): any => {
    const state = store.getState();
    const components = _components || {
      ...DefaultContextComponents,
      ...state.parent?.getState().components,
      ...state.components,
    };
    if (typeof o === 'string') {
      return components[o];
    }
    if (Array.isArray(o)) {
      return o.map((v) => select(store, v, components));
    }
    return undefined;
  };
  const [out, setOut] = useState<any>(() => {
    return select(store, o);
  });
  // todo subscribe
  // todo merge parent
  useCompareEffect(
    () => {
      setOut((s: any) => {
        const next = select(store, o);
        if (shallow(next, s)) {
          return s;
        }
        return next;
      });
    },
    o,
    shallow,
  );
  return out;
}
