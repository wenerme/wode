import { Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from 'type-graphql';

@ArgsType()
export class PageRequestArg {
  @Field((type) => Int, { nullable: true, description: '每页大小' })
  @Min(1)
  @Max(1000)
  pageSize?: number;

  @Field((type) => Int, { nullable: true, description: '页码 - 0 开始' })
  @Min(0)
  pageIndex?: number;

  @Field((type) => Int, { nullable: true, description: '页号 - 1 开始' })
  @Min(1)
  pageNumber?: number;

  @Field((type) => Int, { nullable: true, description: '每页大小' })
  @Min(1)
  limit?: number;

  @Field((type) => Int, { nullable: true, description: '偏移量' })
  @Min(0)
  offset?: number;

  @Field((type) => String, { nullable: true, description: '搜索' })
  search?: string;

  @Field((type) => String, { nullable: true, description: '筛选' })
  filter?: string;

  @Field((type) => Boolean, { nullable: true, description: '是否包含已删除' })
  deleted?: boolean;

  // @Field({ nullable: true,description:'排序;格式: field [asc|desc],[...]' })
  // order?: string;
  //
  // @Field({ nullable: true, description:'分页游标' })
  // before?: string;
  //
  // @Field({ nullable: true, description:'分页游标' })
  // after?: string;
  //
  // @Field((type) => [String], { nullable: true, description:'选择字段' })
  // select?: string[];
  //
  // @Field((type) => [String], { nullable: true, description:'包含额外字段' })
  // include?: string[];
  //
  // @Field((type) => [String], { nullable: true, description:'排除字段' })
  // exclude?: string[];

  @Field((type) => String, { nullable: true, description: '游标' })
  cursor?: string;
}
