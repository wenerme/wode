import type { DynamicModule, Provider } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ClientRegistry } from './ClientRegistry';
import type { ClientConnection } from './types';

export const SERVICE_CLIENT_CONNECTION = Symbol('SERVICE_CLIENT_CONNECTION');

@Module({})
export class ServiceClientModule {
  static forRoot(opts: Partial<Omit<DynamicModule, 'providers' | 'exports' | 'module'>> = {}): DynamicModule {
    opts.global ??= true;
    return {
      module: ServiceClientModule,
      providers: [
        {
          provide: ClientRegistry,
          useFactory: (conn: ClientConnection) => {
            const cli = new ClientRegistry();
            cli.connect(conn);
            return cli;
          },
          inject: [SERVICE_CLIENT_CONNECTION],
        },
      ],
      exports: [ClientRegistry],
      ...opts,
    };
  }

  static forFeature(svcs: any[]): DynamicModule {
    const providers = svcs.map((v) => {
      return {
        provide: v,
        useFactory: (clientRegistry: ClientRegistry) => {
          return clientRegistry.getClient(v);
        },
        inject: [ClientRegistry],
      } as Provider;
    });
    return {
      module: ServiceClientFeatureModule,
      imports: [ServiceClientModule],
      providers: providers,
      exports: providers,
    };
  }
}

@Module({})
class ServiceClientFeatureModule {}
