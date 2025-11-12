import Emittery, { type EventName } from 'emittery';

export function createEmitter<EventData = Record<EventName, any>>(name: string) {
	return new Emittery<EventData>({
		debug: {
			name,
		},
	});
}
