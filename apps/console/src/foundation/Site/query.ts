import { graphql } from '@/gql';

export const PingQuery = graphql(`
  query PingQuery {
    data: ping {
      message
    }
  }
`);

export const ResolveSiteConfMutation = graphql(`
  mutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {
    data: resolveSiteConf(input: $input) {
      data {
        tid
        title
        serverUrl
        baseUrl
        features
        metadata
      }
    }
  }
`);
