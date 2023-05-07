import { Type } from '@nestjs/common';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

export interface IFindQuery<T> {
  offset?: number;
  limit?: number;
  filter?: number;
}

export function FindQueryOf<T>(classRef: new () => T) {
  const name = `Find${classRef.name}Query`;

  @ArgsType()
  abstract class FindQuery {
    @ApiProperty({ description: '偏移量' })
    @Field(() => Int)
    offset?: number;

    @ApiProperty({ description: '限制返回数量' })
    @Field(() => Int)
    limit?: number;

    @ApiProperty({ description: '过滤' })
    @Field(() => String)
    filter?: string;
  }

  Object.defineProperty(FindQuery, 'name', { value: name });
  return FindQuery as Type<IFindQuery<T>>;
}
