import React, { forwardRef, useCallback, useContext } from 'react';
import { mutative } from '@wener/reaction/mutative/zustand';
import { MaybePromise } from '@wener/utils';
import { createStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { getGlobalStates } from '@/state';
import { EmptyPlaceholder } from '@/web/formats/EmptyPlaceholder';

export interface RegisterComponentOptions {
  id?: string;
  title?: string;
  props?: Record<string, any>;
  Component?: React.ComponentType;
  lazy?: () => Promise<React.ComponentType | { default: React.ComponentType }>;
  order?: number;
  metadata?: Record<string, any>;
}

export interface DefineComponentOptions<P extends {}> {
  name: string;
  title?: string;
  props?: P;
  schema?: any;
  metadata?: Record<string, any>;

  Component?: React.ComponentType;
  lazy?: () => Promise<React.ComponentType | { default: React.ComponentType }>;
  order?: number;
}

interface RegisterComponentDef {
  id: string;
  title: string;
  order: number;
  props?: Record<string, any>;
  Component: React.ComponentType;
  metadata: Record<string, any>;
}

interface ComponentDef {
  name: string;
  title: string;
  props?: Record<string, any>;
  schema?: any;
  metadata: Record<string, any>;
  components: Array<RegisterComponentDef>;
}

class ComponentRegistry {
  readonly store: ComponentRegistryStoreApi = createRegistryStore();

  get state() {
    return this.store.getState();
  }

  getComponentNames() {
    return this.state.defs.map((v) => v.name);
  }

  registerComponent(name: string, opts: RegisterComponentOptions) {
    let id = opts.id || `${name}-${Math.random().toString(36).slice(4)}`;
    this.store.setState((s) => {
      let def = s.index[name];
      if (!def) {
        def = {
          name,
          title: name,
          metadata: {},
          components: [],
        };
        s.defs.push(def);
        s.index[name] = def;
        console.warn(`Component ${name} not defined`);
      }
      if (!opts.lazy && !opts.Component) {
        throw new Error('Component or lazy is required');
      }
      let lazy = opts.lazy;
      def.components.push({
        id,
        title: opts.title || name,
        Component: lazy
          ? React.lazy(async () => {
              const v = await lazy();
              if ('default' in v) {
                return v as { default: React.ComponentType };
              }
              return { default: v };
            })
          : opts.Component!,
        props: opts.props,
        order: opts.order ?? def.components.length,
        metadata: { ...opts.metadata },
      });
      def.components.sort((a, b) => a.order - b.order);
    });

    return {
      unregister: () => {
        this.store.setState((s) => {
          let def = s.index[name];
          if (!def) {
            return;
          }
          def.components = def.components.filter((v) => v.id !== id);
        });
      },
    };
  }

  isDefined(name: string) {
    return this.state.index[name] !== undefined;
  }

  defineComponent<P extends {}>(all: DefineComponentOptions<P>) {
    const { lazy, Component, order, ...opts } = all;
    this.store.setState((s) => {
      const def: ComponentDef = {
        metadata: {},
        title: opts.title || opts.name,
        ...opts,
        components: [],
      };
      let last = s.index[def.name];
      if (last) {
        console.error(`Component ${def.name} already defined`);

        last.schema = def.schema;
        last.props = def.props;
        last.metadata = def.metadata;
      } else {
        s.defs.push(def);
        s.index[def.name] = def;
      }
    });

    if (lazy || Component) {
      this.registerComponent(opts.name, {
        id: `default`,
        Component,
        lazy,
        order,
        metadata: {
          default: true,
        },
      });
    }
  }
}

export function getComponentRegistry() {
  return getGlobalStates('ReactComponentRegistry', () => {
    return new ComponentRegistry();
  });
}

export function defineComponent<P extends {}>(opts: DefineComponentOptions<P>): RegisteredComponentType<P> {
  getComponentRegistry().defineComponent(opts);
  return createRegisteredComponent(opts.name);
}

// export function registerComponent(name: string, opts: RegisterComponentOptions) {
//   getComponentRegistry().registerComponent(name, opts);
// }

interface ReactRegistryStoreState {
  defs: ComponentDef[];
  index: Record<string, ComponentDef | undefined>;
}

type ComponentRegistryStoreApi = ReturnType<typeof createRegistryStore>;

function createRegistryStore() {
  return createStore(
    mutative<ReactRegistryStoreState>(() => {
      return {
        defs: [],
        index: {},
      };
    }),
  );
}

const Context = React.createContext<ComponentRegistry | null>(null);

export function useComponentRegistry() {
  return useContext(Context) || getComponentRegistry();
}

export function useComponentRegistration(name: string) {
  const reg = useComponentRegistry();
  return useStoreWithEqualityFn(
    reg.store,
    useCallback(
      (s) => {
        let def = s.index[name];
        let record = def?.components.at(-1);
        const Component = record?.Component;
        return { Component, record, def };
      },
      [name],
    ),
    shallow,
  );
}

export const RegisteredComponent = forwardRef<any, { $name: string } & Record<string, any>>(
  ({ $name, ...props }, ref) => {
    const {
      Component = EmptyPlaceholder,
      record = { props: {} },
      def = { props: {} },
    } = useComponentRegistration($name);
    return <Component {...def.props} {...record.props} {...props} ref={ref} />;
  },
);

export type RegisteredComponentType<P> = React.ComponentType<P> & { $RegisteredComponent: string };

// export type LoadableComponentType = React.LazyExoticComponent<React.ComponentType>;

export function createRegisteredComponent<P extends {}>(name: string): RegisteredComponentType<P> {
  let component = Object.assign(
    forwardRef<any, Record<string, any>>((props, ref) => {
      return <RegisteredComponent $name={name} {...props} ref={ref} />;
    }),
    {
      $RegisteredComponent: name,
    },
  ) as RegisteredComponentType<P>;
  return component;
}

type ProvideComponentOptions<P extends {} = {}> = {
  name: string | RegisteredComponentType<P>;
  Component?: React.ComponentType<P>;
  lazy?: () => MaybePromise<React.ComponentType<P> | { default: React.ComponentType<P> }>;
};

export type ComponentProviderProps = {
  components: Array<ProvideComponentOptions>;
  children?: React.ReactNode;
};

export const ComponentProvider: React.FC<ComponentProviderProps> = ({ components, children }) => {
  return children;
};
