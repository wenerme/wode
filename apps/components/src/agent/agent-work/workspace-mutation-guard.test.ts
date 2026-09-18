import { createMemoryFileSystem } from '@wener/common/fs';
import { describe, expect, it } from 'vite-plus/test';
import { createAgentWorkspaceMutationGuard } from './workspace-mutation-guard';

describe('createAgentWorkspaceMutationGuard', () => {
	it('keeps reads available and rejects every mutation after quarantine', async () => {
		const fileSystem = createMemoryFileSystem();
		await fileSystem.writeFile('/source.txt', 'source');
		let allowed = true;
		const guarded = createAgentWorkspaceMutationGuard(fileSystem, () => allowed);
		expect(await guarded.readFile('/source.txt', { encoding: 'text' })).toBe('source');
		allowed = false;
		await expect(guarded.writeFile('/blocked.txt', 'blocked')).rejects.toMatchObject({ code: 'EPERM' });
		await expect(guarded.mkdir('/blocked')).rejects.toMatchObject({ code: 'EPERM' });
		await expect(guarded.copy('/source.txt', '/copy.txt')).rejects.toMatchObject({ code: 'EPERM' });
		await expect(guarded.rename('/source.txt', '/renamed.txt')).rejects.toMatchObject({ code: 'EPERM' });
		await expect(guarded.rm('/source.txt')).rejects.toMatchObject({ code: 'EPERM' });
		expect(await fileSystem.exists('/source.txt')).toBe(true);
		expect(await fileSystem.exists('/blocked.txt')).toBe(false);
	});

	it('revokes a writable stream capability acquired before quarantine', async () => {
		const fileSystem = createMemoryFileSystem();
		let allowed = true;
		const guarded = createAgentWorkspaceMutationGuard(fileSystem, () => allowed);
		const writer = guarded.createWritableStream?.('/late.txt').getWriter();
		if (!writer) throw new Error('writable stream missing');
		await writer.write('before');
		allowed = false;
		await expect(writer.write('late')).rejects.toMatchObject({ code: 'EPERM' });
		await expect(writer.closed).rejects.toMatchObject({ code: 'EPERM' });
		expect(await fileSystem.exists('/late.txt')).toBe(false);
	});
});
