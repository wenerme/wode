import { AsyncCloser, MaybePromise } from '@wener/utils';
import { Command } from 'commander';

interface RootContext {
  closer: AsyncCloser;
  command: Command;
}

const _ctx: RootContext = {
  closer: new AsyncCloser(),
  command: new Command(),
};

export function setRootCommand(root: Command) {
  _ctx.command = root;
}

export function getRootCommand(): Command {
  return _ctx.command;
}

export function runCommand(cmd: Command) {
  setRootCommand(cmd);
  cmd.parse(process.argv);
}

export interface GlobalOptions {
  debug: boolean;
  dryRun: boolean;
  dataDir: string;

  [key: string]: any;
}

export interface RunOptions<O extends Record<string, any> = Record<string, any>> {
  options: O;
  command: Command;
  args: any[];
  closer: AsyncCloser;
}

export interface RunActionOptions<O extends Record<string, any> = Record<string, any>> {
  run: (opts: RunOptions<O>) => MaybePromise<undefined | null | void>;
}

export async function run<T>(f: () => MaybePromise<T>, { command = getRootCommand() }: { command?: Command } = {}) {
  const opts = command.optsWithGlobals();
  if (opts.dryRun) {
    console.log('dry run:', opts);
    return;
  } else if (opts.debug) {
    console.log('run:', opts);
  }
  return f();
}

export function runAction<G extends GlobalOptions = GlobalOptions>(_run: RunActionOptions<G>['run']) {
  return async (...args: any[]): Promise<void> => {
    const command = args.pop() as Command;
    // const _ = args.pop();
    const options = command.optsWithGlobals() as G;
    return run(
      async () => {
        const out = await _run({
          command,
          options,
          args: command.args,
          closer: _ctx.closer,
        });
        if (out) {
          output(out);
        }
      },
      { command },
    );
  };
}

export function output(data: any): MaybePromise<void> {
  console.log(JSON.stringify(data));
}
