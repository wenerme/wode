import { ConfigurableModuleBuilder, Module, type DynamicModule, type Provider } from '@nestjs/common';
import { ClientRegistry, type ClientMiddleware } from './ClientRegistry';
import type { ClientConnection } from './types';

export const SERVICE_CLIENT_CONNECTION = Symbol('SERVICE_CLIENT_CONNECTION');

export interface ServiceClientModuleOptions {
  connection?: ClientConnection;
  middlewares?: ClientMiddleware[];
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ServiceClientModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .setClassMethodName('forRoot')
  .build();

export const SERVICE_CLIENT_MODULE_OPTIONS = MODULE_OPTIONS_TOKEN;

@Module({
  providers: [
    {
      provide: ClientRegistry,
      useFactory(conn: ClientConnection, { connection, middlewares = [] }: ServiceClientModuleOptions = {}) {
        const cli = new ClientRegistry();
        cli.connect(conn ?? connection);
        cli.middlewares = middlewares;
        return cli;
      },
      inject: [
        { token: SERVICE_CLIENT_CONNECTION, optional: true },
        { token: MODULE_OPTIONS_TOKEN, optional: true },
      ],
    },
  ],
  exports: [ClientRegistry],
})
export class ServiceClientModule extends ConfigurableModuleClass {
  static forFeature(svcs: any[]): DynamicModule {
    const providers = svcs.map(
      (v) =>
        ({
          provide: v,
          useFactory(clientRegistry: ClientRegistry) {
            return clientRegistry.getClient(v);
          },
          inject: [ClientRegistry],
        }) as Provider,
    );
    return {
      module: ServiceClientFeatureModule,
      imports: [],
      providers,
      exports: providers,
    };
  }
}

@Module({})
class ServiceClientFeatureModule {}
