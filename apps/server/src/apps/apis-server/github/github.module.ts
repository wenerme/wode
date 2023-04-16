import { Module } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { RepoController } from './repo.controller';

@Module({
  controllers: [RepoController],
  providers: [
    {
      provide: Octokit,
      useFactory: () => {
        return new Octokit();
      },
    },
  ],
})
export class GithubModule {}
