import type Emittery from 'emittery';

export const ActionEvents = {
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
	[ActionEvents.DumpViewState]: {
		state: Record<string, any>;
	};
	[ActionEvents.RestoreViewState]: {
		state: Record<string, any>;
	};

	[ActionEvents.Refresh]: {};
	[ActionEvents.Debug]: {};
	[ActionEvents.Close]: {
		reason?: string;
	};
	[ActionEvents.Error]: {
		error: any;
	};
	[ActionEvents.Cancel]: {};
	[ActionEvents.Apply]: {};
	[ActionEvents.Next]: {};
	[ActionEvents.Previous]: {};
};

export type ActionEventEmitter = Emittery<ActionEventData>;
