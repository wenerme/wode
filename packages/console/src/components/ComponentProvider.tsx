import React, { ComponentType, forwardRef, Fragment, useContext, useMemo, useRef } from 'react';
import { MaybePromise } from '@wener/utils';

export interface DefineComponentOptions<P extends {} = {}> {
  name: string;
  title?: string;
  props?: P;
  schema?: any;
  metadata?: Record<string, any>;

  Component?: React.ComponentType<P>;
  load?: () => Promise<React.ComponentType<P> | { default: React.ComponentType<P> }>;
}

export interface ComponentDef {
  name: string;
  title: string;
  props?: Record<string, any>;
  schema?: any;
  Component: React.ComponentType;
  metadata: Record<string, any>;
}

let _components: ComponentDef[] = [];

export function defineComponent<P extends {} = {}>({
  Component: _Component,
  load,
  ...opts
}: DefineComponentOptions<P>): ContextComponentType<P> {
  {
    const Component = createComponent({
      Component: _Component as any,
      load,
    });
    // if (Component === Fragment) {
    //   console.warn(`Component ${opts.name} not resolved`);
    // }
    const def: ComponentDef = {
      title: opts.title || opts.name,
      ...opts,
      Component,
      metadata: {},
    };
    let last = _components.find((v) => v.name === def.name);
    if (last) {
      console.error(`Component ${def.name} already defined`);

      // last.schema = def.schema;
      // last.props = def.props;
      // last.metadata = def.metadata;
    }

    _components.unshift(def);
  }

  const name = opts.name;
  let component = Object.assign(
    forwardRef<any, Record<string, any>>((props, ref) => {
      return <ConsumeComponent $name={name} {...props} ref={ref} />;
    }),
    {
      [ComponentNamePropKey]: name,
    },
  ) as ContextComponentType<P>;
  return component;
}

export function getComponents() {
  return _components;
}

export const ConsumeComponent = forwardRef<any, { $name: string } & Record<string, any>>(({ $name, ...props }, ref) => {
  const [Component] = useComponent<any>($name);

  return <Component {...props} ref={ref} />;
});

const ComponentNamePropKey = '$ContextComponentName';

export type ContextComponentType<P> = React.ComponentType<P> & { [ComponentNamePropKey]: string };

export function createContextComponent<P extends {}>(name: string): ContextComponentType<P> {
  let component = Object.assign(
    forwardRef<any, Record<string, any>>((props, ref) => {
      return <ConsumeComponent $name={name} {...props} ref={ref} />;
    }),
    {
      [ComponentNamePropKey]: name,
    },
  ) as ContextComponentType<P>;
  component.displayName = `${ComponentNamePropKey}(${name})`;
  return component;
}

type LoadableComponent<P> = () => MaybePromise<React.ComponentType<P> | { default: React.ComponentType<P> }>;

type ProvideComponentOptions<P extends {} = {}> = {
  provide: string | ContextComponentType<P>;
  Component?: React.ComponentType<P>;
  load?: LoadableComponent<P>;
};

export type ComponentProviderProps = {
  components: Array<ProvideComponentOptions>;
  children?: React.ReactNode;
};

type NameLike<P> = string | ContextComponentType<P>;

type ComponentContextObject = {
  parent?: ComponentContextObject;
  components: ProvideComponentOptions[];
  useComponent: <P extends {}>(comp: NameLike<P>) => [ComponentType<P>, [ctx: { found: boolean }]];
};

const RootValue: ComponentContextObject = {
  get components() {
    return _components.map((v) => {
      return {
        provide: v.name,
        Component: v.Component,
      };
    });
  },
  useComponent: (name) => resolveComponent(name, RootValue),
};

const ComponentContext = React.createContext<ComponentContextObject>(RootValue);

function resolveName<P>(def: NameLike<P>) {
  let name = typeof def === 'string' ? def : def[ComponentNamePropKey];
  return { name };
}

export function useComponent<P extends {}>(comp: NameLike<P>) {
  const { useComponent } = useContext(ComponentContext);
  return useComponent<P>(comp);
}

export const ComponentProvider: React.FC<ComponentProviderProps> = ({ components, children }) => {
  const parent = useContext(ComponentContext);
  const provideRef = useRef(components);
  const parentRef = useRef(parent);

  provideRef.current = components;
  parentRef.current = parent;

  const val = useMemo(() => {
    return {
      get parent() {
        return parentRef.current;
      },
      get components() {
        return provideRef.current;
      },
      useComponent: (comp) => {
        return resolveComponent(comp, val);
      },
    } as ComponentContextObject;
  }, []);
  return <ComponentContext.Provider value={val}>{children}</ComponentContext.Provider>;
};

function resolveComponent<P extends {}>(
  comp: NameLike<P>,
  obj: ComponentContextObject,
): [
  ComponentType<P>,
  [
    ctx: {
      found: boolean;
    },
  ],
] {
  const { name } = resolveName(comp);
  let cur: ComponentContextObject | undefined = obj;
  let Component = Fragment as ComponentType<P>;
  let found = false;
  outer: while (cur) {
    for (let item of cur.components) {
      if (resolveName(item.provide).name === name) {
        Component = createComponent(item);
        found = true;
        break outer;
      }
    }
    cur = cur.parent;
  }
  if (Component === Fragment || !found) {
    console.warn(`Component ${name} not found`);
  }
  return [Component, [{ found }]] as const;
}

function createComponent({
  Component,
  load,
}: {
  Component?: React.ComponentType;
  load?: LoadableComponent<any>;
}): ComponentType<any> {
  if (Component) {
    return Component;
  }
  if (load) {
    return React.lazy(async () => {
      const v = await load();
      if ('default' in v) {
        return v as { default: React.ComponentType };
      }
      return { default: v };
    });
  }
  return Fragment;
}
