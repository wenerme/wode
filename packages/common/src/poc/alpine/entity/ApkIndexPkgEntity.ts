import { Entity, Property, types } from '@mikro-orm/core';
import { StandardBaseEntity } from '@/entity/base/StandardBaseEntity';

@Entity({ tableName: 'apk_index_pkg', schema: 'alpine' })
export class ApkIndexPkgEntity extends StandardBaseEntity {
  @Property({ type: types.string, unique: true })
  path!: string; // ${branch}/${arch}/${pkg}/${pkg}-${version}.apk
  @Property({ type: types.string })
  branch!: string;
  @Property({ type: types.string })
  repo!: string;
  @Property({ type: types.string })
  arch!: string;
  @Property({ type: types.string })
  pkg!: string;
  @Property({ type: types.string })
  version!: string;

  @Property({ type: types.string })
  checksum!: string;
  @Property({ type: types.string })
  description!: string;
  @Property({ type: types.bigint })
  size!: number;
  @Property({ type: types.bigint })
  installSize!: number;
  @Property({ type: types.string })
  maintainer!: string;
  @Property({ type: types.string })
  origin!: string;
  @Property({ type: types.bigint })
  buildTime!: number;
  @Property({ type: types.string })
  commit!: string;
  @Property({ type: types.string })
  license!: string;
  @Property({ type: types.string })
  providerPriority!: number;
  @Property({ type: types.string })
  url!: string;
  @Property({ type: types.array })
  depends!: string[];
  @Property({ type: types.array })
  provides!: string[];
  @Property({ type: types.array })
  installIf!: string[];
}
