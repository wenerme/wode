import { ModuleRef } from '@nestjs/core';
import { getContext } from '@wener/nestjs';
import type { ContainerType, ResolverData } from 'type-graphql';

export class NestContainerType implements ContainerType {
  private moduleRef?: ModuleRef;

  get(someClass: any, resolverData: ResolverData<any>): any | Promise<any> {
    let ref = (this.moduleRef ||= getContext(ModuleRef));
    return ref.get(someClass, { strict: false });
  }
}
