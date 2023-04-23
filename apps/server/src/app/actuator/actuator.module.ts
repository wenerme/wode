import * as os from 'os';
import { Logger, Module } from '@nestjs/common';
import { EnvController } from './env.controller';
import { HealthController } from './health.controller';
import { SystemController } from './system.controller';

@Module({
  controllers: [SystemController, EnvController, HealthController],
})
export class ActuatorModule {
  private readonly log = new Logger('ActuatorModule');

  constructor() {
    this.log.log(`Starting Actuator ${os.hostname()} Node ${process.version} ${os.version()} ${os.arch()}`);
  }
}
