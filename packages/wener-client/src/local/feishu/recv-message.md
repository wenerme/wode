# 接收消息内容结构

调用消息的查询接口（如[获取会话历史消息](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/list)、[获取指定消息的内容](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/get)等）时，返回结果可能包含多种类型消息的内容（`content`）。本文将介绍接收消息内容时，可能返回的消息类型与内容。

## 示例

如下[获取指定消息的内容](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/get)的返回结果中：

- `msg_type`：消息类型，数据类型为 string。例如返回 text 表示文本消息。
- `content`：消息内容，数据类型为 string，取值为 JSON 结构。

```json
{
	"code": 0,
	"data": {
		"items": [
			{
				"body": {
					"content": "{\"text\":\"test content\"}"
				},
				"chat_id": "oc_c7af75456b3475e72fd349b954d5xxxx",
				"create_time": "1722238025751",
				"deleted": false,
				"message_id": "om_84586909cde1d551d10532a83524xxxx",
				"msg_type": "text",
				"sender": {
					"id": "cli_a61e4f821889xxxx",
					"id_type": "app_id",
					"sender_type": "app",
					"tenant_key": "1709bdxxxx"
				},
				"update_time": "1722238025751",
				"updated": false
			}
		]
	},
	"msg": "success"
}
```

## 各类型消息 JSON 结构

### 文本 text

```json
{
	"text": "@_user_1 文本消息"
}
```

内容说明：

- 文本消息中超链接的格式为 `[超链接文本](超链接地址)`，如：`[飞书开放平台](https://open.feishu.cn)`。对于邮箱类型的超链接，格式为 `[邮箱文本](mailto:邮箱地址)`。
- 文本消息中的 @ 会被替换为 `@_user_X` 形式的内容，表示被 @ 的用户或机器人的序号。例如，第 3 个被 @ 到的成员，值为 `@_user_3`。在实际调用接口时，如果文本消息内 @ 了用户，则可以在返回结果的 `mentions` 字段中获取具体被 @ 的用户或机器人的信息。关于 `mentions` 字段的说明，可参见[消息管理概述](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/intro)中的 `mentions` 字段介绍。
- 粗体、下划线等文本样式将被忽略，仅显示文本内容。

### 富文本 post

:::warning
**注意**：获取富文本消息时，其内容（包括[发送消息](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create)的响应体中的消息内容）与发送时的内容 **不完全一致**。富文本消息的 `md` 标签仅支持发送，在获取消息内容时将不包含此标签，系统会根据 `md` 中的内容转换为其他标签。此外，引用、有序、无序列表会简化成文本标签（text）进行输出。
:::

```json
{
	"title": "我是一个标题",
	"content": [
		[
			{
				"tag": "text",
				"text": "第一行 :",
				"style": ["bold", "underline"]
			},
			{
				"tag": "a",
				"href": "http://www.feishu.cn",
				"text": "超链接",
				"style": ["bold", "italic"]
			},
			{
				"tag": "at",
				"user_id": "@_user_1",
				"user_name": "",
				"style": []
			}
		],
		[
			{
				"tag": "img",
				"image_key": "img_47354fbc-a159-40ed-86ab-2ad0f1acb42g"
			}
		],
		[
			{
				"tag": "text",
				"text": "第二行:",
				"style": ["bold", "underline"]
			},
			{
				"tag": "text",
				"text": "文本测试",
				"style": []
			}
		],
		[
			{
				"tag": "img",
				"image_key": "img_47354fbc-a159-40ed-86ab-2ad0f1acb42g"
			}
		],
		[
			{
				"tag": "media",
				"file_key": "file_v2_0dcdd7d9-fib0-4432-a519-41d25aca542j",
				"image_key": "img_7ea74629-9191-4176-998c-2e603c9c5e8g"
			}
		],
		[
			{
				"tag": "emotion",
				"emoji_type": "SMILE"
			}
		],
		[
			{
				"tag": "hr"
			}
		],
		[
			{
				"tag": "code_block",
				"language": "GO",
				"text": "func main() int64 {\n    return 0\n}"
			}
		]
	]
}
```

接收富文本消息时，包含的标签（`tag`）和参数说明如下：

- **text：文本**

| 字段      | 类型     | 描述                                                                                                                            |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| text      | string   | 文本内容                                                                                                                        |
| un_escape | boolean  | 是否为 unescape 解码。返回 false 或者不返回该值表示不是 unescape 解码                                                           |
| style     | []string | 文本内容样式。可能值为 `bold`（加粗）、`underline`（下划线）、`lineThrough`（删除线） 与 `italic`（斜体）。不返回表示文本无样式 |

- **a：超链接**

