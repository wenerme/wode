import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export type Actions = 'view' | 'read' | 'write' | 'create' | 'delete' | 'update' | 'manage' | 'list';
export type Subjects = 'User' | 'all' | 'page';
export type Abilities = [Actions, Subjects];
export type ConsoleAbility = MongoAbility<Abilities>;

interface AuthUser {
  id: string;
  roles: string[];
}

export function buildUserAbility(user: AuthUser, builder = new AbilityBuilder<ConsoleAbility>(createMongoAbility)) {
  {
    // public
    const { can } = builder;
    can('view', 'page', ['/', '/work', '/setting/**', '/about/', '/about']);
  }

  const { can, cannot } = builder;

  for (let role of user.roles) {
    switch (role) {
      case 'system:admin':
      case 'admin':
        can('manage', 'all');
        break;
    }
  }
  return builder;
}

export function defineAbilityForUser(user: AuthUser): ConsoleAbility {
  return buildUserAbility(user).build();
}

type DefinePermissions = (user: AuthUser, builder: AbilityBuilder<ConsoleAbility>) => void;
export type RoleName = string;
