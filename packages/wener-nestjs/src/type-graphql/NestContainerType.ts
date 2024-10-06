import { ModuleRef } from '@nestjs/core';
import type { ContainerType, ResolverData } from 'type-graphql';
import { getContext } from '../context';

export class NestContainerType implements ContainerType {
  private moduleRef?: ModuleRef;

  get(someClass: any, resolverData: ResolverData<any>): any | Promise<any> {
    let ref = (this.moduleRef ||= getContext(ModuleRef));
    return ref.get(someClass, { strict: false });
  }
}
