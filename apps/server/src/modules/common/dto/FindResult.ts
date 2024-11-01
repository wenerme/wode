import type { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

export interface IFindResult<T> {
  items: T[];
  total: number;
}

export function FindResultOf<T>(classRef: new () => T) {
  const name = `Find${classRef.name}Result`;

  @ObjectType(name)
  abstract class FindResult {
    @ApiProperty({
      type: classRef,
    })
    @Field(() => [classRef])
    items!: T[];

    @ApiProperty({ description: '总数' })
    @Field(() => Int)
    total!: number;
  }

  Object.defineProperty(FindResult, 'name', { value: name });
  return FindResult as Type<IFindResult<T>>;
}
