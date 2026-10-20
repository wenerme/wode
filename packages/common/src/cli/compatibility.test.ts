import * as PublicCli from '@wener/common/cli';
import { Cli as PublicDeepCli } from '@wener/common/cli/Cli';
import { CliUsageError as PublicDeepUsageError } from '@wener/common/cli/CliCommand';
import { CliFormatError as PublicFormatError } from '@wener/common/cli/format/types';
import * as PublicRender from '@wener/common/cli/render';
import * as LegacyCli from 'common/cli';
import { Cli as LegacyDeepCli } from 'common/cli/Cli';
import { CliUsageError as LegacyDeepUsageError } from 'common/cli/CliCommand';
import { snapshotCliRuntime as legacySnapshot } from 'common/cli/CliRuntime';
import { formatCliOutput as legacyFormat } from 'common/cli/format/formatCliOutput';
import { CliFormatError as LegacyFormatError } from 'common/cli/format/types';
import { getCliOutputOptions as legacyOutputOptions } from 'common/cli/getCliOutputOptions';
import { parseCliArgs as legacyParse } from 'common/cli/parseCliArgs';
import * as LegacyRender from 'common/cli/render/index';
import { renderCliOutput as legacyRenderOutput } from 'common/cli/render/renderCliOutput';
import { splitCliCommandLine as legacySplit } from 'common/cli/splitCliCommandLine';
import { describe, expect, it } from 'vitest';

describe('common/cli compatibility exports', () => {
	it('re-exports the public API without duplicating constructors or functions', () => {
		expect(Object.keys(LegacyCli).sort()).toEqual(Object.keys(PublicCli).sort());
		for (const key of Object.keys(PublicCli) as Array<keyof typeof PublicCli>) {
			expect(LegacyCli[key], key).toBe(PublicCli[key]);
		}
		expect(LegacyDeepCli).toBe(PublicDeepCli);
		expect(LegacyDeepCli).toBe(PublicCli.Cli);
		expect(new LegacyDeepCli('legacy')).toBeInstanceOf(PublicCli.Cli);
		expect(new PublicDeepCli('public')).toBeInstanceOf(LegacyCli.Cli);
		expect(LegacyDeepUsageError).toBe(PublicDeepUsageError);
		expect(LegacyFormatError).toBe(PublicFormatError);
	});

	it('keeps thrown usage errors compatible across parser, renderer and host imports', async () => {
		expect(() => legacyParse(['--unknown'], [])).toThrow(PublicCli.CliUsageError);
		expect(() => PublicCli.parseCliArgs(['--unknown'], [])).toThrow(LegacyDeepUsageError);
		expect(() => legacyRenderOutput([{ id: '01' }], { format: 'json', fields: ['missing'] })).toThrow(
			PublicDeepUsageError,
		);
		expect(() => PublicRender.renderCliOutput([{ id: '01' }], { format: 'json', fields: ['missing'] })).toThrow(
			LegacyCli.CliUsageError,
		);
		const cli = new LegacyDeepCli('legacy');
		await expect(
			cli.execute(['unknown'], { signal: new AbortController().signal, stdout: () => undefined }),
		).rejects.toBeInstanceOf(PublicCli.CliUsageError);
	});

	it('preserves deep output, runtime and command-line entry points', () => {
		expect(legacySnapshot).toBe(PublicCli.snapshotCliRuntime);
		expect(legacyOutputOptions).toBe(PublicCli.getCliOutputOptions);
		expect(legacyParse).toBe(PublicCli.parseCliArgs);
		expect(legacySplit).toBe(PublicCli.splitCliCommandLine);
		expect(LegacyRender.renderCliOutput).toBe(PublicRender.renderCliOutput);
		expect(LegacyRender.renderCliTable).toBe(PublicRender.renderCliTable);
		expect(legacyRenderOutput).toBe(PublicCli.renderCliOutput);
		expect(legacyFormat({ id: '00012' }, { format: 'yaml' })).toBe('id: "00012"\n');
		expect(legacySplit('echo "hello world"')).toEqual(['echo', 'hello world']);
	});
});
