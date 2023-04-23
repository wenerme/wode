import _ from 'lodash';
import * as semver from 'semver';
import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Misc')
@Controller('semver')
export class SemverController {
  @Get(':version')
  @UsePipes(new ValidationPipe({ transform: true }))
  parse(
    @Param('version') version: string,
    @Query('clean') clean: boolean = true,
    @Query('coerce') coerce: boolean = true,
  ) {
    return toObject(version, { clean, coerce });
  }
}

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
