import { requireFound } from 'common/src/trpc/handlers';
import type { Range, SemVer } from 'semver';
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
        calver: z.string().optional(),
      }),
    )
    .output(
      z.object({
        tag: z.string(),
        version: z.string(),
        commit: z.string(),
        calver: z
          .object({
            year: z.number(),
            month: z.number().optional(),
          })
          .optional(),
        semver: z.object({
          major: z.number(),
          minor: z.number(),
          patch: z.number(),
        }),
      }),
    )
    .query(async ({ input, ctx: { octokit } }) => {
      const tags = await repoTags({ ...input, octokit });

      const items = tags.map(({ name, version, commit, calver }) => ({
        tag: name,
        version: version.format(),
        commit: commit.sha,
        calver,
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
  calver,
}: {
  octokit: Octokit;
  repo: string;
  owner: string;
  range?: string;
  prerelease?: boolean;
  calver?: string;
}) {
  // https://docs.github.com/rest/reference/repos#list-repository-tags
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
    .filter((v) => v.version)
    .map((v) => {
      if (v.version.major > 2000) {
        // calendar
        const calver = {
          year: v.version.major,
          month: v.version.minor,
        };
        return { ...v, calver };
      }
      return { ...v, calver: undefined };
    });
  if (calver === 'only') {
    tags = tags.filter((v) => v.calver);
  } else if (calver === 'ignore') {
    tags = tags.filter((v) => !v.calver);
  }
  if (range) {
    tags = tags.filter((v) =>
      semver.satisfies(v.version, range, {
        includePrerelease: prerelease,
      }),
    );
  }
  // 遇到 calver 会导致排序失败 - 可以考虑 node_id
  // sort by version
  tags.sort((a, b) => semver.compare(b.version, a.version));
  return tags;
}

interface TagInfo {
  name: string;
  version: SemVer;
  commit: string;
  calver?: {
    year: number;
    month: number;
  };
}

function filter(
  v: SemVer,
  {
    range,
    prerelease,
    calver,
  }: {
    range?: Range;
    prerelease?: boolean;
    calver?: string;
  },
) {
  if (range && !semver.satisfies(v, range)) {
    return false;
  }
  if (calver === 'only' && v.major < 2000) {
    return false;
  } else if (calver === 'ignore' && v.major > 2000) {
    return false;
  }
  if (prerelease !== undefined) {
    if (prerelease && !v.prerelease.length) {
      return false;
    }
    if (!prerelease && v.prerelease.length) {
      return false;
    }
  }
  return true;
}
