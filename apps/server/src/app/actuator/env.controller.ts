import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Role, Roles } from '../auth';
import { hideActuatorApi } from './const';

class SetEnvBody {
  @ApiProperty()
  value!: string;
}

class SetEnvResult {
  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  old?: string;

  @ApiProperty({ required: false })
  neo?: string;
}

@ApiTags('Actuator')
@ApiBearerAuth()
@Roles(Role.SystemAdmin)
@Controller('actuator/env')
@ApiExcludeController(hideActuatorApi())
export class EnvController {
  @Get()
  @ApiOperation({
    summary: 'List Env',
  })
  listEnv() {
    return process.env;
  }

  @Get(':name')
  @ApiOperation({
    summary: 'Get Env',
  })
  @ApiOkResponse({
    type: Object,
  })
  getEnv(@Param('name') name: string) {
    return process.env[name];
  }

  @Post(':name')
  @ApiOperation({
    summary: 'Set Env',
  })
  @ApiOkResponse({
    type: SetEnvResult,
  })
  setEnv(@Param('name') name: string, @Body() { value }: SetEnvBody) {
    const old = process.env[name];
    process.env[name] = value;
    return { name, old, neo: value };
  }
}
