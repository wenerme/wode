import { requireFound } from 'common/src/trpc/handlers';
import type { SemVer } from 'semver';
import semver from 'semver/preload';
import { z } from 'zod';
import type { Octokit } from '@octokit/rest';
import { router } from '../../trpc';
import { githubProcedure } from './githubProcedure';

const tagRouter = router({
  list: githubProcedure
    .meta({ openapi: { method: 'GET', path: '/github/r/{owner}/{repo}/tag' } })
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        range: z.string().optional(),
        prerelease: z.boolean().default(false).optional(),
      }),
    )
    .output(z.object({}).passthrough())
    .query(async ({ input, ctx: { octokit } }) => {
      const tags = await repoTags({ ...input, octokit });
      const items = tags.map(({ name, version, commit }) => ({ name, version: version.format(), commit: commit.sha }));
      return { items };
    }),
});
export const repoRouter = router({
  tag: tagRouter,
  version: githubProcedure
    .meta({ openapi: { method: 'GET', path: '/github/r/{owner}/{repo}/version' } })
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        range: z.string().optional(),
        prerelease: z.boolean().default(false).optional(),
      }),
    )
    .output(
      z.object({
        tag: z.string(),
        version: z.string(),
        commit: z.string(),
        semver: z.object({
          major: z.number(),
          minor: z.number(),
          patch: z.number(),
        }),
      }),
    )
    .query(async ({ input, ctx: { octokit } }) => {
      const tags = await repoTags({ ...input, octokit });
      const items = tags.map(({ name, version, commit }) => ({
        tag: name,
        version: version.format(),
        commit: commit.sha,
        semver: {
          major: version.major,
          minor: version.minor,
          patch: version.patch,
        },
      }));
      return requireFound(items?.[0]);
    }),
});

async function repoTags({
  owner,
  repo,
  octokit,
  range,
  prerelease,
}: {
  octokit: Octokit;
  repo: string;
  owner: string;
  range?: string;
  prerelease?: boolean;
}) {
  const { data } = await octokit.rest.repos.listTags({
    owner,
    repo,
    per_page: 100,
  });
  let tags = data
    .map((v) => {
      return {
        ...v,
        version: semver.coerce(v.name) as SemVer,
      };
    })
    .filter((v) => v.version);
  if (range) {
    tags = tags.filter((v) =>
      semver.satisfies(v.version, range, {
        includePrerelease: prerelease,
      }),
    );
  }
  // sort by version
  tags.sort((a, b) => semver.compare(b.version, a.version));
  return tags;
}
