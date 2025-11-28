import Emittery from 'emittery';

export class WodeAssistantSidecar extends Emittery {
	constructor() {
		super();
	}

	async openSettings() {
		console.log('[Sidecar] openSettings');
		// In the future, call Wails backend here
		this.emit('open-settings');
	}

	async getUserInfo() {
		// Mock for now
		return {
			name: 'User',
			username: 'system_user', // Should be fetched from system
		};
	}

	async getVersion() {
		return '1.0.0';
	}
}
