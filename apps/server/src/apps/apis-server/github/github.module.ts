import { Module } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Module({
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
