import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { type SemVer } from 'semver';
import semver from 'semver/preload';
import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { Octokit } from '@octokit/rest';
import { requireFound } from '../../../../app/util/requireFound';

export interface IVersionFilter {
  /**
   * @default false
   */
  prerelease?: boolean;
  /**
   * @default false
   */
  loose?: boolean;
  range?: string;
  calver?: 'only' | 'ignore';
}

class VersionFilter {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  prerelease: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  loose: boolean = false;

  @ApiProperty({ required: false })
  range?: string;

  @ApiProperty({
    enum: ['only', 'ignore'],
    required: false,
  })
  calver?: string;
}

@ApiTags('GitHub')
@Controller('/github/r/:owner/:repo')
export class RepoController {
  constructor(readonly octokit: Octokit) {}

  @Get('version')
  @UsePipes(new ValidationPipe({ transform: true }))
  async version(@Param('owner') owner: string, @Param('repo') repo: string, @Query() filter: VersionFilter) {
    const { octokit } = this;
    const tags = await repoTags({ ...filter, owner, repo, octokit });
    const items = tags.map(({ name, version, commit, calver }) => ({
      tag: name,
      version: version.format(),
      commit: commit.sha,
      calver,
      semver: {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
        build: version.build,
        prerelease: version.prerelease,
      },
    }));
    return requireFound(items?.[0]);
  }

  @Get('tag')
  async listTag(@Param('owner') owner: string, @Param('repo') repo: string, @Query() filter: VersionFilter) {
    const { octokit } = this;
    const tags = await repoTags({ ...filter, owner, repo, octokit });
    const items = tags.map(({ name, version, commit }) => ({ name, version: version.format(), commit: commit.sha }));
    return { items };
  }
}

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
        version: (semver.parse(v.name) || semver.coerce(v.name)) as SemVer,
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
  if (prerelease === true) {
    tags = tags.filter((v) => v.version.prerelease.length > 0);
  } else if (prerelease === false) {
    tags = tags.filter((v) => v.version.prerelease.length === 0);
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