| 字段  | 类型     | 描述                                                                                                                            |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| text  | string   | 链接显示的文本内容                                                                                                              |
| href  | string   | 链接地址                                                                                                                        |
| style | []string | 文本内容样式。可能值为 `bold`（加粗）、`underline`（下划线）、`lineThrough`（删除线） 与 `italic`（斜体）。不返回表示文本无样式 |

- **at：@**

| 字段      | 类型     | 描述                                                                                                                                                                                                                                         |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user_id   | string   | 被 @ 的用户或机器人的序号。例如，第 3 个被 @ 到的成员值为 `@_user_3`；@ 成员的详细信息可在响应字段 `mentions` 中根据序号获取，详情参见[消息管理概述](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/intro)中的 `mentions` 字段介绍 |
| user_name | string   | 用户姓名                                                                                                                                                                                                                                     |
| style     | []string | 文本内容样式。可能值为 `bold`（加粗）、`underline`（下划线）、`lineThrough`（删除线） 与 `italic`（斜体）。不返回表示文本无样式                                                                                                              |

- **img：图片**

| 字段      | 类型   | 描述                                                                                                                                             |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| image_key | string | 图片的唯一标识。由机器人自己上传的、用于发送消息的图片，支持下载，详情参见[下载图片](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/image/get) |

- **media：视频**

| 字段      | 类型   | 描述                                                                                                                                                     |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| file_key  | string | 视频文件的唯一标识。由机器人自己上传的文件支持下载，详情参见[下载文件](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/file/get)                        |
| image_key | string | 视频封面图片的唯一标识。由机器人自己上传的、用于发送消息的图片，支持下载，详情参见[下载图片](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/image/get) |

- **emotion：表情**

| 字段       | 类型   | 描述                                                                                                                   |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| emoji_type | string | 表情类型。部分可选值参见[表情文案](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-reaction/emojis-introduce) |

- **code_block：代码块**

| 字段     | 类型   | 描述                                                                                                                                                  |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| language | string | 代码块语言，支持 PYTHON、C、CPP、GO、JAVA、KOTLIN、SWIFT、PHP、RUBY、RUST、JAVASCRIPT、TYPESCRIPT、BASH、SHELL、SQL、JSON、XML、YAML、HTML、THRIFT 等 |
| text     | string | 代码块内容                                                                                                                                            |

- **hr**

富文本标签 `tag` 为 `hr` 表示一条分割线。无其它参数。

### 图片 image

```json
{
	"image_key": "img_4adb3cc3-902b-4187-b0f1-842f67fd017g"
}
```

| 字段      | 类型   | 描述                                                                                                                                                                                                                                                                |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| image_key | string | 图片唯一标识。由机器人自己上传的图片支持下载，详情参见[下载图片](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/image/get)，此外也支持调用[获取消息中的资源文件](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-resource/get)接口，获取图片类型的文件。 |

### 文件 file

```json
{
	"file_key": "75235e0c-4f92-430a-a99b-8446610223cg",
	"file_name": "test.txt"
}
```

| 字段      | 类型   | 描述                                                                                                                          |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| file_key  | string | 文件唯一标识。由机器人自己上传的文件支持下载，详情参见[下载文件](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/file/get)。 |
| file_name | string | 文件名。                                                                                                                      |

### 文件夹 folder

```json
{
	"file_key": "75235e0c-4f92-430a-a99b-8446610223cg",
	"file_name": "folder"
}
```

| 字段      | 类型   | 描述                                                                                                                                                                      |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| file_key  | string | 文件夹唯一标识。<br><br> **注意**：目前仅支持通过飞书客户端上传或下载文件夹，通过 API 获取消息时只能获取到文件夹的 Key 以及名称，但无法通过 API 方式基于 Key 下载文件夹。 |
| file_name | string | 文件名。                                                                                                                                                                  |

### 音频 audio

```json
{
	"file_key": "75235e0c-4f92-430a-a99b-8446610223cg",
	"duration": 2000
}
```

| 字段     | 类型   | 描述                                                                                                                          |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| file_key | string | 文件唯一标识。由机器人自己上传的文件支持下载，详情参见[下载文件](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/file/get)。 |
| duration | int    | 音频时长，单位：毫秒。                                                                                                        |

### 视频 media

```json
{
	"file_key": "75235e0c-4f92-430a-a99b-8446610223cg",
	"image_key": "img_xxxxxx",
	"file_name": "测试视频.mp4",
	"duration": 2000
}
```

