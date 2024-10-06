import { MikroORM, QueryBuilder } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { applySearch } from '@wener/nestjs/entity/service';
import { CustomBaseEntityService } from '@/foundation/services/CustomBaseEntityService';
import { UserEntity } from '@/foundation/User/entity/UserEntity';

@Injectable()
export class UserService extends CustomBaseEntityService<UserEntity> {
  constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
    super(orm, UserEntity);
  }

  applySearch<T extends QueryBuilder<UserEntity>>({ builder, search }: { builder: T; search: string }) {
    applySearch({
      search,
      builder,
      onSearch: (s, { or }) => {
        or.push(
          { displayName: { $ilike: `%${s}%` } },
          { fullName: { $ilike: `%${s}%` } },
          { loginName: { $ilike: `%${s}%` } },
        );
      },
      onMobilePhone: (s, { or }) => {
        or.push({ mobilePhone: s });
      },
    });
  }

  async checkPassword({ user, password }: { user: UserEntity; password: string }) {
    const match = await user.isPasswordMatch(password);
    let needMigration = false;

    if (match) {
      let pwd = user.password;
      // migrate to PHC
      needMigration = !pwd?.startsWith('$');
      if (!needMigration) {
        const id = pwd?.match(/^\$(\w+)/)?.[1];
        switch (id) {
          case 'base64':
            needMigration = true;
            break;
        }
      }
    }

    if (needMigration) {
      this.log.log(`Migrate password for ${user.id}`);
      await user.setPassword(password);
      await this.em.persistAndFlush(user);
    }

    return match;
  }
}
