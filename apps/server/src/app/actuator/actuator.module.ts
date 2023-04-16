import * as os from 'os';
import { Logger, Module } from '@nestjs/common';
import { SystemController } from './system.controller';

@Module({
  controllers: [SystemController],
})
export class ActuatorModule {
  private readonly log = new Logger('ActuatorModule');
  constructor() {
    this.log.log(`Starting Actuator ${os.hostname()} Node ${process.version} ${os.version()} ${os.arch()}`);
  }
}
