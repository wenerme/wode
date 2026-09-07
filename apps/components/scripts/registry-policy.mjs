export const publicRegistryUrl = 'https://ui-components.wener.me/r/';

export const itemDomains = Object.freeze({
	'hello-button': 'core',
	'addressable-frame': 'core',
	'header-content-footer-layout': 'core',
	'left-center-right-layout': 'core',
	resizable: 'core',
	status: 'core',
	formats: 'core',
	'hook-form': 'core',
	zoom: 'core',
	'web-vitals': 'core',
	'update-notification': 'core',
	loaders: 'core',
	'query-builder': 'resource',
	'console-data-view': 'resource',
	'console-record-detail': 'resource',
	'console-layout': 'console',
	'console-shell': 'console',
	'console-window': 'window',
	'window-manager': 'window',
	'console-preferences': 'console',
	'path-address-bar': 'file',
	'file-tree': 'file',
	'file-type-registry': 'file',
	'file-viewer': 'file',
	'file-manager': 'file',
	'file-picker': 'file',
	'ai-config-editor': 'agent',
	'ai-provider-editor': 'agent',
	'ai-endpoint-editor': 'agent',
	'ai-model-editor': 'agent',
	'ai-service-editor': 'agent',
	'mcp-server-editor': 'agent',
	'agent-persona-editor': 'agent',
	'agent-skill-editor': 'agent',
	'agent-config-studio': 'agent',
	message: 'agent',
	'message-scroller': 'agent',
	'agent-message': 'agent',
	'agent-composer': 'agent',
	'agent-chat': 'agent',
	'agent-ai-sdk': 'agent',
	'agent-work': 'agent',
	'agent-coding': 'agent',
	'agent-playground': 'agent',
	'login-page': 'auth',
});

export const allowedDomainDependencies = Object.freeze({
	core: new Set(['core']),
	resource: new Set(['core', 'resource']),
	window: new Set(['core', 'window']),
	file: new Set(['core', 'window', 'file']),
	auth: new Set(['core', 'auth']),
	agent: new Set(['core', 'file', 'agent']),
	console: new Set(['core', 'resource', 'window', 'console']),
	foundation: new Set(['foundation']),
});

export const allowedSourceRoots = Object.freeze({
	core: new Set(['components', 'ui']),
	resource: new Set(['resource']),
	window: new Set(['window']),
	file: new Set(['file']),
	auth: new Set(['auth']),
	agent: new Set(['agent']),
	console: new Set(['console']),
});

// All source and target ownership is unique after Milestone 3.
export const transitionalDuplicateTargetOwners = Object.freeze({});

export const transitionalDuplicateSourceOwners = Object.freeze({});

export function getRegistryDependencyName(dependency) {
	const match =
		typeof dependency === 'string'
			? /^https:\/\/ui-components\.wener\.me\/r\/([a-z0-9][a-z0-9-]*)\.json$/.exec(dependency)
			: undefined;
	return match?.[1];
}

export function isAllowedDependency(fromItem, toItem) {
	const fromDomain = itemDomains[fromItem];
	const toDomain = itemDomains[toItem];
	return Boolean(fromDomain && toDomain && allowedDomainDependencies[fromDomain]?.has(toDomain));
}
