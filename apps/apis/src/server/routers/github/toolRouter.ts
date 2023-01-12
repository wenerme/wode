import _ from 'lodash';
import * as semver from 'semver';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';

export const toolRouter = router({
  semver: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/tool/semver/{version}' } })
    .input(z.object({ version: z.string() }))
    .output(z.object({}).passthrough())
    .query(({ input: { version } }) => {
      return toObject(version, { clean: true, coerce: true });
    }),
});

function toObject(raw: string | null | undefined, { clean, coerce }: { clean?: boolean; coerce?: boolean } = {}) {
  const ver = semver.parse(raw);
  if (raw === null) {
    raw = undefined;
  }
  let out: any;
  const props = ['raw', 'minor', 'major', 'prerelease', 'patch', 'build', 'version'];
  if (!ver) {
    out = { valid: false, raw };
  } else {
    out = _.pick(ver, props);
  }
  if (clean) {
    out.clean = toObject(semver.clean(raw || ''));
  }
  if (coerce) {
    out.coerce = toObject(semver.coerce(raw || '')?.version);
  }
  return { valid: true, ...out };
}
