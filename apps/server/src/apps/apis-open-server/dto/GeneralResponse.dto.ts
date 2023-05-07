import { ApiProperty } from '@nestjs/swagger';

export class GeneralResponse {
  @ApiProperty({
    description: 'HTTP 状态码',
  })
  status!: number;

  @ApiProperty({
    description: '业务代码',
  })
  code!: number;

  @ApiProperty({
    description: '信息说明',
  })
  message!: string;

  @ApiProperty()
  detail?: Record<string, any>;

  @ApiProperty()
  data?: Record<string, any>;
}
