import { Type } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { generate, generateMultiple, type GenerateOptions } from 'generate-password';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiConsumes, ApiProduces, ApiProperty, ApiTags } from '@nestjs/swagger';

class Options implements GenerateOptions {
  @ApiProperty({ default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  n?: number;

  @ApiProperty({ default: 10, required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(4)
  @Max(64)
  length?: number;

  @ApiProperty({ description: 'Should the password include numbers', default: false, required: false })
  @IsBooleanString()
  @IsOptional()
  numbers?: boolean;

  @ApiProperty({
    description: 'Should the password include symbols, or symbols to include',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  symbols?: boolean | string;

  @ApiProperty({ description: 'Should the password include lowercase characters', default: true, required: false })
  @IsBooleanString()
  @IsOptional()
  lowercase?: boolean;

  @ApiProperty({ description: 'Should the password include uppercase characters', default: true, required: false })
  @IsBooleanString()
  @IsOptional()
  uppercase?: boolean;

  @ApiProperty({
    description: 'Should exclude visually similar characters like "i" and "I"',
    default: false,
    required: false,
  })
  @IsBooleanString()
  @IsOptional()
  excludeSimilarCharacters?: boolean;

  @ApiProperty({ description: 'List of characters to be excluded from the password', default: '', required: false })
  @IsString()
  @MaxLength(128)
  @IsOptional()
  exclude?: string;

  @ApiProperty({
    description: 'Password should include at least one character from each pool',
    default: false,
    required: false,
  })
  @IsBooleanString()
  @IsOptional()
  strict?: boolean;
}

@ApiTags('password')
@Controller('password/generate')
export class GenerateController {
  @Get()
  @ApiConsumes('text/plain', 'application/json')
  @ApiProduces('text/plain', 'application/json')
  generate(@Query() options: Options) {
    switch (options.symbols) {
      case 'true':
      case 'false':
        options.symbols = options.symbols === 'true';
        break;
    }
    if ((options.n ?? 1) === 1) {
      return generate(options);
    }
    return generateMultiple(options.n ?? 1, options).join('\n');
  }
}
