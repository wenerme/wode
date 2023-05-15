import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';

@Module({
  imports: [FastifyMulterModule],
  controllers: [QrController],
})
export class QrModule {}
