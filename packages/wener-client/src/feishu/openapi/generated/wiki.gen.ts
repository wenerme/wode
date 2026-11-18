// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiWiki = {
	'wiki.members.create': {
		pathParams: z.strictObject({
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间 ID'),
		}),
		query: z.looseObject({
			need_notification: z.union([z.boolean(), z.stringbool()]).describe('添加权限后是否通知对方').optional(),
		}),
		body: z.looseObject({
			member_id: z.string().describe('成员或管理员的 ID，值的类型由 member_type 参数决定'),
			member_role: z.string().describe('成员的角色类型'),
			member_type: z.string().describe('要添加的成员或管理员的身份类型'),
		}),
		response: z.looseObject({
			member: z.looseObject({
				member_id: z.string().describe('成员或管理员的 ID，值的类型由 member_type 参数决定').optional(),
				member_role: z.string().describe('成员的角色类型').optional(),
				member_type: z.string().describe('要添加的成员或管理员的身份类型').optional(),
				type: z.string().describe('知识库协作者类型（未来支持）').optional(),
			}).describe('知识空间成员').optional(),
		}),
	},
	'wiki.members.delete': {
		pathParams: z.strictObject({
			member_id: z.union([z.string(), z.number().transform(String)]).describe('成员id，值的类型由请求体的 member_type 参数决定'),
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间id'),
		}),
		body: z.looseObject({
			member_role: z.string().describe('角色:'),
			member_type: z.string().describe('“openchat” - 群id'),
			type: z.enum(['user', 'chat', 'department']).describe('知识库协作者类型（暂不支持）').optional(),
		}),
		response: z.looseObject({
			member: z.looseObject({
				member_id: z.string().describe('用户id，值的类型由上面的 member_type 参数决定').optional(),
				member_role: z.string().describe('角色:').optional(),
				member_type: z.string().describe('“openchat” - 群id').optional(),
				type: z.string().describe('知识库协作者类型（暂不支持）').optional(),
			}).describe('成员信息').optional(),
		}),
	},
	'wiki.members.list': {
		pathParams: z.strictObject({
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间 ID'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			members: z.array(z.looseObject({
				member_id: z.string().describe('知识库协作者 ID').optional(),
				member_role: z.string().describe('知识库协作者角色').optional(),
				member_type: z.string().describe('知识库协作者 ID 类型').optional(),
				type: z.string().describe('知识库协作者类型（未来支持）').optional(),
			})).describe('空间成员列表').optional(),
			page_token: z.string().describe('分页标记').optional(),
		}),
	},
	'wiki.nodes.copy': {
		pathParams: z.strictObject({
			node_token: z.union([z.string(), z.number().transform(String)]).describe('节点token'),
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间id'),
		}),
		body: z.looseObject({
			target_parent_token: z.string().describe('目标父节点 Token').optional(),
			target_space_id: z.string().describe('目标知识空间 ID').optional(),
			title: z.string().describe('复制后的新标题').optional(),
		}),
		response: z.looseObject({
			node: z.looseObject({
				creator: z.string().describe('节点创建者').optional(),
				has_child: z.boolean().describe('是否有子节点').optional(),
				node_create_time: z.string().describe('节点创建时间').optional(),
				node_creator: z.string().describe('节点创建者').optional(),
				node_token: z.string().describe('节点token').optional(),
				node_type: z.string().describe('节点类型').optional(),
				obj_create_time: z.string().describe('文档创建时间').optional(),
				obj_edit_time: z.string().describe('文档最近编辑时间').optional(),
				obj_token: z.string().describe('对应文档类型的token，可根据 obj_type 判断属于哪种文档类型').optional(),
				obj_type: z.string().describe('文档类型，对于快捷方式，该字段是对应的实体的obj_type').optional(),
				origin_node_token: z.string().describe('快捷方式对应的实体node_token，当节点为快捷方式时，该值不为空').optional(),
				origin_space_id: z.string().describe('快捷方式对应的实体所在的space id').optional(),
				owner: z.string().describe('节点所有者').optional(),
				parent_node_token: z.string().describe('父节点 token').optional(),
				space_id: z.string().describe('知识空间id;[获取方式](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-overview)').optional(),
				title: z.string().describe('文档标题').optional(),
			}).describe('创建副本后的新节点').optional(),
		}),
	},
	'wiki.nodes.create': {
		pathParams: z.strictObject({
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间id;[获取方式](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-overview)'),
		}),
		body: z.looseObject({
			node_type: z.enum(['origin', 'shortcut']).describe('节点类型'),
			obj_type: z.enum(['doc', 'sheet', 'mindnote', 'bitable', 'file', 'docx', 'slides']).describe('文档类型，对于快捷方式，该字段是对应的实体的obj_type'),
			origin_node_token: z.string().describe('快捷方式对应的实体node_token，当节点为快捷方式时，该值不为空').optional(),
			parent_node_token: z.string().describe('父节点 token').optional(),
			title: z.string().describe('文档标题').optional(),
		}),
		response: z.looseObject({
			node: z.looseObject({
				creator: z.string().describe('节点创建者').optional(),
				has_child: z.boolean().describe('是否有子节点').optional(),
				node_create_time: z.string().describe('节点创建时间').optional(),
				node_creator: z.string().describe('节点创建者').optional(),
				node_token: z.string().describe('节点token').optional(),
				node_type: z.string().describe('节点类型').optional(),
				obj_create_time: z.string().describe('文档创建时间').optional(),
				obj_edit_time: z.string().describe('文档最近编辑时间').optional(),
				obj_token: z.string().describe('对应文档类型的token，可根据 obj_type 判断属于哪种文档类型').optional(),
				obj_type: z.string().describe('文档类型，对于快捷方式，该字段是对应的实体的obj_type').optional(),
				origin_node_token: z.string().describe('快捷方式对应的实体node_token，当节点为快捷方式时，该值不为空').optional(),
				origin_space_id: z.string().describe('快捷方式对应的实体所在的space id').optional(),
				owner: z.string().describe('节点所有者').optional(),
				parent_node_token: z.string().describe('父节点 token').optional(),
				space_id: z.string().describe('知识空间id;[获取方式](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-overview)').optional(),
				title: z.string().describe('文档标题').optional(),
			}).describe('节点').optional(),
		}),
	},
	'wiki.nodes.list': {
		pathParams: z.strictObject({
			space_id: z.union([z.string(), z.number().transform(String)]).describe('[知识空间id](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-overview)，如果查询**我的文档库**可替换为`my_library`'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			parent_node_token: z.string().describe('父节点token').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有数据').optional(),
			items: z.array(z.looseObject({
				creator: z.string().describe('节点创建者').optional(),
				has_child: z.boolean().describe('是否有子节点').optional(),
				node_create_time: z.string().describe('节点创建时间').optional(),
				node_creator: z.string().describe('节点创建者').optional(),
				node_token: z.string().describe('节点token').optional(),
				node_type: z.string().describe('节点类型').optional(),
				obj_create_time: z.string().describe('文档创建时间').optional(),
				obj_edit_time: z.string().describe('文档最近编辑时间').optional(),
				obj_token: z.string().describe('对应文档类型的token，可根据 obj_type 判断属于哪种文档类型').optional(),
				obj_type: z.string().describe('文档类型，对于快捷方式，该字段是对应的实体的obj_type').optional(),
				origin_node_token: z.string().describe('快捷方式对应的实体node_token，当节点为快捷方式时，该值不为空').optional(),
				origin_space_id: z.string().describe('快捷方式对应的实体所在的space id').optional(),
				owner: z.string().describe('节点所有者').optional(),
				parent_node_token: z.string().describe('父节点 token').optional(),
				space_id: z.string().describe('知识空间id;[获取方式](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-overview)').optional(),
				title: z.string().describe('文档标题').optional(),
			})).describe('数据列表').optional(),
			page_token: z.string().describe('分页Token').optional(),
		}),
	},
	'wiki.spaces.create': {
		body: z.looseObject({
			description: z.string().describe('知识空间描述').optional(),
			name: z.string().describe('知识空间名称').optional(),
			open_sharing: z.enum(['open', 'closed']).describe('表示知识空间的分享状态').optional(),
		}),
		response: z.looseObject({
			space: z.looseObject({
				description: z.string().describe('知识空间描述').optional(),
				name: z.string().describe('知识空间名称').optional(),
				open_sharing: z.string().describe('表示知识空间的分享状态').optional(),
				space_id: z.string().describe('知识空间id').optional(),
				space_type: z.string().describe('表示知识空间类型（团队空间 或 个人空间）').optional(),
				visibility: z.string().describe('表示知识空间可见性（公开空间 或 私有空间）').optional(),
			}).describe('知识空间').optional(),
		}),
	},
	'wiki.spaces.get': {
		pathParams: z.strictObject({
			space_id: z.union([z.string(), z.number().transform(String)]).describe('知识空间 ID'),
		}),
		query: z.looseObject({
			lang: z.enum(['zh', 'id', 'de', 'en', 'es', 'fr', 'it', 'pt', 'vi', 'ru', 'hi', 'th', 'ko', 'ja', 'zh-HK', 'zh-TW']).describe('当查询**我的文档库**时，指定返回的文档库名称展示语言').optional(),
		}),
		response: z.looseObject({
			space: z.looseObject({
				description: z.string().describe('知识空间描述').optional(),
				name: z.string().describe('知识空间名称').optional(),
				open_sharing: z.string().describe('表示知识空间的分享状态').optional(),
				space_id: z.string().describe('知识空间 ID').optional(),
				space_type: z.string().describe('表示知识空间类型').optional(),
				visibility: z.string().describe('表示知识空间可见性').optional(),
			}).describe('知识空间').optional(),
		}),
	},
	'wiki.spaces.get_node': {
		query: z.looseObject({
			obj_type: z.enum(['doc', 'docx', 'sheet', 'mindnote', 'bitable', 'file', 'slides', 'wiki']).describe('文档类型').optional(),
			token: z.string().describe('知识库节点或对应云文档的实际 token'),
		}),
		response: z.looseObject({
			node: z.looseObject({
				creator: z.string().describe('文档创建者').optional(),
				has_child: z.boolean().describe('是否有子节点').optional(),
				node_create_time: z.string().describe('节点创建时间').optional(),
				node_creator: z.string().describe('节点创建者').optional(),
				node_token: z.string().describe('知识库节点 token，如果 URL 链接中 token 前为 wiki，该 token 为知识库的节点 token').optional(),
				node_type: z.string().describe('节点类型').optional(),
				obj_create_time: z.string().describe('文档创建时间').optional(),
				obj_edit_time: z.string().describe('文档最近编辑时间').optional(),
				obj_token: z.string().describe('节点的实际云文档的 token，如果 URL 链接中 token 前为 docx、base、sheets 等非 wiki 类型，则说明该 token 是当前云文档的实际 token').optional(),
				obj_type: z.string().describe('文档类型，对于快捷方式，该字段是对应的实体的obj_type').optional(),
				origin_node_token: z.string().describe('快捷方式对应的实体node_token，当节点为快捷方式时，该值不为空').optional(),
				origin_space_id: z.string().describe('快捷方式对应的实体所在的space id').optional(),
				owner: z.string().describe('文档所有者').optional(),
				parent_node_token: z.string().describe('父节点 token').optional(),
				space_id: z.string().describe('知识空间 ID').optional(),
				title: z.string().describe('文档标题').optional(),
			}).describe('节点信息').optional(),
		}),
	},
	'wiki.spaces.list': {
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				description: z.string().describe('知识空间描述').optional(),
				name: z.string().describe('知识空间名称').optional(),
				open_sharing: z.string().describe('表示知识空间的分享状态').optional(),
				space_id: z.string().describe('知识空间 ID').optional(),
				space_type: z.string().describe('表示知识空间类型').optional(),
				visibility: z.string().describe('表示知识空间可见性').optional(),
			})).describe('数据列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
