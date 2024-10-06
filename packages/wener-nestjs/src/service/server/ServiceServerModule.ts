import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { ServiceRegistry, type ServerMiddleware } from './ServiceRegistry';

export interface ServiceServerModuleOptions {
  middlewares?: ServerMiddleware[];
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ServiceServerModuleOptions>()
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

export const SERVICE_SERVER_MODULE_OPTIONS = MODULE_OPTIONS_TOKEN;

@Module({
  imports: [],
  providers: [
    {
      provide: ServiceRegistry,
      useFactory: ({ middlewares }: ServiceServerModuleOptions = {}) => {
        const sr = new ServiceRegistry();
        sr.middlewares = middlewares ?? [];
        return sr;
      },
      inject: [{ token: MODULE_OPTIONS_TOKEN, optional: true }],
    },
  ],
  exports: [ServiceRegistry],
})
export class ServiceServerModule extends ConfigurableModuleClass {}