| 字段      | 类型   | 描述                                                                                                                                                     |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| file_key  | string | 文件唯一标识。由机器人自己上传的文件支持下载，详情参见[下载文件](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/file/get)。                            |
| image_key | string | 视频封面图片的唯一表示。由机器人自己上传的、用于发送消息的图片支持下载，详情参见[下载图片](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/image/get)。 |
| file_name | string | 文件名。                                                                                                                                                 |
| duration  | int    | 视频时长，单位：毫秒。                                                                                                                                   |

### 表情包 sticker

```json
{
	"file_key": "75235e0c-4f92-430a-a99b-8446610223cg"
}
```

| 字段     | 类型   | 描述                                                                                                     |
| -------- | ------ | -------------------------------------------------------------------------------------------------------- |
| file_key | string | 文件唯一标识。机器人可以在接收到当前表情包的 file_key 后，使用 file_key 发送消息，但不支持下载该表情包。 |

### 卡片 interactive

:::warning

- 接收到的卡片结构与卡片实际 JSON 结构不一致，暂不支持返回原始卡片 JSON。了解卡片结构，参考[卡片 JSON 结构](/ssl:ttdoc/uAjLw4CM/ukzMukzMukzM/feishu-cards/card-json-v2-structure)。
- 暂不支持返回 JSON 2.0 结构卡片的具体内容。
  :::

```json
{
	"title": "卡片标题",
	"elements": [
		[
			{
				"tag": "button",
				"text": "主按钮",
				"type": "primary"
			},
			{
				"tag": "button",
				"text": "次按钮",
				"type": "default"
			},
			{
				"tag": "button",
				"text": "危险按钮",
				"type": "danger"
			}
		],
		[
			{
				"tag": "a",
				"href": "https://www.feishu.cn",
				"text": "飞书"
			},
			{
				"tag": "text",
				"text": "整合即时沟通、日历、音视频会议、云文档、云盘、工作台等功能于一体，成就组织和个人，"
			},
			{
				"tag": "at",
				"user_id": "@_user_1",
				"user_name": ""
			},
			{
				"tag": "text",
				"text": "更高效、更愉悦。"
			}
		],
		[
			{
				"tag": "hr"
			}
		],
		[
			{
				"tag": "text",
				"text": "图片标题"
			},
			{
				"tag": "img",
				"image_key": "img_acd8a194-3e63-49ca-bcf6-224624457a3g"
			}
		],
		[
			{
				"tag": "note",
				"elements": [
					{
						"tag": "img",
						"image_key": "img_acd8a194-3e63-49ca-bcf6-224624457a3g"
					},
					{
						"tag": "text",
						"text": "备注信息"
					}
				]
			}
		],
		[
			{
				"tag": "text",
				"text": "深度整合使用率极高的办公工具，企业成员在一处即可实现高效沟通与协作。"
			},
			{
				"tag": "img",
				"image_key": "img_acd8a194-3e63-49ca-bcf6-224624457a3g"
			}
		],
		[
			{
				"tag": "text",
				"text": "在移动端同样进行便捷的沟通、互动与协作，手机电脑随时随地保持同步。"
			},
			{
				"tag": "select_static",
				"options": ["选项1", "选项2", "选项3", "选项4"],
				"placeholder": "默认提示文本"
			}
		],
		[
			{
				"tag": "text",
				"text": "ISV产品接入及企业自主开发，更好地对接现有系统，满足不同组织的需求。"
			},
			{
				"tag": "overflow",
				"options": ["打开飞书应用目录", "打开飞书开发文档", "打开飞书官网"]
			}
		],
		[
			{
				"tag": "text",
				"text": "国际权威安全认证与信息安全管理体系，为企业提供全生命周期安全保障。"
			},
			{
				"tag": "date_picker",
				"placeholder": "请选择日期",
				"initial_date": "2021-1-1"
			}
		]
	]
}
```

### 红包 hongbao

目前只返回红包文本（`text`）。

```json
{
	"text": "[红包]"
}
```

### 日程

#### 日程分享卡片 share_calendar_event

```json
{
	"summary": "日程分享测试",
	"start_time": "1608265395000",
	"end_time": "1608267015000"
}
```

| 字段       | 类型   | 描述                         |
| ---------- | ------ | ---------------------------- |
| summary    | string | 日程标题。                   |
| start_time | string | 日程开始时间，毫秒级时间戳。 |
| end_time   | string | 日程结束时间，毫秒级时间戳。 |

#### 日程邀请卡片 calendar

```json
{
	"summary": "日程邀请测试",
	"start_time": "1608265395000",
	"end_time": "1608267015000"
}
```

| 字段       | 类型   | 描述                         |
| ---------- | ------ | ---------------------------- |
| summary    | string | 日程标题。                   |
| start_time | string | 日程开始时间，毫秒级时间戳。 |
| end_time   | string | 日程结束时间，毫秒级时间戳。 |

