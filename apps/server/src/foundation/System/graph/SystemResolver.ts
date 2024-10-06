import { Inject } from '@nestjs/common';
import { GeneralResponseObject, RelayMutationInput, runRelayClientMutation } from '@wener/nestjs/type-graphql';
import { Arg, Authorized, Mutation, Resolver } from 'type-graphql';
import { runSystemMaintenance } from '@/foundation/jobs/runSystemMaintenance';
import { SystemService } from '@/foundation/System/SystemService';
import { SystemRole } from '@/graph/const';

@Resolver()
export class SystemResolver {
  @Inject(SystemService) svc!: SystemService;

  @Authorized(SystemRole.SystemAdmin)
  @Mutation(() => GeneralResponseObject)
  runSystemMaintenance(@Arg('input', () => RelayMutationInput) input: RelayMutationInput) {
    return runRelayClientMutation(input, async () => {
      await runSystemMaintenance();
      return {
        message: 'OK',
      };
    });
  }
}
