import { graphql } from '@/gql';

export const CurrentUserFragment = graphql(`
  fragment CurrentUserFragment on CurrentUser {
    id
    fullName
    displayName
    photoUrl
    loginName
    email
    joinDate
    #    roles: allRoles {
    #      id
    #      title
    #      code
    #    }
  }
`);

export const CurrentUserQuery = graphql(`
  query CurrentUserQuery {
    data: currentUser {
      id
      ...CurrentUserFragment
    }
  }
`);
