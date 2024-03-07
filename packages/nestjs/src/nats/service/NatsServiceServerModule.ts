import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Inject, Module } from '@nestjs/common';
import { ServiceServerModule } from '../../service';
import { SERVICE_SERVER_MODULE_OPTIONS, ServiceServerModuleOptions } from '../../service/server/ServiceServerModule';
import { NatsModule } from '../NatsModule';
import { NatsServerHandler } from './NatsServerHandler';
import { NatsServerRegistry } from './NatsServerRegistry';
import ServerModule from './ServerModule';
import type { NatsServiceServerModuleOptions } from './types';

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = ServerModule;

@Module({
  imports: [ServiceServerModule, NatsModule],
  providers: [
    NatsServerHandler,
    NatsServerRegistry,
    {
      provide: SERVICE_SERVER_MODULE_OPTIONS,
      useFactory: ({ middlewares }: NatsServiceServerModuleOptions): ServiceServerModuleOptions => {
        return { middlewares };
      },
      inject: [{ token: MODULE_OPTIONS_TOKEN, optional: true }],
    },
  ],
  exports: [NatsServerRegistry, ServiceServerModule, SERVICE_SERVER_MODULE_OPTIONS],
})
export class NatsServiceServerModule
  extends ConfigurableModuleClass
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  @Inject(NatsServerHandler) private readonly hdr!: NatsServerHandler;

  async onApplicationShutdown() {
    return this.hdr.close();
  }

  onApplicationBootstrap(): any {
    this.hdr.listen();
  }
}
