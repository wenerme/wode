import { CliUsageError } from '@wener/common/cli';
import { CliConfigError } from 'common/context';
import { APP_NAME } from '../const';
import { createCli } from '../createCli';
import { createNativeHost, getNativeCommandOptions } from '../native';

const controller = new AbortController();
const abort = () => controller.abort(new Error('Command cancelled'));
process.once('SIGINT', abort);
process.once('SIGTERM', abort);
try {
	const input = getNativeCommandOptions(process.argv.slice(2));
	const cli = createCli(createNativeHost({ config: input.config }));
	const result = await cli.execute(input.argv, {
		signal: controller.signal,
		stdoutStream: new WritableStream<Uint8Array>({
			write(chunk) {
				return new Promise<void>((resolve, reject) => {
					process.stdout.write(chunk, (error) => error ? reject(error) : resolve());
				});
			},
		}),
		columns: process.stdout.columns,
		write: (value) => {
			process.stdout.write(value);
		},
		stdout: (value) => {
			process.stdout.write(value.endsWith('\n') ? value : `${value}\n`);
		},
		stderr: (value) => {
			process.stderr.write(`${value}\n`);
		},
	});
	process.exitCode = result.exitCode;
} catch (error) {
	process.stderr.write(`${APP_NAME}: ${error instanceof Error ? error.message : 'Command failed'}\n`);
	process.exitCode = controller.signal.aborted
		? 130
		: error instanceof CliUsageError || error instanceof CliConfigError
			? 2
			: 1;
} finally {
	process.removeListener('SIGINT', abort);
	process.removeListener('SIGTERM', abort);
}
