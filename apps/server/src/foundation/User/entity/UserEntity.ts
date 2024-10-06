import { Entity, Property, types, Unique, type Hidden } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';
import { hashPassword, verifyPassword } from '@/foundation/User/password';

@Entity({ tableName: 'users' })
@Unique({ properties: ['tid', 'loginName'] })
@Unique({ properties: ['tid', 'email'] })
export class UserEntity extends TenantBaseEntity {
  @Property({ type: types.string })
  fullName!: string;

  @Property({ type: types.string, nullable: true })
  displayName?: string;

  @Property({ type: types.string, nullable: true })
  loginName?: string;

  @Property({ type: types.string, nullable: true })
  email?: string;

  @Property({ type: types.string, nullable: true })
  phoneNumber?: string;

  @Property({ type: types.string, nullable: true })
  phoneNumberVerifiedAt?: Date;

  @Property({ type: types.string, nullable: true, hidden: true })
  password?: string & Hidden;

  @Property({ type: types.string, nullable: true })
  notes?: string;

  @Property({ type: types.boolean, default: false })
  admin = false;

  async isPasswordMatch(password: string) {
    return verifyPassword({
      password: password,
      hash: this.password,
    });
  }

  async setPassword(password: string) {
    this.password = await hashPassword(password);
  }
}
