import { Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasNotesEntity } from './types';

export function withNotesEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasNotes])
  @Entity({ abstract: true })
  abstract class HasNotesMixinEntity extends Base implements HasNotesEntity {
    @Property({ type: types.string, nullable: true })
    notes?: string;
  }

  return HasNotesMixinEntity;
}
