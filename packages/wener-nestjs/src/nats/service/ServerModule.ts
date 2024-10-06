import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { NatsServiceServerModuleOptions } from './types';

export default new ConfigurableModuleBuilder<NatsServiceServerModuleOptions>()
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
