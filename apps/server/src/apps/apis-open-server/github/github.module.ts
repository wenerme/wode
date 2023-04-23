import { Logger, Module } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createFetchWithCacheProxy } from '../createFetchWithCacheProxy';
import { RepoController } from './repo.controller';

const log = new Logger('GithubModule');

@Module({
  controllers: [RepoController],
  providers: [
    {
      provide: Octokit,
      useFactory: () => {
        return new Octokit({
          request: {
            fetch: createFetchWithCacheProxy(),
          },
        });
      },
    },
  ],
})
export class GithubModule {}
