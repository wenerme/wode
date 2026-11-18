// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiIm = {
	'im.chat.members.bots': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群ID'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				bot_id: z.string().describe('机器人的 open_id').optional(),
				bot_name: z.string().describe('机器人名称').optional(),
			})).describe('机器人列表').optional(),
		}),
	},
	'im.chat.members.create': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		query: z.looseObject({
			member_id_type: z.enum(['user_id', 'union_id', 'open_id', 'app_id']).describe('用户 ID 类型').optional(),
			succeed_type: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().pipe(z.union([z.literal(0), z.literal(1), z.literal(2)]))).describe('出现不可用ID后的处理方式 0/1/2').optional(),
		}),
		body: z.looseObject({
			id_list: z.array(z.unknown()).describe('成员 ID 列表').optional(),
		}),
		response: z.looseObject({
			invalid_id_list: z.array(z.unknown()).describe('无效成员列表').optional(),
			not_existed_id_list: z.array(z.unknown()).describe('ID 不存在的成员列表').optional(),
			pending_approval_id_list: z.array(z.unknown()).describe('等待群主或管理员审批的成员 ID 列表').optional(),
		}),
	},
	'im.chat.members.delete': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		query: z.looseObject({
			member_id_type: z.enum(['user_id', 'union_id', 'open_id', 'app_id']).describe('用户 ID 类型').optional(),
		}),
		body: z.looseObject({
			id_list: z.array(z.unknown()).describe('成员 ID 列表').optional(),
		}),
		response: z.looseObject({
			invalid_id_list: z.array(z.unknown()).describe('无效成员列表').optional(),
		}),
	},
	'im.chat.members.get': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		query: z.looseObject({
			check_security_conf: z.union([z.boolean(), z.stringbool()]).describe('是否检查安全配置').optional(),
			member_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('用户 ID 类型').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，用来限制一次请求所返回的数据条目数').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				member_id: z.string().describe('成员的用户ID，ID 值与查询参数中的 member_id_type 对应').optional(),
				member_id_type: z.string().describe('成员的用户 ID 类型，与查询参数中的 member_id_type 相同').optional(),
				name: z.string().describe('名字').optional(),
				tenant_key: z.string().describe('租户Key，为租户在飞书上的唯一标识，用来换取对应的tenant_access_token，也可以用作租户在应用中的唯一标识').optional(),
			})).describe('成员列表').optional(),
			member_total: z.number().int().describe('成员总数').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
			security_conf_limit: z.number().int().describe('安全配置支持的最大查询群成员数量').optional(),
			trigger_security_conf_limit: z.boolean().describe('是否触发了安全配置').optional(),
		}),
	},
	'im.chats.create': {
		query: z.looseObject({
			set_bot_manager: z.union([z.boolean(), z.stringbool()]).describe('如果在请求体的 ==owner_id== 字段指定了某个用户为群主，可以选择是否同时设置创建此群的机器人为管理员，此标志位用于标记是否设置创建群的机器人为管理员').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
			uuid: z.string().describe('由开发者生成的唯一字符串序列，用于创建群组请求去重').optional(),
		}),
		body: z.looseObject({
			avatar: z.string().describe('群头像对应的 Image Key').optional(),
			bot_id_list: z.array(z.unknown()).describe('创建群时邀请的群机器人，不填则不邀请机器人').optional(),
			chat_mode: z.string().describe('群模式').optional(),
			chat_tags: z.array(z.unknown()).describe('群标签').optional(),
			chat_type: z.string().describe('群类型').optional(),
			description: z.string().describe('群描述，建议不超过 100 字符').optional(),
			edit_permission: z.enum(['only_owner', 'all_members']).describe('谁可以编辑群信息').optional(),
			external: z.boolean().describe('是否是外部群').optional(),
			group_message_type: z.enum(['chat', 'thread']).describe('群消息形式').optional(),
			hide_member_count_setting: z.enum(['all_members', 'only_owner']).describe('隐藏群成员人数设置').optional(),
			i18n_names: z.looseObject({
				en_us: z.string().describe('英文名').optional(),
				ja_jp: z.string().describe('日文名').optional(),
				zh_cn: z.string().describe('中文名').optional(),
			}).describe('群国际化名称').optional(),
			join_message_visibility: z.string().describe('成员入群提示消息的可见性').optional(),
			labels: z.array(z.unknown()).describe('群标签').optional(),
			leave_message_visibility: z.string().describe('成员退群提示消息的可见性').optional(),
			membership_approval: z.string().describe('加群是否需要审批').optional(),
			name: z.string().describe('群名称').optional(),
			owner_id: z.string().describe('创建群时指定的群主，不填时指定建群的机器人为群主').optional(),
			pin_manage_setting: z.enum(['only_owner', 'all_members']).describe('谁可以管理置顶').optional(),
			restricted_mode_setting: z.looseObject({
				download_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许下载消息中图片、视频和文件').optional(),
				message_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许复制和转发消息').optional(),
				screenshot_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许截屏录屏').optional(),
				status: z.boolean().describe('保密模式是否开启').optional(),
			}).describe('保密模式设置').optional(),
			toolkit_ids: z.array(z.unknown()).describe('群快捷组件列表').optional(),
			urgent_setting: z.enum(['only_owner', 'all_members']).describe('谁可以加急').optional(),
			user_id_list: z.array(z.unknown()).describe('创建群时邀请的群成员，不填则不邀请成员').optional(),
			video_conference_setting: z.enum(['only_owner', 'all_members']).describe('谁可以发起视频会议').optional(),
		}),
		response: z.looseObject({
			add_member_permission: z.string().describe('谁可以邀请用户或机器人入群').optional(),
			at_all_permission: z.string().describe('谁可以 at 所有人').optional(),
			avatar: z.string().describe('群头像 URL').optional(),
			chat_id: z.string().describe('群 ID').optional(),
			chat_mode: z.string().describe('群模式').optional(),
			chat_tag: z.string().describe('群标签，如有多个，则按照下列顺序返回第一个').optional(),
			chat_type: z.string().describe('群类型').optional(),
			description: z.string().describe('群描述').optional(),
			edit_permission: z.string().describe('群编辑权限').optional(),
			external: z.boolean().describe('是否是外部群').optional(),
			group_message_type: z.string().describe('群消息形式').optional(),
			hide_member_count_setting: z.string().describe('隐藏群成员人数设置').optional(),
			i18n_names: z.looseObject({
				en_us: z.string().describe('英文名').optional(),
				ja_jp: z.string().describe('日文名').optional(),
				zh_cn: z.string().describe('中文名').optional(),
			}).describe('群国际化名称').optional(),
			join_message_visibility: z.string().describe('入群消息可见性').optional(),
			labels: z.array(z.unknown()).describe('群标签').optional(),
			leave_message_visibility: z.string().describe('出群消息可见性').optional(),
			membership_approval: z.string().describe('加群审批').optional(),
			moderation_permission: z.string().describe('发言权限').optional(),
			name: z.string().describe('群名称').optional(),
			owner_id: z.string().describe('群主 ID，ID 类型与查询参数中的 ==user_id_type== 对应').optional(),
			owner_id_type: z.string().describe('群主 ID 类型，与查询参数中的 ==user_id_type== 取值相同').optional(),
			pin_manage_setting: z.string().describe('谁可以管理置顶').optional(),
			restricted_mode_setting: z.looseObject({
				download_has_permission_setting: z.string().describe('允许下载消息中图片、视频和文件').optional(),
				message_has_permission_setting: z.string().describe('允许复制和转发消息').optional(),
				screenshot_has_permission_setting: z.string().describe('允许截屏录屏').optional(),
				status: z.boolean().describe('保密模式是否开启').optional(),
			}).describe('保密模式设置').optional(),
			share_card_permission: z.string().describe('群分享权限').optional(),
			tenant_key: z.string().describe('租户在飞书上的唯一标识，用来换取对应的 tenant_access_token，也可以用作租户在应用里面的唯一标识').optional(),
			toolkit_ids: z.array(z.unknown()).describe('群快捷组件列表').optional(),
			urgent_setting: z.string().describe('谁可以加急').optional(),
			video_conference_setting: z.string().describe('谁可以发起视频会议').optional(),
		}),
	},
	'im.chats.get': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			add_member_permission: z.string().describe('谁可以添加群成员，群成员包括用户或机器人').optional(),
			at_all_permission: z.string().describe('谁可以 at 所有人').optional(),
			avatar: z.string().describe('群头像 URL').optional(),
			bot_count: z.string().describe('群内机器人的数量').optional(),
			bot_manager_id_list: z.array(z.unknown()).describe('机器人管理员 ID 列表，ID 类型为应用的 App ID').optional(),
			chat_mode: z.string().describe('群模式').optional(),
			chat_status: z.string().describe('群状态').optional(),
			chat_tag: z.string().describe('群标签').optional(),
			chat_type: z.string().describe('群类型').optional(),
			description: z.string().describe('群描述').optional(),
			edit_permission: z.string().describe('谁可以编辑群').optional(),
			external: z.boolean().describe('是否是外部群').optional(),
			group_message_type: z.string().describe('群消息模式').optional(),
			hide_member_count_setting: z.string().describe('隐藏群成员人数设置').optional(),
			i18n_names: z.looseObject({
				en_us: z.string().describe('英文名').optional(),
				ja_jp: z.string().describe('日文名').optional(),
				zh_cn: z.string().describe('中文名').optional(),
			}).describe('群国际化名称').optional(),
			join_message_visibility: z.string().describe('入群提示消息的可见性').optional(),
			labels: z.array(z.unknown()).describe('群标签').optional(),
			leave_message_visibility: z.string().describe('出群提示消息的可见性').optional(),
			membership_approval: z.string().describe('加群是否需要审批').optional(),
			moderation_permission: z.string().describe('群发言权限').optional(),
			name: z.string().describe('群名称').optional(),
			owner_id: z.string().describe('群主的用户 ID，ID 类型与查询参数中的 user_id_type 对应').optional(),
			owner_id_type: z.string().describe('群主的用户 ID 类型，与查询参数中的 user_id_type 相同').optional(),
			pin_manage_setting: z.string().describe('谁可以管理置顶').optional(),
			restricted_mode_setting: z.looseObject({
				download_has_permission_setting: z.string().describe('允许下载消息中图片、视频和文件').optional(),
				message_has_permission_setting: z.string().describe('允许复制和转发消息').optional(),
				screenshot_has_permission_setting: z.string().describe('允许截屏录屏').optional(),
				status: z.boolean().describe('保密模式是否开启').optional(),
			}).describe('保密模式设置').optional(),
			share_card_permission: z.string().describe('是否允许分享群').optional(),
			tenant_key: z.string().describe('租户 Key，为租户在飞书上的唯一标识，用来换取对应的tenant_access_token，也可以用作租户在应用中的唯一标识').optional(),
			toolkit_ids: z.array(z.unknown()).describe('群快捷组件列表').optional(),
			urgent_setting: z.string().describe('谁可以加急').optional(),
			user_count: z.string().describe('群内用户的数量').optional(),
			user_manager_id_list: z.array(z.unknown()).describe('用户管理员 ID 列表，ID 类型与查询参数 user_id_type 一致').optional(),
			video_conference_setting: z.string().describe('谁可以发起视频会议').optional(),
		}),
	},
	'im.chats.link': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		body: z.looseObject({
			validity_period: z.enum(['week', 'year', 'permanently']).describe('群分享链接有效时长').optional(),
		}),
		response: z.looseObject({
			expire_time: z.string().describe('分享链接的过期时间，秒级时间戳').optional(),
			is_permanent: z.boolean().describe('分享链接是否永久有效').optional(),
			share_link: z.string().describe('群分享链接').optional(),
		}),
	},
	'im.chats.update': {
		pathParams: z.strictObject({
			chat_id: z.union([z.string(), z.number().transform(String)]).describe('群 ID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			add_member_permission: z.string().describe('谁可以添加群成员，群成员包括用户或机器人').optional(),
			at_all_permission: z.string().describe('谁可以 at 所有人').optional(),
			avatar: z.string().describe('群头像对应的 Image Key，可通过[上传图片](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/image/create)获取（注意：上传图…').optional(),
			chat_type: z.string().describe('群类型').optional(),
			description: z.string().describe('群描述，建议不超过 100 字符').optional(),
			edit_permission: z.string().describe('谁可以编辑群信息').optional(),
			group_message_type: z.enum(['chat', 'thread']).describe('群消息形式').optional(),
			hide_member_count_setting: z.enum(['all_members', 'only_owner']).describe('隐藏群成员人数设置').optional(),
			i18n_names: z.looseObject({
				en_us: z.string().describe('英文名').optional(),
				ja_jp: z.string().describe('日文名').optional(),
				zh_cn: z.string().describe('中文名').optional(),
			}).describe('群国际化名称').optional(),
			join_message_visibility: z.string().describe('成员入群提示消息的可见性').optional(),
			labels: z.array(z.unknown()).describe('群标签').optional(),
			leave_message_visibility: z.string().describe('成员退群提示消息的可见性').optional(),
			membership_approval: z.string().describe('加群是否需要审批').optional(),
			name: z.string().describe('群名称').optional(),
			owner_id: z.string().describe('新群主的用户 ID，不转让群主时无需填写').optional(),
			pin_manage_setting: z.enum(['only_owner', 'all_members']).describe('谁可以管理置顶').optional(),
			restricted_mode_setting: z.looseObject({
				download_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许下载消息中图片、视频和文件').optional(),
				message_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许复制和转发消息').optional(),
				screenshot_has_permission_setting: z.enum(['all_members', 'not_anyone']).describe('允许截屏录屏').optional(),
				status: z.boolean().describe('保密模式是否开启').optional(),
			}).describe('保密模式设置').optional(),
			share_card_permission: z.string().describe('是否允许分享群').optional(),
			toolkit_ids: z.array(z.unknown()).describe('群快捷组件列表').optional(),
			urgent_setting: z.enum(['only_owner', 'all_members']).describe('谁可以加急').optional(),
			video_conference_setting: z.enum(['only_owner', 'all_members']).describe('谁可以发起视频会议').optional(),
		}),
	},
	'im.feed.groups.batch_add_item': {
		pathParams: z.strictObject({
			feed_group_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID'),
		}),
		body: z.looseObject({
			items: z.array(z.looseObject({
				feed_id: z.string().describe('消息卡片ID').optional(),
				feed_type: z.string().describe('消息卡片类型').optional(),
			})).describe('标签项列表'),
		}),
		response: z.looseObject({
			failed_items: z.array(z.looseObject({
				error_code: z.number().int().describe('错误码').optional(),
				error_message: z.string().describe('错误信息').optional(),
				item: z.looseObject({
					feed_id: z.string().describe('消息卡片ID').optional(),
					feed_type: z.string().describe('消息卡片类型').optional(),
				}).describe('标签项').optional(),
			})).describe('处理失败的标签项列表').optional(),
		}),
	},
	'im.feed.groups.batch_query': {
		query: z.looseObject({
			user_id_type: z.string().optional(),
		}),
		body: z.looseObject({
			group_ids: z.array(z.unknown()).describe('标签ID列表'),
		}),
		response: z.looseObject({
			deleted_groups: z.array(z.looseObject({
				group_id: z.string().describe('标签 ID').optional(),
				name: z.string().describe('标签名').optional(),
				rules: z.looseObject({
					rules: z.array(z.unknown()).describe('规则列表').optional(),
				}).describe('标签规则').optional(),
				type: z.string().describe('标签类型').optional(),
			})).describe('已删除的标签数据列表').optional(),
			groups: z.array(z.looseObject({
				group_id: z.string().describe('标签 ID').optional(),
				name: z.string().describe('标签名').optional(),
				rules: z.looseObject({
					rules: z.array(z.unknown()).describe('规则列表').optional(),
				}).describe('标签规则').optional(),
				type: z.string().describe('标签类型').optional(),
			})).describe('标签数据列表').optional(),
		}),
	},
	'im.feed.groups.batch_remove_item': {
		pathParams: z.strictObject({
			feed_group_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID'),
		}),
		body: z.looseObject({
			items: z.array(z.looseObject({
				feed_id: z.string().describe('消息卡片ID').optional(),
				feed_type: z.string().describe('消息卡片类型').optional(),
			})).describe('标签项列表'),
		}),
		response: z.looseObject({
			failed_items: z.array(z.looseObject({
				error_code: z.number().int().describe('错误码').optional(),
				error_message: z.string().describe('错误信息').optional(),
				item: z.looseObject({
					feed_id: z.string().describe('消息卡片ID').optional(),
					feed_type: z.string().describe('消息卡片类型').optional(),
				}).describe('标签项').optional(),
			})).describe('处理失败的标签项列表').optional(),
		}),
	},
	'im.feed.groups.create': {
		query: z.looseObject({
			user_id_type: z.string().optional(),
		}),
		body: z.looseObject({
			feed_group_creator: z.looseObject({
				name: z.string().describe('标签名称'),
				rules: z.looseObject({
					rules: z.array(z.unknown()).describe('规则列表'),
				}).describe('标签规则').optional(),
				type: z.string(),
			}).describe('创建标签数据'),
		}),
		response: z.looseObject({
			group_id: z.string().describe('标签ID').optional(),
		}),
	},
	'im.feed.groups.delete': {
		pathParams: z.strictObject({
			feed_group_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID'),
		}),
	},
	'im.feed.groups.update': {
		pathParams: z.strictObject({
			feed_group_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().optional(),
		}),
		body: z.looseObject({
			feed_group_updater: z.looseObject({
				name: z.string().describe('标签名').optional(),
				rules: z.looseObject({
					rules: z.array(z.unknown()).describe('规则列表'),
				}).describe('标签规则列表').optional(),
				update_fields: z.array(z.unknown()).describe('更新字段列表').optional(),
			}).describe('标签更新数据'),
		}),
	},
	'im.images.create': {
		body: z.looseObject({
			image: z.unknown().describe('图片内容'),
			image_type: z.enum(['message', 'avatar']).describe('图片类型'),
		}),
		response: z.looseObject({
			image_key: z.string().describe('图片的 Key').optional(),
		}),
	},
	'im.messages.delete': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待撤回的消息 ID'),
		}),
	},
	'im.messages.forward': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待转发的消息 ID'),
		}),
		query: z.looseObject({
			receive_id_type: z.enum(['open_id', 'user_id', 'union_id', 'email', 'chat_id', 'thread_id']).describe('消息接收者 ID 类型'),
			uuid: z.string().describe('自定义设置的唯一字符串序列，用于在转发消息时请求去重').optional(),
		}),
		body: z.looseObject({
			receive_id: z.string().describe('消息接收者 ID，ID 类型与 `receive_id_type` 的值一致'),
		}),
		response: z.looseObject({
			body: z.looseObject({
				content: z.string().describe('消息内容，JSON 结构序列化后的字符串，不同消息类型（`msg_type`）对应不同内容').optional(),
			}).describe('通过 `body` 内的 `content` 参数，返回所发送的消息内容').optional(),
			chat_id: z.string().describe('消息所属的群 ID').optional(),
			create_time: z.string().describe('消息生成的时间戳').optional(),
			deleted: z.boolean().describe('消息是否被撤回').optional(),
			mentions: z.array(z.looseObject({
				id: z.string().describe('被 @ 的用户或者机器人的 open_id').optional(),
				id_type: z.string().describe('被 @ 的用户或机器人 ID 类型，目前仅支持 `open_id` ([什么是 Open ID](https://open.feishu.cn/document/home/user-identity-introduction/open-i…').optional(),
				key: z.string().describe('被 @ 的用户或机器人序号').optional(),
				name: z.string().describe('被 @ 的用户或机器人的姓名').optional(),
				tenant_key: z.string().describe('租户唯一标识').optional(),
			})).describe('发送的消息内，被 @ 的用户或机器人列表').optional(),
			message_app_link: z.string().describe('消息跳转链接').optional(),
			message_id: z.string().describe('消息 ID').optional(),
			msg_type: z.string().describe('消息类型').optional(),
			parent_id: z.string().describe('父消息 ID，仅在回复消息场景会有返回值').optional(),
			root_id: z.string().describe('根消息 ID，仅在回复消息场景会有返回值').optional(),
			sender: z.looseObject({
				id: z.string().describe('发送者的 ID').optional(),
				id_type: z.string().describe('发送者的 ID 类型').optional(),
				sender_name: z.string().describe('该字段标识发送者的名称').optional(),
				sender_type: z.string().describe('发送者类型').optional(),
				tenant_key: z.string().describe('租户唯一标识').optional(),
			}).describe('消息的发送者信息').optional(),
			thread_id: z.string().describe('消息所属的话题 ID（不返回说明该消息非话题消息），了解话题可参见[话题概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/t…').optional(),
			update_time: z.string().describe('消息更新的时间戳').optional(),
			updated: z.boolean().describe('消息是否被更新').optional(),
			upper_message_id: z.string().describe('合并转发消息中，上一层级的消息 ID，仅在合并转发场景会有返回值').optional(),
		}),
	},
	'im.messages.merge_forward': {
		query: z.looseObject({
			receive_id_type: z.enum(['open_id', 'user_id', 'union_id', 'email', 'chat_id', 'thread_id']).describe('消息接收者 ID 类型'),
			uuid: z.string().describe('自定义设置的唯一字符串序列，用于在合并转发消息时请求去重').optional(),
		}),
		body: z.looseObject({
			message_id_list: z.array(z.unknown()).describe('待转发的消息 ID 列表，列表内的消息必须来自同一个会话'),
			receive_id: z.string().describe('消息接收者 ID，ID 类型与 `receive_id_type` 的值一致'),
		}),
		response: z.looseObject({
			invalid_message_id_list: z.array(z.unknown()).describe('无效的消息 ID 列表，如不存在的消息、已被撤回的消息、当前操作者不可见的历史消息、接口不支持的消息类型等').optional(),
			message: z.looseObject({
				body: z.looseObject({
					content: z.string().describe('消息内容，JSON 结构序列化后的字符串，合并转发生成的新消息的消息内容为固定值==Merged and Forwarded Message==，其中的子消息可以使用[获取指定消息的内容](https://open.feishu.cn/d…').optional(),
				}).describe('通过 `body` 内的 `content` 参数，返回所发送的消息内容').optional(),
				chat_id: z.string().describe('消息所属的群 ID').optional(),
				create_time: z.string().describe('消息生成的时间戳').optional(),
				deleted: z.boolean().describe('消息是否被撤回').optional(),
				mentions: z.array(z.looseObject({
					id: z.string().describe('被 @ 的用户或者机器人的 open_id').optional(),
					id_type: z.string().describe('被 @ 的用户或机器人 ID 类型，目前仅支持 `open_id` ([什么是 Open ID](https://open.feishu.cn/document/home/user-identity-introduction/open-i…').optional(),
					key: z.string().describe('被 @ 的用户或机器人序号').optional(),
					name: z.string().describe('被 @ 的用户或机器人的姓名').optional(),
					tenant_key: z.string().describe('租户唯一标识').optional(),
				})).describe('发送的消息内，被 @ 的用户或机器人列表').optional(),
				message_app_link: z.string().describe('消息跳转链接').optional(),
				message_id: z.string().describe('消息 ID').optional(),
				msg_type: z.string().describe('消息类型，取值 merge_forward 表示合并转发消息').optional(),
				parent_id: z.string().describe('父消息 ID，仅在回复消息场景会有返回值').optional(),
				root_id: z.string().describe('根消息 ID，仅在回复消息场景会有返回值').optional(),
				sender: z.looseObject({
					id: z.string().describe('发送者的 ID').optional(),
					id_type: z.string().describe('发送者的 ID 类型').optional(),
					sender_name: z.string().describe('该字段标识发送者的名称').optional(),
					sender_type: z.string().describe('发送者类型').optional(),
					tenant_key: z.string().describe('租户唯一标识').optional(),
				}).describe('消息的发送者信息').optional(),
				thread_id: z.string().describe('消息所属的话题 ID（不返回说明该消息非话题消息），了解话题可参见[话题概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/t…').optional(),
				update_time: z.string().describe('消息更新的时间戳').optional(),
				updated: z.boolean().describe('消息是否被更新').optional(),
				upper_message_id: z.string().describe('合并转发消息中，上一层级的消息 ID').optional(),
			}).describe('合并转发生成的新消息').optional(),
		}),
	},
	'im.messages.read_users': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待查询的消息 ID'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，用于限制单次请求所返回的数据条目数').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型'),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				tenant_key: z.string().describe('租户唯一标识').optional(),
				timestamp: z.string().describe('已读消息的时间，毫秒级时间戳').optional(),
				user_id: z.string().describe('用户 ID，ID 类型与查询参数 user_id_type 取值一致').optional(),
				user_id_type: z.string().describe('用户id类型').optional(),
			})).describe('-').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'im.messages.urgent_app': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待加急的消息 ID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型'),
		}),
		body: z.looseObject({
			user_id_list: z.array(z.unknown()).describe('加急的目标用户 ID 列表'),
		}),
		response: z.looseObject({
			invalid_user_id_list: z.array(z.unknown()).describe('无效的用户 ID').optional(),
		}),
	},
	'im.messages.urgent_phone': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待加急的消息 ID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型'),
		}),
		body: z.looseObject({
			user_id_list: z.array(z.unknown()).describe('加急的目标用户 ID 列表'),
		}),
		response: z.looseObject({
			invalid_user_id_list: z.array(z.unknown()).describe('无效的用户 ID').optional(),
		}),
	},
	'im.messages.urgent_sms': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待加急的消息 ID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型'),
		}),
		body: z.looseObject({
			user_id_list: z.array(z.unknown()).describe('加急的目标用户 ID 列表'),
		}),
		response: z.looseObject({
			invalid_user_id_list: z.array(z.unknown()).describe('无效的用户 ID').optional(),
		}),
	},
	'im.pins.create': {
		body: z.looseObject({
			message_id: z.string().describe('待 Pin 的消息 ID'),
		}),
		response: z.looseObject({
			pin: z.looseObject({
				chat_id: z.string().describe('Pin 消息所在的群聊 ID').optional(),
				create_time: z.string().describe('Pin 的创建时间（毫秒级时间戳）').optional(),
				message_id: z.string().describe('Pin 的消息 ID').optional(),
				operator_id: z.string().describe('Pin 的操作人 ID').optional(),
				operator_id_type: z.string().describe('Pin 的操作人 ID 类型').optional(),
			}).describe('Pin 的操作信息').optional(),
		}),
	},
	'im.pins.delete': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待移除 Pin 的消息 ID'),
		}),
	},
	'im.pins.list': {
		query: z.looseObject({
			chat_id: z.string().describe('待获取 Pin 消息的群组 ID'),
			end_time: z.string().describe('获取 Pin 消息的结束时间，毫秒级时间戳').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，用于限制一次请求返回的数据条目数').optional(),
			page_token: z.string().describe('下一页分页的token').optional(),
			start_time: z.string().describe('获取 Pin 消息的起始时间，毫秒级时间戳').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				chat_id: z.string().describe('Pin 消息所在的群聊 ID').optional(),
				create_time: z.string().describe('Pin 的创建时间（毫秒级时间戳）').optional(),
				message_id: z.string().describe('Pin 的消息 ID').optional(),
				operator_id: z.string().describe('Pin 的操作人 ID').optional(),
				operator_id_type: z.string().describe('Pin 的操作人 ID 类型').optional(),
			})).describe('Pin 的操作信息').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'im.reactions.batch_query': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('用户 ID 类型，控制接口返回值中表情添加者的ID').optional(),
		}),
		body: z.looseObject({
			page_size_per_message: z.number().int().describe('每个消息最多返回多少个表情').optional(),
			queries: z.array(z.looseObject({
				message_id: z.string().describe('消息ID').optional(),
				page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			})).describe('要查询的消息'),
			reaction_type: z.string().describe('表情类型').optional(),
		}),
		response: z.looseObject({
			fail_msg_reaction_details: z.array(z.looseObject({
				fail_reason: z.string().describe('获取表情失败的原因').optional(),
				message_id: z.string().describe('消息id').optional(),
			})).describe('未成功获取的消息').optional(),
			success_msg_reaction_counts: z.array(z.looseObject({
				message_id: z.string().describe('消息ID').optional(),
				reaction_count: z.array(z.looseObject({
					count: z.string().describe('表情数量').optional(),
					reaction_type: z.string().describe('表情类型').optional(),
				})).describe('消息上不同表情的数量').optional(),
			})).describe('成功获取到的表情数量统计').optional(),
			success_msg_reaction_details: z.array(z.looseObject({
				has_more: z.boolean().describe('是否还有更多项').optional(),
				message_id: z.string().describe('消息id').optional(),
				message_reaction_items: z.array(z.looseObject({
					action_time: z.string().describe('表情添加时间').optional(),
					emoji_type: z.string().describe('表情类型').optional(),
					operator: z.record(z.string(), z.unknown()).describe('操作者信息').optional(),
					reaction_id: z.string().describe('表情ID').optional(),
				})).describe('表情实体').optional(),
				page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
			})).describe('成功获取到的表情列表').optional(),
		}),
	},
	'im.reactions.create': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待添加表情回复的消息 ID'),
		}),
		body: z.looseObject({
			reaction_type: z.looseObject({
				emoji_type: z.string().describe('emoji 类型'),
			}).describe('表情回复的资源类型'),
		}),
		response: z.looseObject({
			action_time: z.string().describe('添加消息表情回复的时间').optional(),
			operator: z.looseObject({
				operator_id: z.string().describe('操作人 ID，具体的取值与 `operator_type` 相关：').optional(),
				operator_type: z.string().describe('操作人身份').optional(),
			}).describe('添加消息表情回复的操作人').optional(),
			reaction_id: z.string().describe('表情回复 ID').optional(),
			reaction_type: z.looseObject({
				emoji_type: z.string().describe('emoji 类型').optional(),
			}).describe('表情类型').optional(),
		}),
	},
	'im.reactions.delete': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待删除表情回复的消息 ID'),
			reaction_id: z.union([z.string(), z.number().transform(String)]).describe('待删除的表情回复 ID，该 ID 获取方式：'),
		}),
		response: z.looseObject({
			action_time: z.string().describe('添加消息表情回复的时间').optional(),
			operator: z.looseObject({
				operator_id: z.string().describe('操作人 ID，具体的取值与 `operator_type` 相关：').optional(),
				operator_type: z.string().describe('操作人身份').optional(),
			}).describe('添加表情回复的操作人').optional(),
			reaction_id: z.string().describe('表情回复 ID').optional(),
			reaction_type: z.looseObject({
				emoji_type: z.string().describe('emoji 类型').optional(),
			}).describe('表情类型').optional(),
		}),
	},
	'im.reactions.list': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('待查询的消息ID'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，用于限制一次请求返回的数据条目数').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			reaction_type: z.string().describe('待查询的表情类型，支持的枚举值参考[表情文案说明](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-reaction/emojis…').optional(),
			user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('当操作人为用户时返回用户ID的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				action_time: z.string().describe('添加消息表情回复的时间').optional(),
				operator: z.looseObject({
					operator_id: z.string().describe('操作人 ID，具体的取值与 `operator_type` 相关：').optional(),
					operator_type: z.string().describe('操作人身份').optional(),
				}).describe('添加表情回复的操作人').optional(),
				reaction_id: z.string().describe('表情回复 ID').optional(),
				reaction_type: z.looseObject({
					emoji_type: z.string().describe('emoji 类型').optional(),
				}).describe('表情类型').optional(),
			})).describe('表情回复列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'im.threads.forward': {
		pathParams: z.strictObject({
			thread_id: z.union([z.string(), z.number().transform(String)]).describe('要转发的话题ID，获取方式参见[话题概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/thread-introduction…'),
		}),
		query: z.looseObject({
			receive_id_type: z.enum(['open_id', 'user_id', 'union_id', 'email', 'chat_id', 'thread_id']).describe('消息接收者 ID 类型'),
			uuid: z.string().describe('自定义设置的唯一字符串序列，用于在转发话题时请求去重').optional(),
		}),
		body: z.looseObject({
			receive_id: z.string().describe('消息接收者 ID，ID 类型与 `receive_id_type` 的值一致'),
		}),
		response: z.looseObject({
			body: z.looseObject({
				content: z.string().describe('消息内容，JSON 结构序列化后的字符串，转发话题生成的新消息的消息内容为固定值==Merged and Forwarded Message==，其中的子消息可以使用[获取指定消息的内容](https://open.feishu.cn/d…').optional(),
			}).describe('通过 `body` 内的 `content` 参数，返回所发送的消息内容').optional(),
			chat_id: z.string().describe('消息所属的群 ID').optional(),
			create_time: z.string().describe('消息生成的时间戳').optional(),
			deleted: z.boolean().describe('消息是否被撤回').optional(),
			mentions: z.array(z.looseObject({
				id: z.string().describe('被 @ 的用户或者机器人的 open_id').optional(),
				id_type: z.string().describe('被 @ 的用户或机器人 ID 类型，目前仅支持 `open_id` ([什么是 Open ID](https://open.feishu.cn/document/home/user-identity-introduction/open-i…').optional(),
				key: z.string().describe('被 @ 的用户或机器人序号').optional(),
				name: z.string().describe('被 @ 的用户或机器人的姓名').optional(),
				tenant_key: z.string().describe('租户唯一标识').optional(),
			})).describe('发送的消息内，被 @ 的用户或机器人列表').optional(),
			message_app_link: z.string().describe('消息跳转链接').optional(),
			message_id: z.string().describe('消息 ID').optional(),
			msg_type: z.string().describe('消息类型').optional(),
			parent_id: z.string().describe('父消息 ID，仅在回复消息场景会有返回值').optional(),
			root_id: z.string().describe('根消息 ID，仅在回复消息场景会有返回值').optional(),
			sender: z.looseObject({
				id: z.string().describe('发送者的 ID').optional(),
				id_type: z.string().describe('发送者的 ID 类型').optional(),
				sender_name: z.string().describe('该字段标识发送者的名称').optional(),
				sender_type: z.string().describe('发送者类型').optional(),
				tenant_key: z.string().describe('租户唯一标识').optional(),
			}).describe('消息的发送者信息').optional(),
			thread_id: z.string().describe('消息所属的话题 ID（不返回说明该消息非话题消息），了解话题可参见[话题概述](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/t…').optional(),
			update_time: z.string().describe('消息更新的时间戳').optional(),
			updated: z.boolean().describe('消息是否被更新').optional(),
			upper_message_id: z.string().describe('合并转发消息中，上一层级的消息 ID，仅在合并转发场景会有返回值').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
