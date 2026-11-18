// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiDrive = {
	'drive.file.comment.reply.reactions.update_reaction': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文件的唯一标识令牌，用于定位目标文件'),
		}),
		query: z.looseObject({
			file_type: z.string().describe('文件类型，用于区分不同类型的云文档，可选值需参考[开放平台文件类型枚举](https://open.feishu.cn/document/ukTMukTMukTM/uczNzUjL3czM14yN3MTN)'),
		}),
		body: z.looseObject({
			action: z.enum(['add', 'delete']).describe('操作类型'),
			reaction_type: z.string().describe('reaction 类型'),
			reply_id: z.string().describe('回复 ID'),
		}),
	},
	'drive.file.comment.replys.create': {
		pathParams: z.strictObject({
			comment_id: z.union([z.string(), z.number().transform(String)]).describe('评论ID'),
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'sheet', 'file', 'docx', 'slides', 'bitable']).describe('云文档类型'),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			content: z.looseObject({
				elements: z.array(z.looseObject({
					docs_link: z.record(z.string(), z.unknown()).describe('云文档链接').optional(),
					person: z.record(z.string(), z.unknown()).describe('联系人').optional(),
					text_run: z.record(z.string(), z.unknown()).describe('文本内容').optional(),
					type: z.enum(['text_run', 'docs_link', 'person']).describe('回复内容的元素类型'),
				})).describe('回复内容的元素列表'),
			}).describe('回复内容'),
		}),
		response: z.looseObject({
			content: z.looseObject({
				elements: z.array(z.looseObject({
					docs_link: z.record(z.string(), z.unknown()).describe('云文档链接').optional(),
					person: z.record(z.string(), z.unknown()).describe('联系人').optional(),
					text_run: z.record(z.string(), z.unknown()).describe('文本内容').optional(),
					type: z.string().describe('回复内容的元素类型').optional(),
				})).describe('回复内容的元素列表').optional(),
			}).describe('回复内容').optional(),
			create_time: z.number().int().describe('创建时间（单位：秒）').optional(),
			extra: z.looseObject({
				image_list: z.array(z.unknown()).describe('回复中的图片 Token list').optional(),
			}).optional(),
			reactions: z.array(z.looseObject({
				ahead_users: z.array(z.unknown()).describe('用于在界面优先展示核心互动用户').optional(),
				count: z.number().int().describe('该表情回复的累计使用次数，统计范围为当前评论下所有用户的有效回复记录').optional(),
				reaction_key: z.string().describe('表情回复的唯一标识，用于区分不同类型的评论表情（如点赞、鼓掌等）').optional(),
			})).describe('评论回复卡片上对应的表情回复信息').optional(),
			reply_id: z.string().describe('回复 ID').optional(),
			update_time: z.number().int().describe('更新时间（单位：秒）').optional(),
			user_id: z.string().describe('用户 ID').optional(),
		}),
	},
	'drive.file.comment.replys.delete': {
		pathParams: z.strictObject({
			comment_id: z.union([z.string(), z.number().transform(String)]).describe('评论 ID'),
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档 Token'),
			reply_id: z.union([z.string(), z.number().transform(String)]).describe('回复 ID'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
		}),
		response: z.looseObject({
			data: z.string().optional(),
		}),
	},
	'drive.file.comment.replys.list': {
		pathParams: z.strictObject({
			comment_id: z.union([z.string(), z.number().transform(String)]).describe('评论 ID'),
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档 Token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
			need_reaction: z.union([z.boolean(), z.stringbool()]).describe('是否需要获取评论卡片上挂载的Reaction数据，默认值为false').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，每页返回的数据量').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().optional(),
			items: z.array(z.looseObject({
				content: z.looseObject({
					elements: z.array(z.unknown()).describe('回复的内容').optional(),
				}).describe('回复内容').optional(),
				create_time: z.number().int().describe('创建时间').optional(),
				extra: z.looseObject({
					image_list: z.array(z.unknown()).describe('回复中的图片 Token list').optional(),
				}).describe('回复的其他内容，图片 Token 等').optional(),
				reactions: z.array(z.looseObject({
					ahead_users: z.array(z.unknown()).describe('用于在界面优先展示核心互动用户').optional(),
					count: z.number().int().describe('该表情回复的累计使用次数，统计范围为当前评论下所有用户的有效回复记录').optional(),
					reaction_key: z.string().describe('表情回复的唯一标识，用于区分不同类型的评论表情（如点赞、鼓掌等）').optional(),
				})).describe('评论回复卡片上对应的表情回复信息').optional(),
				reply_id: z.string().describe('回复 ID').optional(),
				update_time: z.number().int().describe('更新时间').optional(),
				user_id: z.string().describe('用户 ID').optional(),
			})).describe('回复列表').optional(),
			page_token: z.string().optional(),
		}),
	},
	'drive.file.comment.replys.update': {
		pathParams: z.strictObject({
			comment_id: z.union([z.string(), z.number().transform(String)]).describe('评论 ID'),
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档 Token'),
			reply_id: z.union([z.string(), z.number().transform(String)]).describe('回复 ID'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			content: z.looseObject({
				elements: z.array(z.looseObject({
					docs_link: z.record(z.string(), z.unknown()).describe('云文档链接').optional(),
					person: z.record(z.string(), z.unknown()).describe('添加用户的 user_id').optional(),
					text_run: z.record(z.string(), z.unknown()).describe('文本内容').optional(),
					type: z.enum(['text_run', 'docs_link', 'person']).describe('回复内容的元素类型'),
				})).describe('回复的内容'),
			}).describe('回复内容'),
		}),
		response: z.looseObject({
			data: z.string().optional(),
		}),
	},
	'drive.file.comments.batch_query': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档 Token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			comment_ids: z.array(z.unknown()).describe('需要获取数据的评论 ID ，可通过调用获取云文档所有评论接口获取 comment_id，允许的最大元素个数为100'),
			need_reaction: z.boolean().describe('是否需要获取评论卡片上挂载的Reaction数据，默认值为false').optional(),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				comment_id: z.string().describe('评论 ID').optional(),
				create_time: z.number().int().describe('创建时间').optional(),
				has_more: z.boolean().describe('是否有更多回复').optional(),
				is_solved: z.boolean().describe('是否已解决').optional(),
				is_whole: z.boolean().describe('是否是全文评论').optional(),
				page_token: z.string().describe('回复分页标记').optional(),
				quote: z.string().describe('局部评论的引用字段').optional(),
				reply_list: z.looseObject({
					replies: z.array(z.unknown()).describe('回复列表').optional(),
				}).describe('评论里的回复列表').optional(),
				solved_time: z.number().int().describe('解决评论时间').optional(),
				solver_user_id: z.string().describe('解决评论者的用户 ID').optional(),
				update_time: z.number().int().describe('更新时间').optional(),
				user_id: z.string().describe('用户 ID').optional(),
			})).describe('评论的相关信息、回复的信息、回复分页的信息').optional(),
		}),
	},
	'drive.file.comments.create_v2': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档 Token'),
		}),
		body: z.looseObject({
			anchor: z.looseObject({
				block_id: z.string().describe('文档块级元素的唯一标识,用于将评论锚定到指定的内容块'),
				parent_file_token: z.string().describe('父文件token，可选').optional(),
				parent_file_type: z.string().describe('父文件类型，可选').optional(),
				sheet_col: z.number().int().describe('sheet划线评论的列序号，可选').optional(),
				sheet_row: z.number().int().describe('sheet划线评论的行序号，可选').optional(),
				slide_block_type: z.string().describe('slide划线block元素类型').optional(),
			}).describe('评论锚点配置,用于指定评论在文档中的关联位置').optional(),
			file_type: z.string().describe('文档类型标识，用于区分不同类型的云文档'),
			reply_elements: z.array(z.looseObject({
				link: z.string().describe('跳转链接地址').optional(),
				mention_user: z.string().describe('被@用户的唯一标识').optional(),
				text: z.string().describe('评论元素的文本内容').optional(),
				type: z.string().describe('text | mention_user | link'),
			})).describe('评论内容元素集合，支持文本、@用户、链接等多种元素类型的组合，用于构建结构化的评论内容'),
		}),
		response: z.looseObject({
			comment_id: z.string().describe('新增评论的唯一标识，可用于后续的评论回复、删除等操作').optional(),
			created_at: z.string().describe('评论创建时间，采用ISO 8601格式，精确到毫秒').optional(),
			idempotency_key: z.string().describe('返回请求中传入的幂等键，用于关联请求与响应结果').optional(),
			reply_id: z.string().describe('回复 ID').optional(),
		}),
	},
	'drive.file.comments.list': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
			is_solved: z.union([z.boolean(), z.stringbool()]).describe('是否已解决（可选），默认值为false').optional(),
			is_whole: z.union([z.boolean(), z.stringbool()]).describe('是否全文评论，默认值为false').optional(),
			need_reaction: z.union([z.boolean(), z.stringbool()]).describe('是否需要获取评论卡片上挂载的Reaction数据，默认值为false').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，默认每页返回 50 个评论').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				comment_id: z.string().describe('评论 ID').optional(),
				create_time: z.number().int().describe('创建时间').optional(),
				has_more: z.boolean().describe('是否有更多回复').optional(),
				is_solved: z.boolean().describe('是否已解决').optional(),
				is_whole: z.boolean().describe('是否是全文评论').optional(),
				page_token: z.string().describe('回复分页标记').optional(),
				quote: z.string().describe('局部评论的引用字段').optional(),
				reply_list: z.looseObject({
					replies: z.array(z.unknown()).describe('回复列表').optional(),
				}).describe('评论里的回复列表').optional(),
				solved_time: z.number().int().describe('解决评论时间').optional(),
				solver_user_id: z.string().describe('解决评论者的用户 ID').optional(),
				update_time: z.number().int().describe('更新时间').optional(),
				user_id: z.string().describe('用户 ID').optional(),
			})).describe('评论列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'drive.file.comments.patch': {
		pathParams: z.strictObject({
			comment_id: z.union([z.string(), z.number().transform(String)]).describe('评论ID'),
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文档token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'file', 'slides', 'bitable']).describe('云文档类型'),
		}),
		body: z.looseObject({
			is_solved: z.boolean().describe('评论解决标志'),
		}),
		response: z.looseObject({
			data: z.string().optional(),
		}),
	},
	'drive.file.statistics.get': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文件 token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'sheet', 'mindnote', 'bitable', 'wiki', 'file', 'docx']).describe('文件类型'),
		}),
		response: z.looseObject({
			file_token: z.string().describe('文档 token').optional(),
			file_type: z.string().describe('文档类型').optional(),
			statistics: z.looseObject({
				like_count: z.number().int().describe('文档历史点赞总数').optional(),
				like_count_today: z.number().int().describe('今日新增文档点赞数').optional(),
				pv: z.number().int().describe('文档历史访问次数，同一用户（user_id）多次访问按多次计算，但同一用户在间隔在半小时内访问两次视为一次访问').optional(),
				pv_today: z.number().int().describe('今日新增文档访问次数').optional(),
				timestamp: z.number().int().describe('时间戳（单位：秒）').optional(),
				uv: z.number().int().describe('文档历史访问人数，同一用户（user_id）多次访问按一次计算').optional(),
				uv_today: z.number().int().describe('今日新增文档访问人数').optional(),
			}).describe('文档统计信息').optional(),
		}),
	},
	'drive.file.view_records.list': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('文件 token'),
		}),
		query: z.looseObject({
			file_type: z.enum(['doc', 'docx', 'sheet', 'bitable', 'mindnote', 'wiki', 'file']).describe('文件类型'),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小'),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			viewer_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('返回的访问者 ID 的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				avatar_url: z.string().describe('访问者头像的 URL').optional(),
				last_view_time: z.string().describe('最近访问时间').optional(),
				name: z.string().describe('访问者姓名').optional(),
				viewer_id: z.string().describe('访问者 ID').optional(),
			})).describe('访问记录列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'drive.files.copy': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('被复制的源文件的 token'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			extra: z.array(z.looseObject({
				key: z.string().describe('自定义属性键对象'),
				value: z.string().describe('自定义属性值对象'),
			})).describe('自定义请求附加参数，用于实现特殊的复制语义').optional(),
			folder_token: z.string().describe('目标文件夹的 token'),
			name: z.string().describe('复制的新文件的名称'),
			type: z.enum(['file', 'doc', 'sheet', 'bitable', 'docx', 'mindnote', 'slides']).describe('被复制的源文件的类型').optional(),
		}),
		response: z.looseObject({
			file: z.looseObject({
				created_time: z.string().describe('文件创建时间').optional(),
				modified_time: z.string().describe('文件最近修改时间').optional(),
				name: z.string().describe('文件名').optional(),
				owner_id: z.string().describe('文件所有者').optional(),
				parent_token: z.string().describe('父文件夹标识').optional(),
				shortcut_info: z.looseObject({
					target_token: z.string().describe('快捷方式指向的原文件 Token').optional(),
					target_type: z.string().describe('快捷方式指向的源文件类型').optional(),
				}).describe('快捷方式文件信息（该参数不会返回）').optional(),
				token: z.string().describe('文件标识符').optional(),
				type: z.string().describe('文件类型').optional(),
				url: z.string().describe('在浏览器中查看的链接').optional(),
			}).describe('复制的新文件信息').optional(),
		}),
	},
	'drive.files.create_folder': {
		body: z.looseObject({
			folder_token: z.string().describe('父文件夹的 token'),
			name: z.string().describe('文件夹名称'),
		}),
		response: z.looseObject({
			token: z.string().describe('新建的文件夹的 token').optional(),
			url: z.string().describe('新建的文件夹的 URL 链接').optional(),
		}),
	},
	'drive.files.list': {
		query: z.looseObject({
			direction: z.enum(['ASC', 'DESC']).describe('定义清单中文件的排序规则，与 order_by 配合使用').optional(),
			folder_token: z.string().describe('文件夹的 token').optional(),
			option: z.string().describe('指定获取文件清单的特殊方式').optional(),
			order_by: z.enum(['EditedTime', 'CreatedTime']).describe('定义清单中文件的排序方式').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('指定每页显示的数据项的数量，默认值为100').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			files: z.array(z.looseObject({
				created_time: z.string().describe('文件创建时间').optional(),
				modified_time: z.string().describe('文件最近修改时间').optional(),
				name: z.string().describe('文件名').optional(),
				owner_id: z.string().describe('文件所有者').optional(),
				parent_token: z.string().describe('父文件夹标识').optional(),
				shortcut_info: z.looseObject({
					target_token: z.string().describe('快捷方式指向的原文件 Token').optional(),
					target_type: z.string().describe('快捷方式指向的源文件类型').optional(),
				}).describe('快捷方式文件信息（该参数不会返回）').optional(),
				token: z.string().describe('文件标识符').optional(),
				type: z.string().describe('文件类型').optional(),
				url: z.string().describe('在浏览器中查看的链接').optional(),
			})).describe('文件夹中的文件清单列表').optional(),
			has_more: z.boolean().describe('是否还有更多项').optional(),
			next_page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回下一次遍历的 page_token，否则不返回').optional(),
		}),
	},
	'drive.files.patch': {
		pathParams: z.strictObject({
			file_token: z.union([z.string(), z.number().transform(String)]).describe('需要修改标题的文件token'),
		}),
		query: z.looseObject({
			type: z.enum(['doc', 'docx', 'sheet', 'bitable', 'file', 'folder', 'wiki', 'slides', 'mindnote']).describe('文件类型'),
		}),
		body: z.looseObject({
			new_title: z.string().describe('新标题').optional(),
		}),
	},
	'drive.metas.batch_query': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			request_docs: z.array(z.looseObject({
				doc_token: z.string().describe('文件的 token，获取方式见[文件概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/file-overview)'),
				doc_type: z.enum(['doc', 'sheet', 'bitable', 'mindnote', 'file', 'wiki', 'docx', 'folder', 'synced_block', 'slides']).describe('文件类型'),
			})).describe('请求的文件的 token 和类型'),
			with_url: z.boolean().describe('是否获取文件的访问链接，默认值为false').optional(),
		}),
		response: z.looseObject({
			failed_list: z.array(z.looseObject({
				code: z.number().int().describe('获取元数据失败的错误码').optional(),
				token: z.string().describe('获取元数据失败的文档token').optional(),
			})).describe('获取元数据失败的文档 token 列表').optional(),
			metas: z.array(z.looseObject({
				create_time: z.string().describe('创建时间').optional(),
				doc_token: z.string().describe('文件的 token').optional(),
				doc_type: z.string().describe('文件的类型').optional(),
				latest_modify_time: z.string().describe('最后编辑时间').optional(),
				latest_modify_user: z.string().describe('最后编辑者').optional(),
				owner_id: z.string().describe('文件的所有者').optional(),
				request_doc_info: z.looseObject({
					doc_token: z.string().describe('文件的 token，获取方式见[文件概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/file/file-overview)').optional(),
					doc_type: z.string().describe('文件类型').optional(),
				}).describe('用于回显入参(requst_doc_info中的字段信息即为为请求体中的request_docs字段信息)，如果入参中有相同token时无效').optional(),
				sec_label_name: z.string().describe('文档密级标签名称').optional(),
				title: z.string().describe('标题').optional(),
				url: z.string().describe('文档访问链接').optional(),
			})).describe('文件的元数据列表').optional(),
		}),
	},
	'drive.permission.members.auth': {
		pathParams: z.strictObject({
			token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token，需要与 type 参数指定的云文档类型相匹配'),
		}),
		query: z.looseObject({
			action: z.enum(['view', 'edit', 'share', 'comment', 'export', 'copy', 'print', 'manage_public']).describe('需要判断的权限'),
			type: z.enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides']).describe('云文档类型，需要与云文档的 token 相匹配'),
		}),
		response: z.looseObject({
			auth_result: z.boolean().describe('当前应用或用户是否有指定的权限').optional(),
		}),
	},
	'drive.permission.members.create': {
		pathParams: z.strictObject({
			token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token，需要与 type 参数指定的云文档类型相匹配'),
		}),
		query: z.looseObject({
			need_notification: z.union([z.boolean(), z.stringbool()]).describe('添加权限后是否通知对方').optional(),
			type: z.enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'folder', 'mindnote', 'minutes', 'slides']).describe('云文档类型，需要与云文档的 token 相匹配'),
		}),
		body: z.looseObject({
			member_id: z.string().describe('协作者 ID，该 ID 的类型与 member_type 指定的值需要保持一致').optional(),
			member_type: z.enum(['email', 'openid', 'unionid', 'openchat', 'opendepartmentid', 'userid', 'groupid', 'wikispaceid', 'appid']).describe('协作者 ID 类型，与协作者 ID 需要对应').optional(),
			perm: z.enum(['view', 'edit', 'full_access']).describe('协作者对应的权限角色').optional(),
			perm_type: z.enum(['container', 'single_page']).describe('协作者的权限角色类型').optional(),
			type: z.enum(['user', 'chat', 'department', 'group', 'wiki_space_member', 'wiki_space_viewer', 'wiki_space_editor']).describe('协作者类型').optional(),
		}),
		response: z.looseObject({
			member: z.looseObject({
				member_id: z.string().describe('协作者ID，与协作者ID类型需要对应').optional(),
				member_type: z.string().describe('协作者ID类型').optional(),
				perm: z.string().describe('协作者的权限角色').optional(),
				perm_type: z.string().describe('协作者的权限角色类型').optional(),
				type: z.string().describe('协作者类型').optional(),
			}).describe('本次添加权限的用户信息').optional(),
		}),
	},
	'drive.permission.members.transfer_owner': {
		pathParams: z.strictObject({
			token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token，需要与 type 参数指定的云文档类型相匹配'),
		}),
		query: z.looseObject({
			need_notification: z.union([z.boolean(), z.stringbool()]).describe('是否需要通知新的文件所有者').optional(),
			old_owner_perm: z.string().describe('为原云文档所有者保留的具体权限').optional(),
			remove_old_owner: z.union([z.boolean(), z.stringbool()]).describe('转移后是否需要移除原云文档所有者的权限').optional(),
			stay_put: z.union([z.boolean(), z.stringbool()]).describe('在个人文件夹下的云文档是否仍留在原所有者个人文件夹下').optional(),
			type: z.enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides', 'folder']).describe('云文档类型，需要与云文档的 token 相匹配'),
		}),
		body: z.looseObject({
			member_id: z.string().describe('文件所有者的 ID，与文件所有者的 ID 类型需要对应').optional(),
			member_type: z.enum(['email', 'openid', 'userid', 'appid']).describe('文件所有者的 ID 类型').optional(),
		}),
	},
	'drive.permission.public.get': {
		pathParams: z.strictObject({
			token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token，需要与 type 参数指定的云文档类型相匹配'),
		}),
		query: z.looseObject({
			type: z.enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides']).describe('云文档类型，需要与云文档的 token 相匹配'),
		}),
		response: z.looseObject({
			permission_public: z.looseObject({
				comment_entity: z.string().describe('谁可以评论').optional(),
				external_access: z.boolean().describe('是否允许内容被分享到组织外').optional(),
				invite_external: z.boolean().describe('允许非「可管理权限」的人分享到组织外（仅share_entity=“same_tenant”时有效）').optional(),
				link_share_entity: z.string().describe('链接分享设置').optional(),
				lock_switch: z.boolean().describe('节点是否已加锁').optional(),
				security_entity: z.string().describe('谁可以复制内容、创建副本、打印、下载').optional(),
				share_entity: z.string().describe('谁可以添加和管理协作者').optional(),
			}).describe('返回的文档公共访问和协作权限设置').optional(),
		}),
	},
	'drive.permission.public.patch': {
		pathParams: z.strictObject({
			token: z.union([z.string(), z.number().transform(String)]).describe('云文档的 token，需要与 type 参数指定的云文档类型相匹配'),
		}),
		query: z.looseObject({
			type: z.enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides']).describe('云文档类型，需要与云文档的 token 相匹配'),
		}),
		body: z.looseObject({
			comment_entity: z.enum(['anyone_can_view', 'anyone_can_edit']).describe('谁可以评论').optional(),
			external_access: z.boolean().describe('是否允许内容被分享到组织外').optional(),
			invite_external: z.boolean().describe('是否允许非「可管理权限」的人分享到组织外').optional(),
			link_share_entity: z.enum(['tenant_readable', 'tenant_editable', 'anyone_readable', 'anyone_editable', 'closed']).describe('链接分享设置').optional(),
			security_entity: z.enum(['anyone_can_view', 'anyone_can_edit', 'only_full_access']).describe('谁可以复制内容、创建副本、打印、下载').optional(),
			share_entity: z.enum(['anyone', 'same_tenant', 'only_full_access']).describe('谁可以查看、添加、移除协作者').optional(),
		}),
		response: z.looseObject({
			permission_public: z.looseObject({
				comment_entity: z.string().describe('谁可以评论').optional(),
				external_access: z.boolean().describe('是否允许内容被分享到组织外').optional(),
				invite_external: z.boolean().describe('允许非「可管理权限」的人分享到组织外（仅share_entity=“same_tenant”时有效）').optional(),
				link_share_entity: z.string().describe('链接分享设置').optional(),
				lock_switch: z.boolean().describe('节点是否已加锁').optional(),
				security_entity: z.string().describe('谁可以复制内容、创建副本、打印、下载').optional(),
				share_entity: z.string().describe('谁可以添加和管理协作者').optional(),
			}).describe('本次更新后的文档权限设置').optional(),
		}),
	},
	'drive.quota_details.get': {
		pathParams: z.strictObject({
			quota_detail_id: z.union([z.string(), z.number().transform(String)]).describe('传当前用户user_id，且只返回当前用户的容量信息'),
		}),
		response: z.looseObject({
			biz_infos: z.array(z.looseObject({
				name: z.string().describe('业务名称，ccm代表云文档容量，vc代表视频会议，mail代表邮箱，im代表聊天文件').optional(),
				quota: z.string().describe('额度，单位byte，最大可能为int64，需要自己转换为数字').optional(),
				unlimited: z.boolean().describe('是否没设置容量限制').optional(),
				used: z.string().describe('业务已经使用的容量，单位byte，最大可能为int64，需要自己转换为数字').optional(),
			})).describe('当前用户各业务的容量使用列表（ccm=云文档容量、im=聊天文件、vc=视频会议、mail=邮箱）').optional(),
			department_quota: z.looseObject({
				id: z.string().describe('配额归属实体ID，租户/用户/部门三选一，具体含义由所在字段区分（TenantQuota/UserQuota/DepartmentQuota）').optional(),
				limit: z.string().describe('配额上限，单位byte，最大可能为int64，需要自己转换为数字').optional(),
				type: z.number().int().describe('配额作用范围').optional(),
				usage: z.string().describe('已使用容量，单位byte，最大可能为int64，需要自己转换为数字').optional(),
			}).describe('用户/部门/租户的容量配额配置（上限与已使用量）').optional(),
			is_tenant_quota_exceeded: z.boolean().describe('租户额度是否超限').optional(),
			user_quota: z.looseObject({
				id: z.string().describe('配额归属实体ID，租户/用户/部门三选一，具体含义由所在字段区分（TenantQuota/UserQuota/DepartmentQuota）').optional(),
				limit: z.string().describe('配额上限，单位byte，最大可能为int64，需要自己转换为数字').optional(),
				type: z.number().int().describe('配额作用范围').optional(),
				usage: z.string().describe('已使用容量，单位byte，最大可能为int64，需要自己转换为数字').optional(),
			}).describe('用户/部门/租户的容量配额配置（上限与已使用量）').optional(),
		}),
	},
	'drive.user.remove_subscription': {
		query: z.looseObject({
			event_type: z.string().describe('事件类型'),
		}),
	},
	'drive.user.subscription': {
		body: z.looseObject({
			event_type: z.string().describe('事件类型'),
		}),
	},
	'drive.user.subscription_status': {
		query: z.looseObject({
			event_type: z.string().describe('事件类型'),
		}),
		response: z.looseObject({
			data: z.string().describe('订阅状态').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
