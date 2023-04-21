import { Module } from '@nestjs/common';
import { PackageController } from './package.controller';

@Module({ controllers: [PackageController] })
export class AlpineModule {}
