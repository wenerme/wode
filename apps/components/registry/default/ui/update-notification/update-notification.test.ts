import { describe, expect, it } from 'vite-plus/test';
import { resolveUpdateVersion } from './use-update-notification';

describe('resolveUpdateVersion', () => {
	it('uses the first successful response as the loaded-page baseline', () => {
		expect(resolveUpdateVersion({ latestVersion: 'build-101' })).toEqual({
			currentVersion: 'build-101',
			latestVersion: 'build-101',
			updateStatus: 'current',
			open: false,
		});
	});

	it('opens the notification when the deployed version changes', () => {
		expect(resolveUpdateVersion({ currentVersion: 'build-101', latestVersion: 'build-102' })).toEqual({
			currentVersion: 'build-101',
			latestVersion: 'build-102',
			updateStatus: 'available',
			open: true,
		});
	});

	it('keeps a dismissed version closed', () => {
		expect(
			resolveUpdateVersion({
				currentVersion: 'build-101',
				latestVersion: 'build-102',
				dismissedVersion: 'build-102',
			}),
		).toMatchObject({ updateStatus: 'dismissed', open: false });
	});

	it('opens again when a newer version follows a dismissed version', () => {
		expect(
			resolveUpdateVersion({
				currentVersion: 'build-101',
				latestVersion: 'build-103',
				dismissedVersion: 'build-102',
			}),
		).toMatchObject({ updateStatus: 'available', open: true, latestVersion: 'build-103' });
	});
});
