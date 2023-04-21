import { Logger, Module } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createFetchWithProxy } from '@wener/utils/server';
import { createFetchWithCache } from '../../../modules/fetch-cache';
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
            fetch: createFetchWithCache({
              fetch: createFetchWithProxy({
                proxy: process.env.FETCH_PROXY,
                fetch: globalThis.fetch,
              }),
              config: {
                use: 'cache',
                expires: '5m',
                match: {
                  cookie: false,
                },
                onBeforeFetch: ({ entry }) => {
                  log.log(`fetch ${entry.method} ${entry.url}`);
                },
              },
            }),
          },
        });
      },
    },
  ],
})
export class GithubModule {}
