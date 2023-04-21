import { IsEnum, IsString, MaxLength } from 'class-validator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { hex, sha1, sha256, sha384, sha512 } from '@wener/utils';

class HashDigestResponse {
  @ApiProperty()
  base64!: string;
  @ApiProperty()
  sha1!: string;
  @ApiProperty()
  sha256!: string;
  @ApiProperty()
  sha384!: string;
  @ApiProperty()
  sha512!: string;
}
class HashDigestRequest {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  data!: string;
  @ApiProperty({
    default: 'raw',
    enum: ['raw', 'base64'],
  })
  @IsEnum(['raw', 'base64'])
  encoding?: string;
}

@Controller('hash')
export class HashController {
  @Post('digest')
  @ApiOkResponse({ type: HashDigestResponse })
  // @UsePipes(new ValidationPipe({ transform: true }))
  async digest(@Body() { data, encoding = 'raw' }: HashDigestRequest) {
    if (encoding === 'base64') {
      data = atob(data);
    }
    return {
      base64: btoa(data),
      sha1: hex(await sha1(data)),
      sha256: hex(await sha256(data)),
      sha384: hex(await sha384(data)),
      sha512: hex(await sha512(data)),
    };
  }
}
