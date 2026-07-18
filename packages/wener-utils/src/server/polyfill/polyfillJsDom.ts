import type { ConstructorOptions } from 'jsdom';
import { getGlobalThis } from '../../web/getGlobalThis';

type JsDomWindowOptions = ConstructorOptions & {
	proxy?: string;
	strictSSL?: boolean;
	userAgent?: string;
};

type JsDomResources = {
	dispatcher?: unknown;
	userAgent?: string;
};

export async function polyfillJsDom() {
	if (typeof window !== 'undefined') {
		return false;
	}

	const globalObject = getGlobalThis();

	const { JSDOM } = await import('jsdom');

	async function createWindow(opts: JsDomWindowOptions = {}) {
		const { proxy, strictSSL, userAgent, ...jsdomOpts } = opts;
		const resources: JsDomResources = {};
		if (userAgent) resources.userAgent = userAgent;
		if (proxy) {
			const { ProxyAgent } = await import('undici');
			const tls = strictSSL === undefined ? undefined : { rejectUnauthorized: strictSSL };
			resources.dispatcher = new ProxyAgent({
				uri: proxy,
				...(tls ? { proxyTls: tls, requestTls: tls } : {}),
			});
		}
		const options = Object.keys(resources).length ? { ...jsdomOpts, resources } : jsdomOpts;
		return new JSDOM('', options as ConstructorOptions).window;
	}

	// https://github.com/lukechilds/browser-env/blob/master/src/index.js
	// Default jsdom config.
	// These settings must override any custom settings to make sure we can iterate
	// over the window object.
	const defaultJsdomConfig = {
		// features: {
		//   FetchExternalResources: false,
		//   ProcessExternalResources: false,
		// },
	};
	// IIFE executed on import to return an array of global Node.js properties that
	// conflict with global browser properties.
	const protectedProperties = Object.getOwnPropertyNames(await createWindow(defaultJsdomConfig)).filter(
		(prop) => typeof globalObject[prop as keyof typeof globalObject] !== 'undefined',
	);

	async function installEnv(...args: unknown[]) {
		// Sets up global browser environment
		// Extract options from args
		const properties = args.find((arg): arg is string[] => Array.isArray(arg));
		const userJsdomConfig = args.find((arg): arg is JsDomWindowOptions => isObject(arg) && !Array.isArray(arg));

		// Create window object
		const window = await createWindow(Object.assign({}, userJsdomConfig, defaultJsdomConfig));

		// Get all global browser properties
		Object.getOwnPropertyNames(window)

			// Remove protected properties
			.filter((prop) => !protectedProperties.includes(prop))

			// If we're only applying specific required properties remove everything else
			.filter((prop) => !(properties && properties.indexOf(prop) === -1))
			.filter((prop) => {
				switch (prop) {
					case 'undefined':
						return false;
				}
				return true;
			})

			// Copy what's left to the Node.js global scope
			.forEach((prop) => {
				// console.debug(`define globalThis.${prop}`);
				Object.defineProperty(globalObject, prop, {
					configurable: true,
					get: () => window[prop as keyof typeof window],
				});
			});

		return window;
	}

	await installEnv({ url: 'http://localhost' });
	return true;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
