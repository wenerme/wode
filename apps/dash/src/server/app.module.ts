import type { OnModuleInit } from '@nestjs/common';
import { Logger, Module } from '@nestjs/common';
import { App } from '@wener/nestjs/app';
import { OrmModule } from '@wener/nestjs/mikro-orm';
import {
  AuthVerificationTokenEntity,
  UserAccountEntity,
  UserEntity,
  UserSessionEntity,
} from '@wener/server/src/entity/UserEntity';

process.env.APP_NAME = 'console';
process.env.APP_COMPONENT = 'web';
const AppName = App.service;

@Module({
  imports: [
    OrmModule.forRoot({
      entities: [UserEntity, UserSessionEntity, UserAccountEntity, AuthVerificationTokenEntity],
    }),
  ],
  exports: [],
})
export class AppModule implements OnModuleInit {
  log = new Logger(AppModule.name);

  onModuleInit(): any {
    this.log.log(`init`);
  }
}
