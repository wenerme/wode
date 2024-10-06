import { Inject, Injectable } from '@nestjs/common';
import { RelayNode } from '@wener/nestjs/type-graphql';
import { Errors } from '@wener/utils';
import { Arg, Authorized, ID, Query, Resolver } from 'type-graphql';
import { CustomAutoEntityService } from '@/foundation/services/CustomAutoEntityService';

@Resolver(() => RelayNode)
@Injectable()
export class RelayNodeResolver {
  constructor(@Inject(CustomAutoEntityService) private readonly es: CustomAutoEntityService) {}

  @Authorized()
  @Query(() => RelayNode)
  async node(@Arg('id', () => ID) id: string) {
    const { entity } = await this.es.resolveEntity({ id });
    Errors.NotFound.check(entity);
    return entity;
  }
}
