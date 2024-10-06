import { bundle } from '@wener/nestjs/scripts/esbuild';

const SERVER = process.env.SERVER;
if (!SERVER) {
  throw new Error(`No server to bundle`);
}

await Promise.all(
  SERVER.split(',')
    .map((v) => v.trim())
    .map((v) =>
      bundle(v, (o) => {
        o.external ||= [];
        o.external.push(
          //
          'mariadb/callback',
        );
      }),
    ),
);
