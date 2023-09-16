import * as os from 'node:os';
import process from 'node:process';
import { Logger, Module } from '@nestjs/common';
import { EnvController } from './env.controller';
import { HealthController } from './health.controller';
import { ProcessController } from './process.controller';

@Module({
  controllers: [ProcessController, EnvController, HealthController],
})
export class ActuatorModule {
  private readonly log = new Logger('ActuatorModule');

  constructor() {
    this.log.log(`Starting Actuator ${os.hostname()} Node ${process.version} ${os.version()} ${os.arch()}`);
  }
}
