import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasNotesEntity } from './types';

export function withNotesEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasNotes])
	abstract class HasNotesMixinEntity extends Base implements HasNotesEntity {
		notes?: string;
	}

	return defineMixinEntity(Base, HasNotesMixinEntity, {
		name: 'HasNotesMixinEntity',
		properties: { notes: p.string().nullable() },
	});
}
