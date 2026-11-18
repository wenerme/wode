// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiMail = {
	'mail.multi_entity.search': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			query: z.string().describe('搜索关键词'),
			size: z.number().int().describe('获取的数据条数，**默认20，支持1-20**').optional(),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				chat_id: z.string().describe('群聊或会话 ID').optional(),
				department: z.string().describe('部门信息').optional(),
				display_name: z.string().describe('备注名').optional(),
				email: z.string().describe('邮箱地址').optional(),
				id: z.string().describe('唯一标识 ID').optional(),
				member_count: z.number().int().describe('群成员数量').optional(),
				name: z.string().describe('名称').optional(),
				tag: z.string().describe('标签').optional(),
				type: z.string().describe('标识当前的实体是哪种（例如：user, chat 等）').optional(),
				user_id: z.string().describe('用户 ID').optional(),
			})).describe('返回的实体详情').optional(),
		}),
	},
	'mail.user_mailbox.drafts.cancel_scheduled_send': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('已设置定时发送的邮件 ID'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
	},
	'mail.user_mailbox.drafts.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			raw: z.string().describe('base64url 编码的完整 RFC 5822（EML）邮件内容，包含所有邮件头（Subject、From、To、Cc、Bcc 等）和邮件正文（含内联图片和附件的 MIME 结构）').optional(),
		}),
		response: z.looseObject({
			draft: z.looseObject({
				id: z.string().describe('草稿ID').optional(),
				message: z.looseObject({
					attachments: z.array(z.unknown()).describe('邮件附件列表').optional(),
					bcc: z.array(z.unknown()).describe('密送').optional(),
					body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
					body_html: z.string().describe('正文(base64url)').optional(),
					body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
					body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
					cc: z.array(z.unknown()).describe('抄送').optional(),
					folder_id: z.string().describe('文件夹ID').optional(),
					head_from: z.record(z.string(), z.unknown()).describe('发件人').optional(),
					in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
					internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
					label_ids: z.array(z.unknown()).describe('标签ID').optional(),
					message_id: z.string().describe('邮件id').optional(),
					message_state: z.number().int().describe('邮件状态，1（收信）2（发信）3（草稿）').optional(),
					priority_type: z.string().describe('邮件优先级').optional(),
					raw: z.string().describe('MIME邮件数据，基于base64url编码').optional(),
					references: z.string().describe('References邮件头').optional(),
					reply_to: z.string().describe('Reply-To邮件头').optional(),
					security_level: z.record(z.string(), z.unknown()).describe('安全信息').optional(),
					smtp_message_id: z.string().describe('RFC协议id').optional(),
					subject: z.string().describe('主题').optional(),
					thread_id: z.string().describe('会话id').optional(),
					to: z.array(z.unknown()).describe('收件人').optional(),
				}).describe('草稿内容').optional(),
			}).describe('草稿内容').optional(),
			reference: z.string().describe('草稿预览链接').optional(),
		}),
	},
	'mail.user_mailbox.drafts.delete': {
		pathParams: z.strictObject({
			draft_id: z.union([z.string(), z.number().transform(String)]).describe('草稿ID，可通过列出草稿列表接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址不存在，请检查输入的用户邮箱地址是否正确，或确认用户的邮箱处于正常状态'),
		}),
	},
	'mail.user_mailbox.drafts.get': {
		pathParams: z.strictObject({
			draft_id: z.union([z.string(), z.number().transform(String)]).describe('草稿ID，可通过列出草稿列表接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用用户身份时可填写me'),
		}),
		query: z.looseObject({
			format: z.enum(['metadata', 'raw', 'full']).describe('需要获取的草稿内容样式，取值：metadata / full（默认）/ raw').optional(),
		}),
		response: z.looseObject({
			draft: z.looseObject({
				id: z.string().describe('草稿ID').optional(),
				message: z.looseObject({
					attachments: z.array(z.unknown()).describe('邮件附件列表').optional(),
					bcc: z.array(z.unknown()).describe('秘送').optional(),
					body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
					body_html: z.string().describe('正文(base64url)').optional(),
					body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
					body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
					cc: z.array(z.unknown()).describe('抄送').optional(),
					folder_id: z.string().describe('文件夹ID').optional(),
					head_from: z.record(z.string(), z.unknown()).describe('发件人').optional(),
					in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
					internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
					label_ids: z.array(z.unknown()).describe('标签ID').optional(),
					message_id: z.string().describe('邮件id').optional(),
					message_state: z.number().int().describe('邮件状态，1（收信）2（发信）3（草稿）').optional(),
					priority_type: z.string().describe('邮件优先级').optional(),
					references: z.string().describe('References邮件头').optional(),
					reply_to: z.string().describe('Reply-To邮件头').optional(),
					security_level: z.record(z.string(), z.unknown()).describe('安全信息').optional(),
					smtp_message_id: z.string().describe('RFC协议id').optional(),
					subject: z.string().describe('主题').optional(),
					thread_id: z.string().describe('会话id').optional(),
					to: z.array(z.unknown()).describe('收件人').optional(),
				}).describe('草稿内容').optional(),
			}).describe('草稿内容').optional(),
		}),
	},
	'mail.user_mailbox.drafts.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				id: z.string().describe('草稿ID').optional(),
			})).describe('草稿列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'mail.user_mailbox.drafts.send': {
		pathParams: z.strictObject({
			draft_id: z.union([z.string(), z.number().transform(String)]).describe('草稿ID，可通过创建草稿、更新草稿或列出草稿列表接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			send_time: z.string().describe('定时发送的 Unix 时间戳（秒）').optional(),
		}),
		response: z.looseObject({
			automation_send_disable: z.looseObject({
				reason: z.string().describe('自动化发信被禁用的原因说明').optional(),
				reference: z.string().describe('用户可参考reference内容解决').optional(),
			}).describe('当用户禁用自动化发信时返回此字段').optional(),
			message_id: z.string().describe('发送后生成的已发送邮件ID').optional(),
			recall_status: z.string().describe('仅允许撤回时返回该字段，值为available').optional(),
			thread_id: z.string().describe('邮件所属会话ID').optional(),
		}),
	},
	'mail.user_mailbox.drafts.update': {
		pathParams: z.strictObject({
			draft_id: z.union([z.string(), z.number().transform(String)]).describe('草稿ID，可通过创建草稿或列出草稿接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			raw: z.string().describe('base64url 编码的完整 RFC 5822（EML）邮件内容，包含所有邮件头（Subject、From、To、Cc、Bcc 等）和邮件正文（含内联图片和附件的 MIME 结构），将整体替换草稿原有内容'),
		}),
		response: z.looseObject({
			draft: z.looseObject({
				id: z.string().describe('草稿ID').optional(),
				message: z.looseObject({
					attachments: z.array(z.unknown()).describe('邮件附件列表').optional(),
					bcc: z.array(z.unknown()).describe('密送').optional(),
					body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
					body_html: z.string().describe('正文(base64url)').optional(),
					body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
					body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
					cc: z.array(z.unknown()).describe('抄送').optional(),
					folder_id: z.string().describe('文件夹ID').optional(),
					head_from: z.record(z.string(), z.unknown()).describe('发件人').optional(),
					in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
					internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
					label_ids: z.array(z.unknown()).describe('标签ID').optional(),
					message_id: z.string().describe('邮件id').optional(),
					message_state: z.number().int().describe('邮件状态，1（收信）2（发信）3（草稿）').optional(),
					priority_type: z.string().describe('邮件优先级').optional(),
					raw: z.string().describe('MIME邮件数据，基于base64url编码').optional(),
					references: z.string().describe('References邮件头').optional(),
					reply_to: z.string().describe('Reply-To邮件头').optional(),
					security_level: z.record(z.string(), z.unknown()).describe('安全信息').optional(),
					smtp_message_id: z.string().describe('RFC协议id').optional(),
					subject: z.string().describe('主题').optional(),
					thread_id: z.string().describe('会话id').optional(),
					to: z.array(z.unknown()).describe('收件人').optional(),
				}).describe('草稿内容').optional(),
			}).describe('更新后的草稿内容').optional(),
			reference: z.string().describe('草稿预览链接').optional(),
		}),
	},
	'mail.user_mailbox.event.subscribe': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		body: z.looseObject({
			event_type: z.literal(1).describe('事件类型'),
		}),
	},
	'mail.user_mailbox.event.subscription': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		response: z.looseObject({
			event_types: z.array(z.unknown()).describe('订阅的事件列表').optional(),
		}),
	},
	'mail.user_mailbox.event.unsubscribe': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		body: z.looseObject({
			event_type: z.literal(1).describe('事件类型'),
		}),
	},
	'mail.user_mailbox.folders.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			name: z.string().describe('文件夹名称'),
			parent_folder_id: z.string().describe('父文件夹 id，该值为 0 表示根文件夹，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_ma…'),
		}),
		response: z.looseObject({
			folder: z.looseObject({
				folder_type: z.number().int().describe('文件夹类型').optional(),
				id: z.string().describe('folder id').optional(),
				name: z.string().describe('文件夹名称').optional(),
				parent_folder_id: z.string().describe('父文件夹 id，该值为 0 表示根文件夹，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_ma…').optional(),
				unread_message_count: z.number().int().describe('未读邮件数量').optional(),
				unread_thread_count: z.number().int().describe('未读会话数量').optional(),
			}).describe('文件夹实体').optional(),
		}),
	},
	'mail.user_mailbox.folders.delete': {
		pathParams: z.strictObject({
			folder_id: z.union([z.string(), z.number().transform(String)]).describe('文件夹 id，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-folder/l…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
	},
	'mail.user_mailbox.folders.get': {
		pathParams: z.strictObject({
			folder_id: z.union([z.string(), z.number().transform(String)]).describe('邮件文件夹唯一标识'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			folder: z.looseObject({
				folder_type: z.number().int().describe('文件夹类型').optional(),
				id: z.string().describe('folder id').optional(),
				name: z.string().describe('文件夹名称').optional(),
				parent_folder_id: z.string().describe('父文件夹 id，该值为 0 表示根文件夹，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_ma…').optional(),
				unread_message_count: z.number().int().describe('未读邮件数量').optional(),
				unread_thread_count: z.number().int().describe('未读会话数量').optional(),
			}).describe('邮件文件夹的完整信息，包含文件夹ID、名称、归属层级、类型及未读统计数据').optional(),
		}),
	},
	'mail.user_mailbox.folders.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			folder_type: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().pipe(z.union([z.literal(1), z.literal(2)]))).describe('文件夹类型').optional(),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				folder_type: z.number().int().describe('文件夹类型').optional(),
				id: z.string().describe('folder id').optional(),
				name: z.string().describe('文件夹名称').optional(),
				parent_folder_id: z.string().describe('父文件夹 id，该值为 0 表示根文件夹，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_ma…').optional(),
				unread_message_count: z.number().int().describe('未读邮件数量').optional(),
				unread_thread_count: z.number().int().describe('未读会话数量').optional(),
			})).describe('文件夹列表').optional(),
		}),
	},
	'mail.user_mailbox.folders.patch': {
		pathParams: z.strictObject({
			folder_id: z.union([z.string(), z.number().transform(String)]).describe('文件夹 id，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-folder/l…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			name: z.string().describe('文件夹名字').optional(),
			parent_folder_id: z.string().describe('父文件夹 id，该值为 0 表示根文件夹，id 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_ma…').optional(),
		}),
	},
	'mail.user_mailbox.labels.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			label: z.looseObject({
				background_color: z.string().describe('标签背景颜色，支持以下颜色值：blue、indigo、purple、violet、carmine、red、orange、yellow、lime、green、turquoise、wathet').optional(),
				name: z.string().describe('标签名称，必须填写'),
			}).describe('邮件标签，必须填写标签名称，可选填写背景颜色'),
		}),
		response: z.looseObject({
			label: z.looseObject({
				background_color: z.string().describe('标签背景颜色，可选填写').optional(),
				id: z.string().describe('标签ID').optional(),
				messages_unread: z.number().int().describe('带有该标签的未读邮件数量').optional(),
				name: z.string().describe('标签名称，可选填写').optional(),
			}).describe('邮件标签，必须填写名字或颜色中的至少一个字段').optional(),
		}),
	},
	'mail.user_mailbox.labels.delete': {
		pathParams: z.strictObject({
			label_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID，创建标签成功后返回的标签ID，或可通过列出标签、获取邮件详情等接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，当使用user_access_token访问时，可以填写me'),
		}),
	},
	'mail.user_mailbox.labels.get': {
		pathParams: z.strictObject({
			label_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID，创建标签成功后返回的标签ID，或可通过列出标签、获取邮件详情等接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			label: z.looseObject({
				background_color: z.string().describe('标签背景颜色，可选填写').optional(),
				id: z.string().describe('标签ID').optional(),
				messages_unread: z.number().int().describe('带有该标签的未读邮件数量').optional(),
				name: z.string().describe('标签名称，可选填写').optional(),
			}).describe('邮件标签，必须填写名字或颜色中的至少一个字段').optional(),
		}),
	},
	'mail.user_mailbox.labels.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				background_color: z.string().describe('标签背景颜色，可选填写').optional(),
				id: z.string().describe('标签ID').optional(),
				messages_unread: z.number().int().describe('带有该标签的未读邮件数量').optional(),
				name: z.string().describe('标签名称，可选填写').optional(),
			})).describe('标签列表').optional(),
		}),
	},
	'mail.user_mailbox.labels.patch': {
		pathParams: z.strictObject({
			label_id: z.union([z.string(), z.number().transform(String)]).describe('标签ID，创建标签成功后返回的标签ID，或可通过列出标签、获取邮件详情等接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			label: z.looseObject({
				background_color: z.string().describe('标签背景颜色，可选填写').optional(),
				name: z.string().describe('标签名称，可选填写').optional(),
			}).describe('邮件标签，必须填写名字或颜色中的至少一个字段'),
		}),
		response: z.looseObject({
			label: z.looseObject({
				background_color: z.string().describe('标签背景颜色，可选填写').optional(),
				id: z.string().describe('标签ID').optional(),
				messages_unread: z.number().int().describe('带有该标签的未读邮件数量').optional(),
				name: z.string().describe('标签名称，可选填写').optional(),
			}).describe('邮件标签，必须填写名字或颜色中的至少一个字段').optional(),
		}),
	},
	'mail.user_mailbox.mail_contacts.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		body: z.looseObject({
			company: z.string().describe('联系人公司').optional(),
			mail_address: z.string().describe('联系人邮箱').optional(),
			name: z.string().describe('联系人姓名'),
			phone: z.string().describe('联系人手机号').optional(),
			position: z.string().describe('联系人职位').optional(),
			remark: z.string().describe('联系人备注').optional(),
			tag: z.string().describe('联系人标签').optional(),
		}),
		response: z.looseObject({
			mail_contact: z.looseObject({
				avatar: z.string().describe('联系人头像').optional(),
				company: z.string().describe('联系人公司').optional(),
				id: z.string().describe('联系人 id').optional(),
				mail_address: z.string().describe('联系人邮箱').optional(),
				name: z.string().describe('联系人姓名').optional(),
				phone: z.string().describe('联系人手机号').optional(),
				position: z.string().describe('联系人职位').optional(),
				remark: z.string().describe('联系人备注').optional(),
				tag: z.string().describe('联系人标签').optional(),
			}).optional(),
		}),
	},
	'mail.user_mailbox.mail_contacts.delete': {
		pathParams: z.strictObject({
			mail_contact_id: z.union([z.string(), z.number().transform(String)]).describe('邮箱联系人 id，获取方式见 [列出邮箱联系人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-mail_cont…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
	},
	'mail.user_mailbox.mail_contacts.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小'),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				avatar: z.string().describe('联系人头像').optional(),
				company: z.string().describe('联系人公司').optional(),
				id: z.string().describe('联系人 id').optional(),
				mail_address: z.string().describe('联系人邮箱').optional(),
				name: z.string().describe('联系人姓名').optional(),
				phone: z.string().describe('联系人手机号').optional(),
				position: z.string().describe('联系人职位').optional(),
				remark: z.string().describe('联系人备注').optional(),
				tag: z.string().describe('联系人标签').optional(),
			})).describe('邮件联系人列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'mail.user_mailbox.mail_contacts.patch': {
		pathParams: z.strictObject({
			mail_contact_id: z.union([z.string(), z.number().transform(String)]).describe('邮箱联系人 id，获取方式见 [列出邮箱联系人](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-mail_cont…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		body: z.looseObject({
			company: z.string().describe('联系人公司').optional(),
			mail_address: z.string().describe('联系人邮箱').optional(),
			name: z.string().describe('联系人姓名'),
			phone: z.string().describe('联系人手机号').optional(),
			position: z.string().describe('联系人职位').optional(),
			remark: z.string().describe('联系人备注').optional(),
			tag: z.string().describe('联系人标签').optional(),
		}),
	},
	'mail.user_mailbox.message.attachments.download_url': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮件 id，获取方式见 [列出邮件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message/list)'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		query: z.looseObject({
			attachment_ids: z.preprocess((value) => (typeof value === 'string' ? [value] : value), z.array(z.string())).describe('附件 id 列表'),
		}),
		response: z.looseObject({
			download_urls: z.array(z.looseObject({
				attachment_id: z.string().describe('附件 id').optional(),
				download_url: z.string().describe('下载链接').optional(),
			})).describe('下载链接列表').optional(),
			failed_ids: z.array(z.unknown()).describe('获取失败的附件 id 列表').optional(),
			failed_reasons: z.array(z.looseObject({
				attachment_id: z.string().describe('附件 ID').optional(),
				reason: z.string().describe('失败原因').optional(),
			})).describe('附件下载链接获取失败原因').optional(),
		}),
	},
	'mail.user_mailbox.messages.batch_get': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			format: z.enum(['full', 'plain_text_full', 'metadata']).describe('需要获取的邮件内容').optional(),
			message_ids: z.array(z.unknown()).describe('需要的邮件ID，可以通过列出邮件列表、收信事件通知等方式获得').optional(),
		}),
		response: z.looseObject({
			messages: z.array(z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					body: z.string().describe('附件的正文，使用 base64url 编码（支持的文件最大 37MB）').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('邮件附件列表').optional(),
				bcc: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('密送').optional(),
				body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
				body_html: z.string().describe('正文(base64url)').optional(),
				body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
				body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
				cc: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('抄送').optional(),
				folder_id: z.string().describe('文件夹ID').optional(),
				head_from: z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				}).describe('发件人').optional(),
				in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
				internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
				label_ids: z.array(z.unknown()).describe('标签ID').optional(),
				message_id: z.string().describe('邮件id').optional(),
				message_state: z.number().int().describe('邮件状态，1为收信，2为发信，3为草稿').optional(),
				priority_type: z.string().describe('邮件优先级').optional(),
				raw: z.string().describe('MIME邮件数据，基于base64url编码').optional(),
				references: z.string().describe('References邮件头').optional(),
				reply_to: z.string().describe('Reply-To邮件头').optional(),
				security_level: z.looseObject({
					is_header_from_external: z.boolean().describe('发件人是否外部邮件').optional(),
					is_risk: z.boolean().describe('是否风险邮件').optional(),
					risk_banner_level: z.string().describe('风险邮件等级').optional(),
					risk_banner_reason: z.string().describe('风险邮件原因').optional(),
					spam_banner_info: z.string().describe('命中用户黑名单的地址或域名信息').optional(),
					spam_banner_type: z.string().describe('垃圾邮件原因').optional(),
					spam_user_rule_id: z.string().describe('命中的收信规则ID').optional(),
					via_domain: z.string().describe('代发或伪造邮件展示SPF或DKIM域名').optional(),
				}).describe('安全信息').optional(),
				smtp_message_id: z.string().describe('RFC协议id').optional(),
				subject: z.string().describe('主题').optional(),
				thread_id: z.string().describe('会话id').optional(),
				to: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('收件人').optional(),
			})).describe('返回邮件内容').optional(),
		}),
	},
	'mail.user_mailbox.messages.batch_modify': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			add_folder: z.string().describe('需要移入的文件夹').optional(),
			add_label_ids: z.array(z.unknown()).describe('待添加的标签').optional(),
			message_ids: z.array(z.unknown()).describe('需要修改的邮件ID，可通过列出邮件接口、收信事件通知等方式获得').optional(),
			remove_label_ids: z.array(z.unknown()).describe('待移除的标签').optional(),
		}),
	},
	'mail.user_mailbox.messages.batch_trash': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			message_ids: z.array(z.unknown()).describe('邮件ID，可通过列出邮件接口、收信事件通知等方式获得').optional(),
		}),
	},
	'mail.user_mailbox.messages.get': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮件 id，获取方式见 [列出邮件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-message/list)'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		query: z.looseObject({
			format: z.enum(['full', 'plain_text_full', 'metadata']).describe('需要获取的邮件内容').optional(),
		}),
		response: z.looseObject({
			message: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('邮件附件列表').optional(),
				bcc: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('密送').optional(),
				body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
				body_html: z.string().describe('正文(base64url)').optional(),
				body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
				body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
				cc: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('抄送').optional(),
				folder_id: z.string().describe('文件夹ID').optional(),
				head_from: z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				}).describe('发件人').optional(),
				in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
				internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
				label_ids: z.array(z.unknown()).describe('标签ID').optional(),
				message_id: z.string().describe('邮件id').optional(),
				message_state: z.number().int().describe('邮件状态，1为收信，2为发信，3为草稿').optional(),
				priority_type: z.string().describe('邮件优先级').optional(),
				references: z.string().describe('References邮件头').optional(),
				reply_to: z.string().describe('Reply-To邮件头').optional(),
				security_level: z.looseObject({
					is_header_from_external: z.boolean().describe('发件人是否外部邮件').optional(),
					is_risk: z.boolean().describe('是否风险邮件').optional(),
					risk_banner_level: z.string().describe('风险邮件等级').optional(),
					risk_banner_reason: z.string().describe('风险邮件原因').optional(),
					spam_banner_info: z.string().describe('命中用户黑名单的地址或域名信息').optional(),
					spam_banner_type: z.string().describe('垃圾邮件原因').optional(),
					spam_user_rule_id: z.string().describe('命中的收信规则ID').optional(),
					via_domain: z.string().describe('代发或伪造邮件展示SPF或DKIM域名').optional(),
				}).describe('安全信息').optional(),
				smtp_message_id: z.string().describe('RFC协议id').optional(),
				subject: z.string().describe('主题').optional(),
				thread_id: z.string().describe('会话id').optional(),
				to: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('收件人').optional(),
			}).describe('邮件体').optional(),
		}),
	},
	'mail.user_mailbox.messages.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			folder_id: z.string().describe('文件夹 id， 获取方式见 [列出邮箱文件夹](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-folder/lis…').optional(),
			label_id: z.string().describe('标签id，支持IMPORTANT、OTHER、FLAGGED、SCHEDULED以及自定义文件夹标签').optional(),
			only_unread: z.union([z.boolean(), z.stringbool()]).describe('是否只查询未读邮件').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小'),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.unknown()).describe('邮件 id 列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'mail.user_mailbox.messages.modify': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('邮件ID，可通过列出邮件接口、收信事件通知等方式获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			add_folder: z.string().describe('需要移入的文件夹').optional(),
			add_label_ids: z.array(z.unknown()).describe('待添加的标签').optional(),
			remove_label_ids: z.array(z.unknown()).describe('待移除的标签').optional(),
		}),
	},
	'mail.user_mailbox.messages.send_status': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('邮件的业务标识ID（message_biz_id）'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，在用户身份访问时可以直接填写me'),
		}),
		response: z.looseObject({
			details: z.array(z.looseObject({
				last_updated_time: z.number().int().describe('最后更新时间（Unix 时间戳，秒）').optional(),
				recipient: z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				}).describe('收件人信息').optional(),
				status: z.number().int().describe('投递状态').optional(),
			})).describe('收件人投递状态列表').optional(),
			message_id: z.string().describe('邮件业务标识ID').optional(),
		}),
	},
	'mail.user_mailbox.messages.trash': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('邮件ID，可通过列出邮件接口获得'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
	},
	'mail.user_mailbox.rules.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		body: z.looseObject({
			action: z.looseObject({
				items: z.array(z.looseObject({
					input: z.string().describe('当 type 为移动到文件夹时，该字段填文件夹的 id').optional(),
					type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(8), z.literal(9), z.literal(10), z.literal(11), z.literal(12), z.literal(13)]).describe('操作类型'),
				})).describe('匹配命中规则后的操作列表'),
			}).describe('匹配命中后的操作'),
			condition: z.looseObject({
				items: z.array(z.looseObject({
					input: z.string().describe('匹配条件右值').optional(),
					operator: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(10)]).describe('匹配条件操作符').optional(),
					type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10), z.literal(12), z.literal(13), z.literal(14), z.literal(15), z.literal(16)]).describe('匹配条件左值'),
				})).describe('匹配规则列表'),
				match_type: z.union([z.literal(1), z.literal(2)]).describe('匹配类型'),
			}).describe('匹配条件'),
			ignore_the_rest_of_rules: z.boolean().describe('是否终止规则'),
			is_enable: z.boolean().describe('是否启用'),
			name: z.string().describe('规则名称'),
		}),
		response: z.looseObject({
			rule: z.looseObject({
				action: z.looseObject({
					items: z.array(z.unknown()).describe('匹配命中规则后的操作列表').optional(),
				}).describe('匹配命中后的操作').optional(),
				condition: z.looseObject({
					items: z.array(z.unknown()).describe('匹配规则列表').optional(),
					match_type: z.number().int().describe('匹配类型').optional(),
				}).describe('匹配条件').optional(),
				id: z.string().describe('规则 id').optional(),
				ignore_the_rest_of_rules: z.boolean().describe('是否终止规则').optional(),
				is_enable: z.boolean().describe('是否启用').optional(),
				name: z.string().describe('规则名称').optional(),
			}).optional(),
		}),
	},
	'mail.user_mailbox.rules.delete': {
		pathParams: z.strictObject({
			rule_id: z.union([z.string(), z.number().transform(String)]).describe('规则 id，获取方式见 [列出收信规则](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-rule/list)'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
	},
	'mail.user_mailbox.rules.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				action: z.looseObject({
					items: z.array(z.unknown()).describe('匹配命中规则后的操作列表').optional(),
				}).describe('匹配命中后的操作').optional(),
				condition: z.looseObject({
					items: z.array(z.unknown()).describe('匹配规则列表').optional(),
					match_type: z.number().int().describe('匹配类型').optional(),
				}).describe('匹配条件').optional(),
				id: z.string().describe('规则 id').optional(),
				ignore_the_rest_of_rules: z.boolean().describe('是否终止规则').optional(),
				is_enable: z.boolean().describe('是否启用').optional(),
				name: z.string().describe('规则名称').optional(),
			})).describe('规则列表').optional(),
		}),
	},
	'mail.user_mailbox.rules.reorder': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，使用 user_access_token 时可使用 me'),
		}),
		body: z.looseObject({
			rule_ids: z.array(z.unknown()).describe('规则 id 列表，获取方式见 [列出收信规则](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-rule/list)'),
		}),
	},
	'mail.user_mailbox.rules.update': {
		pathParams: z.strictObject({
			rule_id: z.union([z.string(), z.number().transform(String)]).describe('规则 id，获取方式见 [列出收信规则](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-rule/list)'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址 或 输入me代表当前调用接口用户'),
		}),
		body: z.looseObject({
			action: z.looseObject({
				items: z.array(z.looseObject({
					input: z.string().describe('当 type 为移动到文件夹时，该字段填文件夹的 id').optional(),
					type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(8), z.literal(9), z.literal(10), z.literal(11), z.literal(12), z.literal(13)]).describe('操作类型'),
				})).describe('匹配命中规则后的操作列表'),
			}).describe('匹配命中后的操作'),
			condition: z.looseObject({
				items: z.array(z.looseObject({
					input: z.string().describe('匹配条件右值').optional(),
					operator: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(10)]).describe('匹配条件操作符').optional(),
					type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10), z.literal(12), z.literal(13), z.literal(14), z.literal(15), z.literal(16)]).describe('匹配条件左值'),
				})).describe('匹配规则列表'),
				match_type: z.union([z.literal(1), z.literal(2)]).describe('匹配类型'),
			}).describe('匹配条件'),
			ignore_the_rest_of_rules: z.boolean().describe('是否终止规则'),
			is_enable: z.boolean().describe('是否启用'),
			name: z.string().describe('规则名称'),
		}),
	},
	'mail.user_mailbox.sent_messages.get_recall_detail': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('需要查询撤回结果的邮件ID，即调用接口[撤回邮件](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-sent_mes…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			failure_count: z.number().int().describe('撤回失败的收件人数').optional(),
			items: z.array(z.looseObject({
				fail_reason: z.string().describe('撤回失败原因，仅status为fail时有值').optional(),
				is_mailing_list: z.boolean().describe('是否为邮件组地址').optional(),
				mailing_list_failure_count: z.number().int().describe('邮件组内撤回失败人数，仅is_mailing_list为true时有值').optional(),
				mailing_list_finish_percent: z.number().int().describe('邮件组完成百分比0-100，仅is_mailing_list为true时有值').optional(),
				mailing_list_success_count: z.number().int().describe('邮件组内成功撤回人数，仅is_mailing_list为true时有值').optional(),
				recipient_address: z.string().describe('收件人邮箱地址').optional(),
				recipient_name: z.string().describe('收件人显示名称').optional(),
				status: z.string().describe('该收件人的撤回状态').optional(),
			})).describe('每个收件人的撤回详情列表').optional(),
			processing_count: z.number().int().describe('处理中的收件人数').optional(),
			recall_result: z.string().optional(),
			recall_status: z.string().optional(),
			success_count: z.number().int().describe('撤回成功的收件人数').optional(),
		}),
	},
	'mail.user_mailbox.sent_messages.recall': {
		pathParams: z.strictObject({
			message_id: z.union([z.string(), z.number().transform(String)]).describe('需要撤回的邮件ID，即调用接口[发送草稿](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/mail-v1/user_mailbox-draft/send)返…'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			recall_restriction_reason: z.string().optional(),
			recall_status: z.string().optional(),
		}),
	},
	'mail.user_mailbox.settings.send_as': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('邮箱地址'),
		}),
		response: z.looseObject({
			sendable_addresses: z.array(z.looseObject({
				email_address: z.string().describe('邮箱地址').optional(),
				email_type: z.string().describe('邮箱地址类型').optional(),
				name: z.string().describe('邮箱名称').optional(),
			})).describe('可发信地址').optional(),
		}),
	},
	'mail.user_mailbox.template.attachments.download_url': {
		pathParams: z.strictObject({
			template_id: z.union([z.string(), z.number().transform(String)]).describe('模板 id'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			attachment_ids: z.preprocess((value) => (typeof value === 'string' ? [value] : value), z.array(z.string())).describe('待获取下载链接的附件 id 列表'),
		}),
		response: z.looseObject({
			download_urls: z.array(z.looseObject({
				attachment_id: z.string().describe('附件 id').optional(),
				download_url: z.string().describe('下载链接').optional(),
			})).describe('下载链接列表').optional(),
			failed_reasons: z.array(z.looseObject({
				attachment_id: z.string().describe('附件 ID').optional(),
				reason: z.string().describe('失败原因').optional(),
			})).describe('附件下载链接获取失败原因列表').optional(),
		}),
	},
	'mail.user_mailbox.templates.create': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			template: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.union([z.literal(1), z.literal(2)]).describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			}).describe('待创建的模板内容'),
		}),
		response: z.looseObject({
			template: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				create_time: z.string().describe('模板创建时间（毫秒级时间戳字符串，避免 JS 弱类型侧 i64 精度丢失）').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				template_id: z.string().describe('模板 id').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			}).describe('创建成功的模板实体').optional(),
		}),
	},
	'mail.user_mailbox.templates.delete': {
		pathParams: z.strictObject({
			template_id: z.union([z.string(), z.number().transform(String)]).describe('模板 id'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
	},
	'mail.user_mailbox.templates.get': {
		pathParams: z.strictObject({
			template_id: z.union([z.string(), z.number().transform(String)]).describe('模板 id'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			template: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				create_time: z.string().describe('模板创建时间（毫秒级时间戳字符串，避免 JS 弱类型侧 i64 精度丢失）').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				template_id: z.string().describe('模板 id').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			}).describe('模板详情').optional(),
		}),
	},
	'mail.user_mailbox.templates.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				create_time: z.string().describe('模板创建时间（毫秒级时间戳字符串，避免 JS 弱类型侧 i64 精度丢失）').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				template_id: z.string().describe('模板 id').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			})).describe('模板列表（仅返回 template_id 与 name）').optional(),
		}),
	},
	'mail.user_mailbox.templates.update': {
		pathParams: z.strictObject({
			template_id: z.union([z.string(), z.number().transform(String)]).describe('模板 id'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			template: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.union([z.literal(1), z.literal(2)]).describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址'),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			}).describe('替换后的完整模板内容（全量替换）'),
		}),
		response: z.looseObject({
			template: z.looseObject({
				attachments: z.array(z.looseObject({
					attachment_type: z.number().int().describe('附件类型').optional(),
					cid: z.string().describe('内容 ID，HTML 中通过 cid: 协议引用该图片').optional(),
					filename: z.string().describe('附件文件名').optional(),
					id: z.string().describe('附件 id（Drive file_key，用于引用 Drive medias 上传接口返回的 file_key）').optional(),
					is_inline: z.boolean().describe('是否为内联图片，true 表示是内联图片').optional(),
				})).describe('模板附件与内嵌图片列表').optional(),
				bccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认密送地址列表').optional(),
				ccs: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认抄送地址列表').optional(),
				create_time: z.string().describe('模板创建时间（毫秒级时间戳字符串，避免 JS 弱类型侧 i64 精度丢失）').optional(),
				is_plain_text_mode: z.boolean().describe('是否为纯文本模式').optional(),
				name: z.string().describe('模板名称，不超过 100 字符').optional(),
				subject: z.string().describe('邮件主题').optional(),
				template_content: z.string().describe('模板正文（HTML 或纯文本）').optional(),
				template_id: z.string().describe('模板 id').optional(),
				tos: z.array(z.looseObject({
					mail_address: z.string().describe('邮件地址').optional(),
					name: z.string().describe('名称').optional(),
				})).describe('默认收件人地址列表').optional(),
			}).describe('更新后的模板').optional(),
		}),
	},
	'mail.user_mailbox.threads.batch_modify': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			add_folder: z.string().describe('需要移入的文件夹').optional(),
			add_label_ids: z.array(z.unknown()).describe('待添加的标签').optional(),
			remove_label_ids: z.array(z.unknown()).describe('待移除的标签').optional(),
			thread_ids: z.array(z.unknown()).describe('需要操作的邮件会话ID，可通过列出邮件会话获取').optional(),
		}),
	},
	'mail.user_mailbox.threads.batch_trash': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			thread_ids: z.array(z.unknown()).describe('邮箱会话ID，可通过列出邮件会话接口获取').optional(),
		}),
	},
	'mail.user_mailbox.threads.get': {
		pathParams: z.strictObject({
			thread_id: z.union([z.string(), z.number().transform(String)]).describe('邮件会话ID'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			format: z.enum(['full', 'plain_text_full', 'metadata']).describe('需要获取的邮件内容').optional(),
			include_spam_trash: z.union([z.boolean(), z.stringbool()]).describe('获取包含来自 SPAM 和 TRASH 的邮件').optional(),
		}),
		response: z.looseObject({
			thread: z.looseObject({
				body_preview: z.string().describe('会话内的最新的一封邮件摘要，用于快速预览邮件核心内容').optional(),
				id: z.string().describe('会话ID').optional(),
				messages: z.array(z.looseObject({
					attachments: z.array(z.unknown()).describe('邮件附件列表').optional(),
					bcc: z.array(z.unknown()).describe('密送').optional(),
					body_calendar: z.string().describe('日历邀请内容(base64url)').optional(),
					body_html: z.string().describe('正文(base64url)').optional(),
					body_plain_text: z.string().describe('正文纯文本(base64url)').optional(),
					body_preview: z.string().describe('邮件正文纯文本内容的前100个字符，基于base64url编码，用于快速预览邮件核心内容，无需解码完整正文').optional(),
					cc: z.array(z.unknown()).describe('抄送').optional(),
					folder_id: z.string().describe('文件夹ID').optional(),
					head_from: z.record(z.string(), z.unknown()).describe('发件人').optional(),
					in_reply_to: z.string().describe('In-Reply-To邮件头').optional(),
					internal_date: z.string().describe('创建/收/发信时间（毫秒）').optional(),
					label_ids: z.array(z.unknown()).describe('标签ID').optional(),
					message_id: z.string().describe('邮件id').optional(),
					message_state: z.number().int().describe('邮件状态，1为收信，2为发信，3为草稿').optional(),
					priority_type: z.string().describe('邮件优先级').optional(),
					references: z.string().describe('References邮件头').optional(),
					reply_to: z.string().describe('Reply-To邮件头').optional(),
					security_level: z.record(z.string(), z.unknown()).describe('安全信息').optional(),
					smtp_message_id: z.string().describe('RFC协议id').optional(),
					subject: z.string().describe('主题').optional(),
					thread_id: z.string().describe('会话id').optional(),
					to: z.array(z.unknown()).describe('收件人').optional(),
				})).describe('会话中的邮件列表').optional(),
			}).optional(),
		}),
	},
	'mail.user_mailbox.threads.list': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			folder_id: z.string().describe('文件夹 id，支持INBOX、SENT、SPAM、ARCHIVED、SCHEDULED、TRASH、DRAFT以及自定义文件夹ID').optional(),
			label_id: z.string().describe('标签id，支持IMPORTANT、OTHER、FLAGGED以及自定义标签ID').optional(),
			only_unread: z.union([z.boolean(), z.stringbool()]).describe('是否只查询未读会话').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小'),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				body_preview: z.string().describe('会话内的最新的一封邮件摘要，用于快速预览邮件核心内容').optional(),
				id: z.string().describe('会话ID').optional(),
			})).describe('会话列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'mail.user_mailbox.threads.modify': {
		pathParams: z.strictObject({
			thread_id: z.union([z.string(), z.number().transform(String)]).describe('邮件会话ID'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		body: z.looseObject({
			add_folder: z.string().describe('需要移入的文件夹').optional(),
			add_label_ids: z.array(z.unknown()).describe('待添加的标签').optional(),
			remove_label_ids: z.array(z.unknown()).describe('待移除的标签').optional(),
		}),
	},
	'mail.user_mailbox.threads.trash': {
		pathParams: z.strictObject({
			thread_id: z.union([z.string(), z.number().transform(String)]).describe('邮件会话ID'),
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
	},
	'mail.user_mailboxes.accessible_mailboxes': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址，用户身份下可以填写me'),
		}),
		response: z.looseObject({
			accessible_mailboxes: z.array(z.looseObject({
				email_address: z.string().describe('邮箱地址').optional(),
				email_type: z.string().describe('邮箱地址类型').optional(),
			})).describe('用户可访问的所有邮箱信息，包含主邮箱和公共邮箱').optional(),
		}),
	},
	'mail.user_mailboxes.profile': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('只支持填写me'),
		}),
		response: z.looseObject({
			primary_email_address: z.string().describe('用户主邮箱地址').optional(),
		}),
	},
	'mail.user_mailboxes.search': {
		pathParams: z.strictObject({
			user_mailbox_id: z.union([z.string(), z.number().transform(String)]).describe('用户邮箱地址'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('翻页参数：单页返回结果数量').optional(),
			page_token: z.string().describe('翻页 token：首页无需传参，后续请求使用上一次返回的 page_token 实现翻页').optional(),
		}),
		body: z.looseObject({
			filter: z.looseObject({
				bcc: z.array(z.unknown()).describe('密送人姓名或邮箱地址筛选，仅返回秘送人列表包含该秘送人的邮件').optional(),
				cc: z.array(z.unknown()).describe('抄送人姓名或邮箱地址筛选，仅返回抄送人列表包含该抄送人的邮件').optional(),
				create_time: z.looseObject({
					end_time: z.string().describe('时间范围的截止时间').optional(),
					start_time: z.string().describe('时间范围的开始时间').optional(),
				}).describe('邮件接收时间范围筛选，只返回在所选时间范围内的邮件').optional(),
				folder: z.array(z.unknown()).describe('文件夹名称筛选，仅返回在所选目录下的邮件').optional(),
				from: z.array(z.unknown()).describe('发件人姓名或邮箱地址筛选，仅返回来自该发件人的邮件').optional(),
				has_attachment: z.boolean().describe('是否只筛选有附件的邮件，默认值：**否**').optional(),
				is_unread: z.boolean().describe('是否只筛选未读邮件，默认为**否**').optional(),
				label: z.array(z.unknown()).describe('自定义标签名称筛选，仅返回包含指定自定义标签的邮件').optional(),
				subject: z.string().describe('邮件主题搜索，仅返回主题中能搜到搜索词的结果').optional(),
				to: z.array(z.unknown()).describe('收件人姓名或邮箱地址筛选，仅返回收件人列表包含该收件人的邮件').optional(),
			}).describe('用于对搜索结果进行精细化筛选，支持按发件人、收件人、文件夹、时间范围等多维度组合过滤，缩小查询范围，提升搜索精准度').optional(),
			query: z.string().describe('搜索关键词').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('可继续翻页').optional(),
			items: z.array(z.looseObject({
				display_info: z.string().describe('包含邮件基本信息的卡片，用户搜索关键词命中的文本片段，使用<h></h>标签包裹标注').optional(),
				id: z.string().describe('邮件唯一标识').optional(),
				meta_data: z.looseObject({
					create_time: z.string().describe('邮件接收时间').optional(),
					from: z.record(z.string(), z.unknown()).describe('邮件发件人').optional(),
					message_biz_id: z.string().describe('邮件唯一标识').optional(),
					thread_id: z.string().describe('邮件线程 ID').optional(),
					title: z.string().describe('邮件主题').optional(),
				}).describe('邮件元信息').optional(),
			})).describe('搜索结果列表').optional(),
			page_token: z.string().describe('翻页用的token').optional(),
			total: z.number().int().describe('搜索命中结果数').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
