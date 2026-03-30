import { buildDynamicModule, resolveProvides } from '@wener/server/nest';
import { getGlobalStates } from '@wener/utils';
import { AlpinePackageMetaService } from '@/alpine/AlpinePackageMetaService';
import { AlpineRepoMetaService } from '@/alpine/AlpineRepoMetaService';
import { AlpinePackageMetaEntity } from '@/alpine/entity/AlpinePackageMetaEntity';
import { AlpineRepoMetaEntity } from '@/alpine/entity/AlpineRepoMetaEntity';
import { MikroORMFixer } from '@/apps/wener-apis-server/MikroORMFixer';

function getWenerApisProvides() {
	return [
		//
		AlpinePackageMetaEntity,
		AlpinePackageMetaService,
		AlpineRepoMetaEntity,
		AlpineRepoMetaService,
	];
}

export function getWenerApisDynamicModule() {
	return getGlobalStates('InstanceDynamicModule', () =>
		buildDynamicModule(resolveProvides(getWenerApisProvides()), {
			imports: [MikroORMFixer],
			// providers: [
			// 	{
			// 		provide: AutoEntityService,
			// 		useClass: CustomAutoEntityService,
			// 	},
			// ],
		}),
	);
}
