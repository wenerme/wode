import type { EntityManager } from '@mikro-orm/postgresql';
import { getEntityManager } from '@wener/server/mikro-orm';
import { createAlpineMirror, getOfficialAlpineMirrorUrl } from 'common/alpine';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { AlpinePackageMetaEntity } from '@/alpine/entity/AlpinePackageMetaEntity';
import { AlpineRepoMetaEntity } from '@/alpine/entity/AlpineRepoMetaEntity';

type Matrix = {
	branches: string[];
	architectures: string[];
	channels: string[];
};

const AlpineArchitectures = ['x86', 'x86_64', 'armv7', 'armhf', 'aarch64', 'ppc64le', 's390x'];
const AlpineChannels = ['main', 'community'];
const EdgeBranches = {
	branches: ['edge'],
	architectures: [...AlpineArchitectures, 'riscv64'],
	channels: ['main', 'community', 'testing'],
};
const AlpineBranches: Matrix[] = [
	EdgeBranches,
	{
		branches: ['v3.22', 'v3.21', 'v3.20', 'v3.19', 'v3.18', 'v3.17', 'v3.16', 'v3.15', 'v3.14'],
		architectures: AlpineArchitectures,
		channels: ['main', 'community'],
	},
];

export async function runFetchApkIndex({
	em = getEntityManager<EntityManager>(),
	variants = AlpineBranches,
	mirrorUrl = getOfficialAlpineMirrorUrl(),
	log = consola.withTag(runFetchApkIndex.name),
}: {
	em?: EntityManager;
	variants?: Array<Matrix>;
	mirrorUrl?: string;
	log?: ConsolaInstance;
}) {
	const vars = variants.flatMap((v) => {
		return v.branches.flatMap((branch) =>
			v.architectures.flatMap((arch) =>
				v.channels.map((channel) => {
					return {
						path: `${branch}/${channel}/${arch}`,
						branch,
						arch,
						channel,
					};
				}),
			),
		);
	});

	const mirror = createAlpineMirror(mirrorUrl);

	for (let v of vars) {
		const logger = log.withTag(v.path);
		logger.log(`fetching`);
		let repo = mirror.getRepo(v);
		const { index, packages } = await repo.getIndex();
		const { branch, arch, channel } = v;
		logger.log(`fetched ${index.description} ${index.mtime.toISOString()} total ${packages.length} packages`);

		// fork avoid share identity map
		await em.fork().transactional(async (em) => {
			let repoMeta = await em.findOne(AlpineRepoMetaEntity, {
				branch,
				arch,
				channel,
			});
			let changed = true;
			if (!repoMeta) {
				repoMeta = await em.upsert(
					AlpineRepoMetaEntity,
					{
						branch,
						arch,
						channel,
						lastModifiedTime: index.mtime,
						description: index.description,
						version: index.description,
					},
					{
						onConflictFields: ['path'],
					},
				);
			} else {
				changed = repoMeta.version !== index.description;
			}

			if (!changed) {
				logger.log(`skip version not change`);
				return;
			}

			repoMeta.lastModifiedTime = index.mtime;
			repoMeta.description = index.description;
			repoMeta.version = index.description;
			await em.persist(repoMeta).flush();

			let pkgs = packages.map((v) => {
				const {
					checksum,
					pkg,
					version,
					description,
					arch,
					size,
					installSize,
					maintainer,
					origin,
					buildTime,
					commit,
					license,
					providerPriority,
					url,
					depends,
					provides,
					installIf,
					maintainerName,
					maintainerEmail,
				} = v;
				return em.create(AlpinePackageMetaEntity, {
					branch,
					arch,
					channel,

					checksum,
					pkg,
					version,
					description,
					size,
					installSize,
					maintainer,
					origin,
					buildTime,
					commit,
					license,
					providerPriority,
					url,
					depends,
					provides,
					installIf,
					maintainerName,
					maintainerEmail,
				});
			});
			await em.upsertMany(AlpinePackageMetaEntity, pkgs, {
				onConflictFields: ['path'],
				onConflictAction: 'merge',
			});
			return;
		});
	}
}
