import { Module } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { RepoController } from './repo.controller';

@Module({
  controllers: [RepoController],
  providers: [
    {
      provide: Octokit,
      useFactory: () => {
        return new Octokit({
          request: {
            // fixme use cache, use proxy
            fetch: globalThis.fetch,
          },
        });
      },
    },
  ],
})
export class GithubModule {}
