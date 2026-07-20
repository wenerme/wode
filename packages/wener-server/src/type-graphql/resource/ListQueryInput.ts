import { Max, Min } from 'class-validator';
import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class ListQueryInput {
	@Field((_type) => Int, { nullable: true, description: '每页大小' })
	@Min(1)
	@Max(1000)
	pageSize?: number;

	@Field((_type) => Int, { nullable: true, description: '页码 - 0 开始' })
	@Min(0)
	pageIndex?: number;

	@Field((_type) => Int, { nullable: true, description: '页号 - 1 开始' })
	@Min(1)
	pageNumber?: number;

	@Field((_type) => Int, { nullable: true, description: '每页大小' })
	@Min(1)
	limit?: number;

	@Field((_type) => Int, { nullable: true, description: '偏移量' })
	@Min(0)
	offset?: number;

	@Field((_type) => String, { nullable: true, description: '搜索' })
	search?: string;

	@Field((_type) => String, { nullable: true, description: '筛选' })
	filter?: string;

	@Field((_type) => [String], { nullable: true, description: '筛选' })
	filters?: string[];

	@Field((_type) => Boolean, { nullable: true, description: '是否包含已删除' })
	deleted?: boolean;

	@Field((_type) => String, { nullable: true, description: '游标' })
	cursor?: string;

	@Field((_type) => [String], { nullable: true, description: '顺序' })
	order?: string[];

	@Field((_type) => [String], { nullable: true, description: 'Filter by ids' })
	ids?: string[];
}
