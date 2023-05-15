import { Options as PostgreSqlOptions } from '@mikro-orm/postgresql';
import { Global, Logger, Module } from '@nestjs/common';

const HookTokens: string[] = [];

export class HookManager {
  private readonly log = new Logger('HookManager');

  constructor(public readonly hooks: HookService[]) {
    hooks.sort((a, b) => {
      if (a.order === undefined) {
        return 1;
      }
      if (b.order === undefined) {
        return -1;
      }
      return a.order - b.order;
    });

    this.log.log(`Hooks: ${hooks.map((v) => v.name || v.constructor?.name || v).join(', ')}`);
  }

  onMikroOrmConfig(options: MikroOrmConfig): MikroOrmConfig {
    for (const hook of this.hooks) {
      if (hook.onMikroOrmConfig) {
        const result = hook.onMikroOrmConfig(options);
        if (result) {
          options = result;
        }
      }
    }
    return options;
  }
}

export function createHookToken(name: string) {
  const token = `HookService<${name}>`;
  if (!HookTokens.find((v) => v === token)) {
    HookTokens.push(token);
  }
  return token;
}

@Module({
  providers: [
    {
      provide: HookManager,
      useFactory: (...hooks: HookService[]) => {
        return new HookManager(hooks);
      },
      inject: HookTokens,
    },
  ],
  exports: [HookManager],
})
@Global()
export class HookModule {}

export type MikroOrmConfig = PostgreSqlOptions & Pick<Required<PostgreSqlOptions>, 'entities'>;

export interface HookService {
  readonly name?: string;
  readonly order?: number;

  onMikroOrmConfig?: ((options: MikroOrmConfig) => void) | ((options: MikroOrmConfig) => MikroOrmConfig);
}
