import type Emittery from 'emittery';

export const ActionEventType = {
	__proto__: null,

	//UI View

	DumpViewState: 'Action:DumpViewState',
	RestoreViewState: 'Action:RestoreViewState',

	// Common

	Refresh: 'Action:Refresh',
	Debug: 'Action:Debug',
	Close: 'Action:Close',
	Error: 'Action:Error',
	Cancel: 'Action:Cancel',
	Apply: 'Action:Apply',
	Abort: 'Action:Abort',
	Submit: 'Action:Submit',
	Save: 'Action:Save',
	Reset: 'Action:Reset',
	Complete: 'Action:Complete',
	Next: 'Action:Next',
	Previous: 'Action:Previous',
} as const;

export type ActionEventData = {
	[ActionEventType.DumpViewState]: {
		state: Record<string, any>;
	};
	[ActionEventType.RestoreViewState]: {
		state: Record<string, any>;
	};

	[ActionEventType.Refresh]: {};
	[ActionEventType.Debug]: {};
	[ActionEventType.Close]: {
		reason?: string;
	};
	[ActionEventType.Error]: {
		error: any;
	};
	[ActionEventType.Cancel]: {};
	[ActionEventType.Apply]: {};
	[ActionEventType.Next]: {};
	[ActionEventType.Previous]: {};
};

export type ActionEventEmitter = Emittery<ActionEventData>;
