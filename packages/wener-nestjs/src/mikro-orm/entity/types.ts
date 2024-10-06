export interface IBaseEntity {
  id: string;
  uid: string;
  eid?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IUserAuditableBaseEntity extends IBaseEntity {
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
}

export interface IOwnableBaseEntity extends IBaseEntity {
  ownerId?: string;
  ownerType?: string;
  ownerUserId?: string;
  ownerUser?: IBaseEntity;
  ownerTeamId?: string;
  ownerTeam?: IBaseEntity;
}

export interface IStatefulBaseEntity extends IBaseEntity {
  state?: string;
  status?: string;
}

interface ICustomerBaseEntity extends IBaseEntity {
  customerId?: string;
  customerType?: string;

  accountId?: string;
  account?: IBaseEntity;
  contactId?: string;
  contact?: IBaseEntity;
}
