export type ComponentState = {
	open?: boolean;
	filters?: string[];
	search?: string;
	where?: Record<string, any>;
	mounted?: boolean;
	state?: Record<string, any>;
	[key: string]: any;
};
export type ComponentName = 'sidebar' | 'summary' | 'details' | 'filters' | 'search' | string;
export type HasComponentsState = {
	components: Record<ComponentName, ComponentState>;
};