#### 日程转让卡片/日程附言/切换日程所在日历 general_calendar

```json
{
	"summary": "日程转让测试",
	"start_time": "1608265395000",
	"end_time": "1608267015000"
}
```

| 字段       | 类型   | 描述                         |
| ---------- | ------ | ---------------------------- |
| summary    | string | 日程标题。                   |
| start_time | string | 日程开始时间，毫秒级时间戳。 |
| end_time   | string | 日程结束时间，毫秒级时间戳。 |

### 群名片 share_chat

```json
{
	"chat_id": "oc_0dd200d32fdaxxxxxxxx32f76"
}
```

| 字段    | 类型   | 描述                                                                                                              |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| chat_id | string | 群 ID。调用[获取群信息](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat/get) 接口，可基于群 ID 查询群信息。 |

### 个人名片 share_user

```json
{
	"user_id": "ou_0dd200d32xxxxx6d2c2ef1ddb32f76"
}
```

| 字段    | 类型   | 描述                                                                                                                                            |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| user_id | string | 用户的 open_id。调用[获取单个用户信息](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/user/get)接口，可基于用户的 open_id 查询用户信息。 |

### 系统消息 system

根据系统消息模板 `template` 中的变量 `{xxx}`，取相应的变量名参数值。

- 在飞书客户端拉用户入群时的系统消息

```json
{
	"template": "{from_user} invited {to_chatters} to this chat.",
	"from_user": ["botName"],
	"to_chatters": ["小明", "小王", "小红"]
}
```

| 字段        | 类型   | 描述                                                  |
| ----------- | ------ | ----------------------------------------------------- |
| template    | stirng | 拉用户入群提示消息的模板内容。                        |
| from_user   | list   | 模板内 `{from_user}` 的取值，表示拉用户动作的发起者。 |
| to_chatters | list   | 模板内 `{to_chatters}` 的取值，表示被拉用户列表。     |

- 分割线系统消息

```json
{
	"template": "{divider_text}",
	"from_user": [],
	"to_chatters": [],
	"divider_text": {
		"text": "新会话",
		"i18n_text": {
			"zh_cn": "新话题",
			"en_us": "New Session"
		}
	}
}
```

| 字段         | 类型   | 描述                                                                                                                      |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| template     | stirng | 分割线系统消息的模板内容。                                                                                                |
| divider_text | object | 模板内 `{divider_text}` 的取值，其中的 `text` 是内容的默认值；`i18n_text` 是内容的多语言配置，以 `{key:value}` 形式取值。 |

### 位置 location

```json
{
	"name": "xx省xx市",
	"longitude": "xxx.xxx",
	"latitude": "xxx.xxx"
}
```

| 字段      | 类型   | 描述       |
| --------- | ------ | ---------- |
| name      | string | 位置名称。 |
| longitude | string | 经度。     |
| latitude  | string | 维度。     |

### 视频通话 video_chat

```json
{
	"topic": "视频通话消息",
	"start_time": "1623124523829"
}
```

| 字段       | 类型   | 描述                         |
| ---------- | ------ | ---------------------------- |
| topic      | string | 视频通过的标题。             |
| start_time | string | 通话开始时间，毫秒级时间戳。 |

### 任务 todo

```json
{
	"task_id": "acd096a5-a157-4b9d-80e2-5b317456f005",
	"summary": { "title": "", "content": [[{ "tag": "text", "text": "多吃水果，多运动，健康生活，快乐工作。" }]] },
	"due_time": "1623124318000"
}
```

**任务的参数说明** :

| 字段     | 类型   | 描述                                                                                                                          |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| task_id  | string | 任务 ID，使用此 ID 可以对任务进行操作，详情参见[任务概述](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/task-v1/task/overview)。 |
| summary  | post   | 富文本格式的任务标题。具体内容结构说明，参见上文 **富文本 post** 章节。                                                       |
| due_time | string | 任务截止时间，毫秒级时间戳。                                                                                                  |

### 投票 vote

```json
{
	"topic": "投票测试",
	"options": ["选项1", "选项2", "选项3"]
}
```

| 字段    | 类型   | 描述           |
| ------- | ------ | -------------- |
| topic   | string | 投票主题。     |
| options | list   | 投票选项列表。 |

### 合并转发 merge_forward

```json
{
	"content": "Merged and Forwarded Message"
}
```

消息内容固定为 `Merged and Forwarded Message`，用于标识该消息为合并转发消息。你可调用[获取指定消息的内容](/ssl:ttdoc/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/get)接口，获取合并转发消息中的子消息。
