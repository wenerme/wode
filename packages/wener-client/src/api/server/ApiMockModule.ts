/** 路由和任务存储由宿主提供，避免 API schemas 依赖某个应用的 server/context。 */
export interface ApiMockTaskStore {
	clear(): void;
}

export interface ApiMockModuleOptions<Routes = unknown, Config = unknown, Log = unknown, Handlers = unknown> {
	path?: string;
	config?: Config;
	log?: Log;
	handlers?: Handlers;
	createRoutes(options: { config?: Config; log: Log; handlers?: Handlers; taskStore?: ApiMockTaskStore }): Routes;
	taskStore?: ApiMockTaskStore;
	createTaskStore?(): ApiMockTaskStore;
}

export interface ApiMockModuleContext<Routes = unknown, Log = unknown> {
	get(name: 'hono'): { route(path: string, routes: Routes): unknown };
	log: Log;
}

/** 在宿主生命周期中挂载 mock API；只清理由该模块创建的任务存储。 */
export class ApiMockModule<Routes = unknown, Config = unknown, Log = unknown, Handlers = unknown> {
	readonly provides = [{ provide: ApiMockModule, useValue: this }];
	readonly #options: ApiMockModuleOptions<Routes, Config, Log, Handlers>;
	readonly #taskStore?: ApiMockTaskStore;
	readonly #ownsTaskStore: boolean;
	#mounted = false;

	constructor(options: ApiMockModuleOptions<Routes, Config, Log, Handlers>) {
		this.#options = options;
		this.#taskStore = options.taskStore ?? options.createTaskStore?.();
		this.#ownsTaskStore = options.taskStore === undefined;
	}

	onApplicationBootstrap(context: ApiMockModuleContext<Routes, Log>): void {
		if (this.#mounted) throw new Error('ApiMockModule只能挂载一次');
		const { path = '/mock', config, log, handlers, createRoutes } = this.#options;
		const routes = createRoutes({ config, log: log ?? context.log, handlers, taskStore: this.#taskStore });
		context.get('hono').route(path, routes);
		this.#mounted = true;
	}

	onModuleDestroy(): void {
		if (this.#ownsTaskStore) this.#taskStore?.clear();
	}
}
