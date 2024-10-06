import { gqlr } from '@wener/console/client/graphql';
import { PingQuery, ResolveSiteConfMutation } from './query';

export namespace SiteActions {
  export const ping = async () => {
    await gqlr(PingQuery);
    return {};
  };

  export const resolveSiteConf = async (input: { tid?: string }) => {
    const { data } = await gqlr(ResolveSiteConfMutation, { input });
    return data.data;
  };
}
