import { type Opt, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasStateStatusEntity } from './types';

export function withStateStatusEntity({ status, state }: { status: string; state: string }) {
	return <TBase extends Constructor>(Base: TBase) => {
		@Feature([EntityFeature.HasStateStatus])
		class HasStateStatusMixinEntity extends Base implements HasStateStatusEntity {
			state!: string & Opt;
			status!: string & Opt;
		}

		return defineMixinEntity(Base, HasStateStatusMixinEntity, {
			name: 'HasStateStatusMixinEntity',
			properties: {
				state: p.string().default(state),
				status: p.string().default(status),
			},
		});
	};
}
