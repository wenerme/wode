import { classOf } from '@wener/utils';
import { StandardBaseEntity } from './StandardBaseEntity';
import { parseTypeId } from './parseTypeId';

export function setOwner<
  T extends {
    ownerId?: string;
    ownerType?: string;
  },
>(entity?: StandardBaseEntity | string | null, out: T = {} as T): T {
  if (!entity) {
    out.ownerId = undefined;
    out.ownerType = undefined;
    return out;
  }
  if (typeof entity === 'string') {
    const [tag] = parseTypeId(entity);
    switch (tag) {
      case 'usr':
        out.ownerType = 'User';
        break;
      case 'team':
        out.ownerType = 'Team';
        break;
      case 'dept':
        out.ownerType = 'Department';
        break;
      default:
        throw new Error(`Invalid owner id ${entity}`);
    }
    out.ownerId = entity;
  } else {
    // avoid circular dependency
    switch (classOf(entity)) {
      case 'UserEntity':
        out.ownerType = 'User';
        break;
      case 'TeamEntity':
        out.ownerType = 'Team';
        break;
      case 'DepartmentEntity':
        out.ownerType = 'Department';
        break;
      default:
        throw new Error(`Invalid owner type ${entity}`);
    }
    out.ownerId = entity.id;
  }
  return out;
}
