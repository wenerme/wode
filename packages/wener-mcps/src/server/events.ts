import Emittery from 'emittery';

export const McpsEventType = {
	Request: 'Mcps:Request',
} as const;

export type McpsRequestEvent = {
	timestamp: string;
	method: string;
	path: string;
	serverName?: string;
	serverType?: string;
	status?: number;
	durationMs?: number;
	error?: string;
	requestHeaders?: Record<string, string>;
};

export type McpsEventData = {
	[McpsEventType.Request]: McpsRequestEvent;
};

export type McpsEmitter = Emittery<McpsEventData>;

export function createMcpsEmitter(): McpsEmitter {
	return new Emittery<McpsEventData>({
		debug: { name: 'McpsEmitter' },
	});
}
