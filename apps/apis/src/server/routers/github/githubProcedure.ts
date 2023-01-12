import { Octokit } from '@octokit/rest';
import { publicProcedure } from '../../trpc';

export const githubProcedure = publicProcedure.use(({ next, ctx }) => {
  return next({ ctx: { ...ctx, octokit: getOctokit() } });
});

let _octokit;

function getOctokit() {
  return (_octokit ||= new Octokit());
}
