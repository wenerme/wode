import {
	createContext,
	forwardRef,
	Fragment,
	lazy,
	useContext,
	useMemo,
	useRef,
	type ComponentType,
	type FC,
	type ReactNode,
} from 'react';
import type { MaybePromise } from '@wener/utils';

export interface DefineComponentOptions<P extends {} = {}> {
	name: string;
	title?: string;
	props?: P;
	schema?: any;
	metadata?: Record<string, any>;

	Component?: ComponentType<P>;
	load?: () => Promise<ComponentType<P> | { default: ComponentType<P> }>;
}

export interface ComponentDef {
	name: string;
	title: string;
	props?: Record<string, any>;
	schema?: any;
	Component: ComponentType;
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

export type ContextComponentType<P = {}> = ComponentType<P> & { [ComponentNamePropKey]: string };

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

type LoadableComponent<P> = () => MaybePromise<ComponentType<P> | { default: ComponentType<P> }>;

type ProvidedComponent<P extends {} = {}> = {
	provide: NameLike<P>;
	Component?: ComponentType<P>;
	load?: LoadableComponent<P>;
};

export type ComponentProviderProps = {
	components: Array<ProvidedComponent>;
	children?: ReactNode;
};

type NameLike<P> = string | ContextComponentType<P> | ComponentType<P>;

type ComponentContextObject = {
	parent?: ComponentContextObject;
	components: ProvidedComponent[];
	useComponent: <P extends {}>(comp: NameLike<P>) => UseComponentResult<P>;
};

type ComponentProviderState = {};

type UseComponentResult<P> = [ComponentType<P>, { found: boolean }];

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

const ComponentContext = createContext<ComponentContextObject>(RootValue);

function resolveName<P>(def: NameLike<P>) {
	let name: string;
	if (typeof def === 'string') {
		name = def;
	} else {
		name =
			(def as ContextComponentType)[ComponentNamePropKey] ||
			(def as ComponentType).displayName ||
			// (def as ComponentType).name || // this is not reliable
			'';
	}
	return name;
}

export function useComponent<P extends {}>(comp: NameLike<P>, def?: ComponentType<P>): UseComponentResult<P> {
	const { useComponent } = useContext(ComponentContext);
	const [o, r] = useComponent<P>(comp);
	return [r.found ? o : def || o, r];
}

export const ComponentProvider: FC<ComponentProviderProps> = ({ components, children }) => {
	const parent = useContext(ComponentContext);
	const provideRef = useRef(components);
	const parentRef = useRef(parent);

	provideRef.current = components;
	parentRef.current = parent;

	const val = useMemo((): ComponentContextObject => {
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
		};
	}, []);
	return <ComponentContext.Provider value={val}>{children}</ComponentContext.Provider>;
};

function resolveComponent<P extends {}>(comp: NameLike<P>, obj: ComponentContextObject): UseComponentResult<P> {
	let cur: ComponentContextObject | undefined = obj;
	let Component = Fragment as ComponentType<P>;
	let found = false;

	const name = resolveName(comp);
	const isMatch = (provide: NameLike<any>) => {
		if (provide === comp) {
			return true;
		}
		return name && resolveName(provide) === name;
	};

	outer: while (cur) {
		for (let item of cur.components) {
			if (isMatch(item.provide)) {
				Component = createComponent(item);
				found = true;
				break outer;
			}
		}
		cur = cur.parent;
	}

	if (Component === Fragment || !found) {
		console.warn(`Component ${name || String(comp)} not found`);
	}
	return [Component, { found }];
}

function createComponent({
	Component,
	load,
}: {
	Component?: ComponentType;
	load?: LoadableComponent<any>;
}): ComponentType<any> {
	if (Component) {
		return Component;
	}
	if (load) {
		return lazy(async () => {
			try {
				const v = await load();
				if ('default' in v) {
					return v as { default: ComponentType };
				}
				if (!v) {
					throw new Error(`Component not found`);
				}
				return { default: v };
			} catch (e) {
				console.error(`Failed to load component`, { load, Component }, e);
				return { default: Fragment };
			}
		});
	}
	return Fragment;
}
