export interface Block {
  block_id: string; // 块的唯一标识。创建块时会自动生成
  block_type: BlockType; // 块的枚举值，表示块的类型
  parent_id: string; // 块的父块 ID。除了根节点 Page 块外，其余块均有父块
  children: string[]; // 块的子块 ID 列表
  comment_ids: string[]; // 文档的评论 ID 列表。查询评论内容参考「获取回复」接口

  /// 以下为支持的 Block 类型及其对应的内容实体（即 BlockData），如 Text、Image、Table 等。
  /// 每种类型的 Block 都有一个对应的 BlockData，并且需与 BlockType 相对应。

  page?: Text; // 页面（根） Block
  text?: Text; // 文本 Block
  heading1?: Text; // 一级标题 Block
  heading2?: Text; // 二级标题 Block
  heading3?: Text; // 三级标题 Block
  heading4?: Text; // 四级标题 Block
  heading5?: Text; // 五级标题 Block
  heading6?: Text; // 六级标题 Block
  heading7?: Text; // 七级标题 Block
  heading8?: Text; // 八级标题 Block
  heading9?: Text; // 九级标题 Block
  bullet?: Text; // 无序列表 Block
  ordered?: Text; // 有序列表 Block
  code?: Text; // 代码块 Block
  quote?: Text; // 引用 Block
  todo?: Text; // 待办事项 Block
  bitable?: Bitable; // 多维表格 Block
  callout?: Callout; // 高亮块 Block
  chat_card?: ChatCard; // 会话卡片 Block
  diagram?: Diagram; // 流程图 & UML 图 Block
  divider?: Divider; // 分割线 Block
  file?: File; // 文件 Block
  grid?: Grid; // 分栏 Block
  grid_column?: GridColumn; // 分栏列 Block
  iframe?: Iframe; // 内嵌 Block
  image?: Image; // 图片 Block
  isv?: ISV; // 开放平台小组件 Block
  mindnote?: Mindnote; // 思维笔记 Block
  sheet?: Sheet; // 电子表格 Block
  table?: Table; // 表格 Block
  table_cell?: TableCell; // 表格单元格 Block
  view?: View; // 视图 Block
  undefined?: Undefined; // 未定义 Block
  quote_container?: QuoteContainer; // 引用容器 Block
  task?: Task; // 任务 Block
  okr?: OKR; // OKR Block
  okr_objective?: OkrObjective; // OKR 目标 Block
  okr_key_result?: OkrKeyResult; // OKR 关键结果 Block
  okr_progress?: OkrProgress; // OKR 进展 Block
  add_ons?: AddOns; // 文档小组件 Block
  jira_issue?: JiraIssue; // Jira 问题 Block
  wiki_catalog?: WikiCatalog; // Wiki 子目录 Block
  board?: Board; // 画板 Block
}

// fixme typing
export interface Link {}

/**
 * 任务块的内容实体。注意你只能获取任务块的任务 ID，无法创建或编辑任务块。如需获取任务详情，调用获取任务详情接口。
 */
export interface Task {
  /**
   * 任务 ID。
   */
  task_id: string;
}

/**
 * 页面、文本、一到九级标题、无序列表、有序列表、代码块、待办事项块的内容实体。支持多种样式和元素。可容纳 TextStyle 和 TextElement。
 */
export interface Text {
  /**
   * 文本样式。详见 TextStyle 的数据结构。
   */
  style?: TextStyle;

  /**
   * 文本元素。详见 TextElement 的数据结构。
   */
  elements: TextElement[];
}

/**
 * 文本样式内容实体。
 */
export interface TextStyle {
  /**
   * 对齐方式。详情参考 Align 枚举。
   * 默认值: 1
   */
  align?: Align;

  /**
   * Todo 的完成状态。
   * 默认值: FALSE
   */
  done?: boolean;

  /**
   * 文本的折叠状态。
   * 默认值: FALSE
   */
  folded?: boolean;

  /**
   * 代码块语言。详情参考 CodeLanguage 枚举。
   */
  language?: CodeLanguage;

  /**
   * 代码块是否自动换行。
   * 默认值: FALSE
   */
  wrap?: boolean;
}

/**
 * 文本元素内容实体，支持多种类型。
 */
export interface TextElement {
  /**
   * 文字。详见 TextElementData 一节中 TextRun 的数据结构。
   */
  text_run?: TextRun;

  /**
   * @用户。详见 TextElementData 一节中 MentionUser 的数据结构。
   */
  mention_user?: MentionUser;

  /**
   * @文档。详见 TextElementData 一节中 MentionDoc 的数据结构。
   */
  mention_doc?: MentionDoc;

  /**
   * 日期提醒。详见 TextElementData 一节中 Reminder 的数据结构。
   */
  reminder?: Reminder;

  /**
   * 内联文件。详见 TextElementData 一节中 InlineFile 的数据结构。
   */
  file?: InlineFile;

  /**
   * 内联文件块的内容实体。详见 TextElementData 一节中 InlineBlock 的数据结构。
   */
  inline_block?: InlineBlock;

  /**
   * 公式。详见 TextElementData 一节中 Equation 的数据结构。
   */
  equation?: Equation;

  /**
   * 未支持的 TextElementData 内容实体。为空结构体。
   */
  undefined_element?: UndefinedElement;
}

/**
 * 文本局部样式内容实体。
 */
export interface TextElementStyle {
  /**
   * 加粗
   * 默认值: FALSE
   */
  bold?: boolean;

  /**
   * 斜体
   * 默认值: FALSE
   */
  italic?: boolean;

  /**
   * 删除线
   * 默认值: FALSE
   */
  strikethrough?: boolean;

  /**
   * 下划线
   * 默认值: FALSE
   */
  underline?: boolean;

  /**
   * 内联代码
   * 默认值: FALSE
   */
  inline_code?: boolean;

  /**
   * 字体色。详情参考 FontColor 枚举。
   */
  text_color?: FontColor;

  /**
   * 字体背景色。详情参考 FontBackgroundColor 枚举。
   */
  background_color?: FontBackgroundColor;

  /**
   * 超链接
   */
  link?: Link;

  /**
   * 评论 ID 列表。在创建块时，不支持传入评论 ID；在更新文本块的 Element 时，允许将对应版本已存在的评论 ID 移动到同一个块内的任意 Element 中，但不支持传入新的评论 ID。如需查询评论内容请参考获取回复接口。
   */
  comment_ids?: string[];
}

/**
 * 本小节介绍文本元素（TextElement）的内容实体。
 */

/**
 * 文字的内容实体。
 */
export interface TextRun {
  /**
   * 文本
   */
  content: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 提及用户（@用户）内容实体。
 */
export interface MentionUser {
  /**
   * 用户 OpenID。参考如何获取自己的 User ID获取 user_id。
   */
  user_id: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 提及文档（@文档）块的内容实体。
 */
export interface MentionDoc {
  /**
   * 云文档 token
   */
  token: string;

  /**
   * 云文档类型。详情参考 MentionObjType 枚举。
   */
  obj_type: MentionObjType;

  /**
   * 云文档链接。读写均需要进行 URL 编码。
   */
  url: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 日期提醒内容实体。
 */
export interface Reminder {
  /**
   * 创建者用户 ID。
   */
  create_user_id: string;

  /**
   * 是否通知。
   * 默认值: FALSE
   */
  is_notify?: boolean;

  /**
   * 是日期还是整点小时。
   * 默认值: FALSE
   */
  is_whole_day?: boolean;

  /**
   * 事件发生的时间（毫秒级时间戳）。
   */
  expire_time: number;

  /**
   * 触发通知的时间（毫秒级时间戳）。
   */
  notify_time: number;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 内联文件内容实体。
 */
export interface InlineFile {
  /**
   * 文件的 Token。
   */
  file_token?: string;

  /**
   * 当前文档中该文件所处的块的 ID。
   */
  source_block_id?: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 内联块的内容实体。
 */
export interface InlineBlock {
  /**
   * 文本块中内联文件块的 Block ID。
   */
  block_id?: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 公式内容实体。
 */
export interface Equation {
  /**
   * 符合 KaTeX 语法的公式内容。语法规则参考 KaTex 官方说明。
   */
  content: string;

  /**
   * 文本局部样式。详情参考 TextElementStyle 数据结构。
   */
  text_element_style?: TextElementStyle;
}

/**
 * 未支持的 TextElementData 内容实体，为空结构体。
 */
export interface UndefinedElement {}

/**
 * 文本局部样式内容实体。
 */
export interface TextElementStyle {
  /**
   * 加粗
   * 默认值: FALSE
   */
  bold?: boolean;

  /**
   * 斜体
   * 默认值: FALSE
   */
  italic?: boolean;

  /**
   * 删除线
   * 默认值: FALSE
   */
  strikethrough?: boolean;

  /**
   * 下划线
   * 默认值: FALSE
   */
  underline?: boolean;

  /**
   * 内联代码
   * 默认值: FALSE
   */
  inline_code?: boolean;

  /**
   * 字体色。详情参考 FontColor 枚举。
   */
  text_color?: FontColor;

  /**
   * 字体背景色。详情参考 FontBackgroundColor 枚举。
   */
  background_color?: FontBackgroundColor;

  /**
   * 超链接
   */
  link?: Link;

  /**
   * 评论 ID 列表。在创建块时，不支持传入评论 ID；在更新文本块的 Element 时，允许将对应版本已存在的评论 ID 移动到同一个块内的任意 Element 中，但不支持传入新的评论 ID。如需查询评论内容请参考获取回复接口。
   */
  comment_ids?: string[];
}

/**
 * 思维笔记块的内容实体。
 * 目前只支持获取思维笔记块的占位信息，不支持创建及编辑。
 */
export interface Mindnote {
  /**
   * 思维笔记的 Token。
   * 示例值: bmnbcJ7X9yUiNbuG8Dfkgqabcef
   */
  token: string;
}

/**
 * OKR 块的内容实体，仅可在使用 user_access_token 时创建。
 */
export interface OKR {
  /**
   * OKR ID，获取 OKR ID，参考获取用户的 OKR 列表。
   */
  okr_id: string;

  /**
   * OKR Block 中的 Objective ID 和 Key Result ID。此值为空时插入 OKR 下所有的目标和关键结果。
   */
  objectives?: Objective[];
}

/**
 * OKR 目标块的内容实体。
 */
export interface OkrObjective {
  /**
   * OKR 目标 ID。
   */
  objective_id?: string;

  /**
   * 是否在 OKR 平台设置了私密权限。
   */
  confidential?: boolean;

  /**
   * Objective 的位置编号，对应 Block 中 O1、O2 的 1、2。
   */
  position?: number;

  /**
   * 打分信息。
   */
  score?: number;

  /**
   * OKR Block 中是否展示该目标。默认值: TRUE
   */
  visible?: boolean;

  /**
   * 目标的权重。
   */
  weight?: number;

  /**
   * 进展信息。
   */
  progress_rate?: ProgressRate;

  /**
   * 目标的文本内容。
   */
  content?: Text;
}

/**
 * OKR Key Result（关键结果）块的内容实体。
 */
export interface OkrKeyResult {
  /**
   * OKR 关键结果 ID。
   */
  kr_id?: string;

  /**
   * 是否在 OKR 平台设置了私密权限。
   */
  confidential?: boolean;

  /**
   * Key Result 的位置编号，对应 Block 中 KR1、KR2 的 1、2。
   */
  position?: number;

  /**
   * 打分信息。
   */
  score?: number;

  /**
   * OKR 块中是否展示该关键结果。默认值: TRUE
   */
  visible?: boolean;

  /**
   * 关键结果的权重。
   */
  weight?: number;

  /**
   * 进展信息。
   */
  progress_rate?: ProgressRate;

  /**
   * 关键结果的文本内容。
   */
  content?: Text;
}

/**
 * Objective
 */
export interface Objective {
  /**
   * OKR 中目标的 ID。
   */
  objective_id: string;

  /**
   * 关键结果的 ID 列表。此值为空时插入当前目标下的所有关键结果。
   */
  kr_ids?: string[];
}

/**
 * OKR 进展块的内容实体，为空结构体。
 */
export interface OkrProgress {}

/**
 * OKR 进展信息块的内容实体。
 */
export interface ProgressRate {
  /**
   * 状态模式，分 simple 和 advanced 两种。详情参考 OkrProgressRateMode 枚举。
   */
  mode?: OkrProgressRateMode;

  /**
   * 进展状态计算类型。详情参考 OkrProgressStatusType 枚举。
   */
  status_type?: OkrProgressStatusType;

  /**
   * 进展状态。详情参考 OkrProgressStatus 枚举。
   */
  progress_status?: OkrProgressStatus;

  /**
   * 当前进度百分比，simple 模式下使用。
   */
  percent?: number;

  /**
   * 进度起始值，advanced 模式使用。
   */
  start?: number;

  /**
   * 当前进度, advanced 模式使用。
   */
  current?: number;

  /**
   * 进度目标值，advanced 模式使用。
   */
  target?: number;
}

/**
 * 引用容器块的内容实体，为空结构体。
 */
export interface QuoteContainer {}

/**
 * 电子表格块的内容实体。目前只支持指定 row_size 和 column_size 创建空 Sheet。
 */
export interface Sheet {
  /**
   * 电子表格的文档 Token，只读属性。
   * 格式为 SpreadsheetToken_SheetID。其中，SpreadsheetToken是一篇电子表格的唯一标识，SheetID 是一张工作表的唯一标识，使用时请注意拆分。
   * 示例值: HP8psReUphghsYtr3VVcnqabcef_6ZSnoL
   */
  token?: string;

  /**
   * 电子表格行数量。创建空电子表格时使用，最大值 9。
   * 默认值: 2
   */
  row_size?: number;

  /**
   * 电子表格列数量。创建空电子表格时使用，最大值 9。
   * 默认值: 2
   */
  column_size?: number;
}

/**
 * 表格块的内容实体。支持指定 property 创建空表格。
 */
export interface Table {
  /**
   * 单元格块 ID 数组。创建表格时将由系统自动生成。
   */
  cells?: string[];

  /**
   * 表格属性。
   */
  property: TableProperty;
}

/**
 * 表格属性。
 */
export interface TableProperty {
  /**
   * 行数。
   */
  row_size: number;

  /**
   * 列数。
   */
  column_size: number;

  /**
   * 列宽，单位为像素。
   */
  column_width?: number[];

  /**
   * 是否设置首行为标题行。
   * 默认值: FALSE
   */
  header_row?: boolean;

  /**
   * 是否设置首列为标题列。
   * 默认值: FALSE
   */
  header_column?: boolean;

  /**
   * 单元格合并信息。在创建表格时，此属性只读，将由系统进行生成。如果需要对单元格进行合并操作，可以通过更新块的子请求 merge_table_cells 来实现。
   */
  merge_info?: TableMergeInfo[];
}

/**
 * 单元格合并信息。
 */
export interface TableMergeInfo {
  /**
   * 从当前单元格的行索引起，被合并的连续行数。如在 2 行 3 列的合并单元格中，左上角的单元格的 row_span 为 2，表示从该单元格的行索引起，被连续合并了两行。在创建表格时，此属性只读。
   */
  row_span?: number;

  /**
   * 从当前单元格的列索引起，被合并的连续列数。如在 2 行 3 列的合并单元格中，左上角的单元格的 col_span 为 3，表示从该单元格的列索引起，被连续合并了三列。在创建表格时，此属性只读。
   */
  col_span?: number;
}

/**
 * 单元格块的内容实体，为空结构体。
 */
export interface TableCell {}

/**
 * 分栏列块的内容实体。
 */
export interface GridColumn {
  /**
   * 当前分栏列占整个分栏的比例，取值范围为 [1,99]。
   */
  width_ratio?: number;
}

/**
 * 内嵌块的内容实体。
 */
export interface Iframe {
  /**
   * Iframe 组件。
   */
  component: {
    /**
     * Iframe 组件类型。详情参考 IframeComponentType 枚举。
     */
    type: IframeComponentType;

    /**
     * 目标网页 URL，读写均需要进行 URL 编码。
     * 示例值: http://https%3A%2F%2Fwenjuan.feishu.cn%2Fm%3Ft%3DsVOKVVz7rwpi-abcd
     */
    url: string;
  };
}

/**
 * 图片块的内容实体。了解如何插入图片块，参考常见问题-如何插入图片。
 */
export interface Image {
  /**
   * 图片 Token，只读属性。
   */
  token?: string;

  /**
   * 图片宽度，单位为像素。
   * 默认值: 100
   */
  width?: number;

  /**
   * 图片高度，单位为像素。
   * 默认值: 100
   */
  height?: number;

  /**
   * 对齐方式。详情参考 Align 枚举。
   * 默认值: 2
   */
  align?: Align;
}

/**
 * 旧版开放平台小组件块的内容实体。要查看新版开放平台小组件块的内容实体，参考 AddOns。
 */
export interface ISV {
  /**
   * ISV 文档小组件 ID。
   */
  component_id?: string;

  /**
   * 文档小组件类型 ID，用于区分不同类型的小组件，比如信息收集类。
   */
  component_type_id?: string;
}

/**
 * Jira 问题块的内容实体。
 */
export interface JiraIssue {
  /**
   * Jira 问题的 ID。
   */
  id?: string;

  /**
   * Jira 问题的 Key。
   */
  key?: string;
}

/**
 * 多维表格块的内容实体。目前支持通过指定 view_type 创建空 Bitable。
 */
export interface Bitable {
  /**
   * 多维表格在文档中的 Token，只读属性。
   * 格式为 BitableToken_TableID，其中，BitableToken 是一篇多维表格唯一标识，TableID 是一张数据表的唯一标识，使用时请注意拆分。
   * 示例值: JMeVbqbrtaoJijsExcXcN9abcef_tblBRJhqKXUABCEF
   */
  token: string;

  /**
   * 视图类型。详情参考 BitableViewType 枚举。
   * 示例值: 1
   */
  view_type: BitableViewType;
}

/**
 * 高亮块块的内容实体。
 */
export interface Callout {
  /**
   * 背景色。默认为透明色。详情参考CalloutBackgroundColor 枚举。
   */
  background_color?: CalloutBackgroundColor;

  /**
   * 边框色。默认为透明色。详情参考CalloutBorderColor 枚举。
   */
  border_color?: CalloutBorderColor;

  /**
   * 字体色。默认为黑色。详情参考FontColor 枚举。
   */
  text_color?: FontColor;

  /**
   * 表情的唯一标识。详情参考 Emoji 枚举。
   */
  emoji_id?: string;
}

/**
 * 会话卡片块的内容实体。
 */
export interface ChatCard {
  /**
   * 群聊天会话的 OpenID，以 ‘oc_’ 开头，表示专为开放能力接口定义的群组 ID。对于写操作，如果用户不在该群则返回无权限错误。
   */
  chat_id: string;

  /**
   * 对齐方式。详情参考 Align 枚举。
   */
  align?: Align;
}

/**
 * 流程图 & UML 图块的内容实体。
 */
export interface Diagram {
  /**
   * 绘图类型。详情参考 DiagramType 枚举。
   */
  diagram_type?: DiagramType;
}

/**
 * 分割线 Block 的内容实体，为空结构体。
 */
export interface Divider {}

/**
 * 文件块的内容实体。文件块不能独立存在，须与视图块一同出现。文件视图是通过视图块的 view_type 实现的，包括卡片视图和预览视图。在创建文件块时，系统会自动生成默认的视图块的内容实体。了解如何插入文件，参考常见问题。
 */
export interface File {
  /**
   * 文件的 Token，只读属性。
   * 示例值: M32ObeW83ouh8mxFiHycqVabcef
   */
  token?: string;

  /**
   * 文件名称，只读属性。
   * 示例值: VID_20231224_163819.mp4
   */
  name?: string;

  /**
   * 视图类型，int 类型：
   * - 1：卡片视图（默认）
   * - 2：预览视图
   * 示例值: 1
   */
  view_type?: number;
}

/**
 * 分栏块的内容实体。
 */
export interface Grid {
  /**
   * 分栏列数量，取值范围为 [2,5]。
   */
  column_size: number;
}

/**
 * 文档小组件块的内容实体。
 */
export interface AddOns {
  /**
   * AddOns 文档小组件 ID。该字段为空。
   */
  component_id?: string;

  /**
   * 文档小组件类型 ID，用于区分不同类型的小组件，比如问答互动类。
   */
  component_type_id?: string;

  /**
   * 文档小组件内容数据，JSON 字符串。
   * 示例值: {"color": "#FF8800","duration": 86359.465,"isNotify": true,"settingData": {"date": "2023-12-26","time": "20:07"},"startTime": 1703506061535,"timingType": 1}
   */
  record?: string;
}

/**
 * 视图块的内容实体。
 */
export interface View {
  /**
   * 视图类型。详情参考 ViewType 枚举。
   */
  view_type?: ViewType;
}

/**
 * Wiki 子目录块的内容实体。
 */
export interface WikiCatalog {
  /**
   * 知识库 token ，默认为当前文档所属知识库节点 token。了解如何获取知识库节点 token，参考获取知识空间节点信息。
   */
  wiki_token?: string;
}

/**
 * 画板块的内容实体。
 */
export interface Board {
  /**
   * 画板的 token，只读属性，插入画板块后自动生成。
   */
  token?: string;

  /**
   * 对齐方式。详情参考 Align 枚举。
   */
  align?: Align;

  /**
   * 宽度，单位像素；不填时自动适应文档宽度；值超出文档最大宽度时，页面渲染为文档最大宽度。
   */
  width?: number;

  /**
   * 高度，单位像素；不填时自动根据画板内容计算；值超出屏幕两倍高度时，页面渲染为屏幕两倍高度。
   */
  height?: number;
}

/**
 * 其它暂未支持的内容实体。只支持获取其 ID。这些内容实体不支持创建和更新，但支持删除。
 */
export interface Undefined {
  /**
   * 仅支持获取 ID。
   */
  id: string;
}

export enum BlockType {
  page = 1, // 页面 Block
  text = 2, // 文本 Block
  heading1 = 3, // 标题 1 Block
  heading2 = 4, // 标题 2 Block
  heading3 = 5, // 标题 3 Block
  heading4 = 6, // 标题 4 Block
  heading5 = 7, // 标题 5 Block
  heading6 = 8, // 标题 6 Block
  heading7 = 9, // 标题 7 Block
  heading8 = 10, // 标题 8 Block
  heading9 = 11, // 标题 9 Block
  bullet = 12, // 无序列表 Block
  ordered = 13, // 有序列表 Block
  code = 14, // 代码块 Block
  quote = 15, // 引用 Block
  todo = 17, // 待办事项 Block
  bitable = 18, // 多维表格 Block
  callout = 19, // 高亮块 Block
  chat_card = 20, // 会话卡片 Block
  diagram = 21, // 流程图 & UML Block
  divider = 22, // 分割线 Block
  file = 23, // 文件 Block
  grid = 24, // 分栏 Block
  grid_column = 25, // 分栏列 Block
  iframe = 26, // 内嵌 Block
  image = 27, // 图片 Block
  isv = 28, // 开放平台小组件 Block
  mindnote = 29, // 思维笔记 Block
  sheet = 30, // 电子表格 Block
  table = 31, // 表格 Block
  table_cell = 32, // 表格单元格 Block
  view = 33, // 视图 Block
  quote_container = 34, // 引用容器 Block
  task = 35, // 任务 Block
  okr = 36, // OKR Block
  okr_objective = 37, // OKR Objective Block
  okr_key_result = 38, // OKR Key Result Block
  okr_progress = 39, // OKR Progress Block
  add_ons = 40, // 新版文档小组件 Block
  jira_issue = 41, // Jira 问题 Block
  wiki_catalog = 42, // Wiki 子目录 Block
  board = 43, // 画板 Block
  undefined = 999, // 未支持 Block
}

/**
 * 块的排版方式。
 */
export enum Align {
  Left = 1, // 居左排版
  Center = 2, // 居中排版
  Right = 3, // 居右排版
}

/**
 * Bitable Block 的视图类型。
 */
export enum BitableViewType {
  Table = 1, // 数据表
  Board = 2, // 看板
}

/**
 * 高亮块的背景色（分为深色系和浅色系）。
 */
export enum CalloutBackgroundColor {
  LightRed = 1, // 浅红色
  LightOrange = 2, // 浅橙色
  LightYellow = 3, // 浅黄色
  LightGreen = 4, // 浅绿色
  LightBlue = 5, // 浅蓝色
  LightPurple = 6, // 浅紫色
  LightGray = 7, // 浅灰色
  DarkRed = 8, // 暗红色
  DarkOrange = 9, // 暗橙色
  DarkYellow = 10, // 暗黄色
  DarkGreen = 11, // 暗绿色
  DarkBlue = 12, // 暗蓝色
  DarkPurple = 13, // 暗紫色
  DarkGray = 14, // 暗灰色
}

/**
 * 高亮块的边框色（色系与高亮块背景色色系一致）。
 */
export enum CalloutBorderColor {
  Red = 1, // 红色
  Orange = 2, // 橙色
  Yellow = 3, // 黄色
  Green = 4, // 绿色
  Blue = 5, // 蓝色
  Purple = 6, // 紫色
  Gray = 7, // 灰色
}

/**
 * 代码块语言。
 */
enum CodeLanguage {
  PlainText = 1, // PlainText
  ABAP = 2, // ABAP
  Ada = 3, // Ada
  Apache = 4, // Apache
  Apex = 5, // Apex
  Assembly = 6, // Assembly
  Bash = 7, // Bash
  CSharp = 8, // C#
  Cpp = 9, // C++
  C = 10, // C
  COBOL = 11, // COBOL
  CSS = 12, // CSS
  CoffeeScript = 13, // CoffeeScript
  D = 14, // D
  Dart = 15, // Dart
  Delphi = 16, // Delphi
  Django = 17, // Django
  Dockerfile = 18, // Dockerfile
  Erlang = 19, // Erlang
  Fortran = 20, // Fortran
  FoxPro = 21, // FoxPro
  Go = 22, // Go
  Groovy = 23, // Groovy
  HTML = 24, // HTML
  HTMLBars = 25, // HTMLBars
  HTTP = 26, // HTTP
  Haskell = 27, // Haskell
  JSON = 28, // JSON
  Java = 29, // Java
  JavaScript = 30, // JavaScript
  Julia = 31, // Julia
  Kotlin = 32, // Kotlin
  LateX = 33, // LaTeX
  Lisp = 34, // Lisp
  Logo = 35, // Logo
  Lua = 36, // Lua
  MATLAB = 37, // MATLAB
  Makefile = 38, // Makefile
  Markdown = 39, // Markdown
  Nginx = 40, // Nginx
  Objective = 41, // Objective-C
  OpenEdgeABL = 42, // OpenEdge ABL
  PHP = 43, // PHP
  Perl = 44, // Perl
  PostScript = 45, // PostScript
  PowerShell = 46, // PowerShell
  Prolog = 47, // Prolog
  ProtoBuf = 48, // Protocol Buffers
  Python = 49, // Python
  R = 50, // R
  RPG = 51, // RPG
  Ruby = 52, // Ruby
  Rust = 53, // Rust
  SAS = 54, // SAS
  SCSS = 55, // SCSS
  SQL = 56, // SQL
  Scala = 57, // Scala
  Scheme = 58, // Scheme
  Scratch = 59, // Scratch
  Shell = 60, // Shell
  Swift = 61, // Swift
  Thrift = 62, // Thrift
  TypeScript = 63, // TypeScript
  VBScript = 64, // VBScript
  Visual = 65, // Visual Basic
  XML = 66, // XML
  YAML = 67, // YAML
  CMake = 68, // CMake
  Diff = 69, // Diff
  Gherkin = 70, // Gherkin
  GraphQL = 71, // GraphQL
  OpenGLSL = 72, // OpenGL Shading Language
  Properties = 73, // Properties
  Solidity = 74, // Solidity
  TOML = 75, // TOML
}

/**
 * 绘图类型。
 */
enum DiagramType {
  Flowchart = 1, // 流程图
  UML = 2, // UML 图
}

/**
 * 高亮块（Callout）Block 支持的表情。详情参考表情（Emoji）的枚举值。
 *
 * @see https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/document-docx/docx-v1/emoji
 */
export enum Emoji {}

// Define the emoji enum values here, if needed

/**
 * 字体的背景色（分为深色系和浅色系）。
 */
export enum FontBackgroundColor {
  LightPink = 1, // 浅粉红色
  LightOrange = 2, // 浅橙色
  LightYellow = 3, // 浅黄色
  LightGreen = 4, // 浅绿色
  LightBlue = 5, // 浅蓝色
  LightPurple = 6, // 浅紫色
  LightGray = 7, // 浅灰色
  DarkPink = 8, // 暗粉红色
  DarkOrange = 9, // 暗橙色
  DarkYellow = 10, // 暗黄色
  DarkGreen = 11, // 暗绿色
  DarkBlue = 12, // 暗蓝色
  DarkPurple = 13, // 暗紫色
  DarkGray = 14, // 暗灰色
}

/**
 * 字体色。
 */
export enum FontColor {
  Pink = 1, // 粉红色
  Orange = 2, // 橙色
  Yellow = 3, // 黄色
  Green = 4, // 绿色
  Blue = 5, // 蓝色
  Purple = 6, // 紫色
  Gray = 7, // 灰色
}

/**
 * 内嵌 Block 支持的类型。
 */
export enum IframeComponentType {
  Bilibili = 1, // 哔哩哔哩
  XiguaVideo = 2, // 西瓜视频
  Youku = 3, // 优酷
  Airtable = 4, // Airtable
  BaiduMap = 5, // 百度地图
  GaodeMap = 6, // 高德地图
  Undefined1 = 7, // Undefined
  Figma = 8, // Figma
  Modao = 9, // 墨刀
  Canva = 10, // Canva
  CodePen = 11, // CodePen
  FeishuQuestionnaire = 12, // 飞书问卷
  Jinshuju = 13, // 金数据
  Undefined2 = 14, // Undefined
  Undefined3 = 15, // Undefined
}

/**
 * Mention 云文档类型。
 */
export enum MentionObjType {
  Doc = 1, // Doc
  Sheet = 3, // Sheet
  Bitable = 8, // Bitable
  MindNote = 11, // MindNote
  File = 12, // File
  Slide = 15, // Slide
  Wiki = 16, // Wiki
  Docx = 22, // Docx
}

/**
 * OKR 周期的状态。
 */
export enum OkrPeriodDisplayStatus {
  default = 'default', // 默认
  normal = 'normal', // 正常
  invalid = 'invalid', // 失效
  hidden = 'hidden', // 隐藏
}

/**
 * OKR 进展状态模式。
 */
export enum OkrProgressRateMode {
  simple = 'simple', // 简单模式
  advanced = 'advanced', // 高级模式
}

/**
 * OKR 进展状态。
 */
export enum OkrProgressStatus {
  unset = 'unset', // 未设置
  normal = 'normal', // 正常
  risk = 'risk', // 有风险
  extended = 'extended', // 已延期
}

/**
 * OKR 进展所展示的状态计算类型。
 */
export enum OkrProgressStatusType {
  default = 'default', // 以风险最高的 Key Result 状态展示。
  custom = 'custom', // 自定义。
}

/**
 * 文本元素类型。
 */
export enum TextElementType {
  text_run = 'text_run', // 文字
  mention_user = 'mention_user', // @用户
  mention_doc = 'mention_doc', // @文档
  file = 'file', // @文件
  reminder = 'reminder', // 日期提醒
  undefined = 'undefined', // 未支持元素
  equation = 'equation', // 公式
}

/**
 * View Block 的视图类型。
 */
export enum ViewType {
  CardView = 1, // 卡片视图，独占一行的一种视图，在 Card 上可有一些简单交互
  PreviewView = 2, // 预览视图，在当前页面直接预览插入的 Block 内容，而不需要打开新的页面
  InlineView = 3, // 内联视图
}

export const BlockEnums = {
  BlockType,
  Align,
  BitableViewType,
  CalloutBackgroundColor,
  CalloutBorderColor,
  CodeLanguage,
  DiagramType,
  Emoji,
  FontBackgroundColor,
  FontColor,
  IframeComponentType,
  MentionObjType,
  OkrPeriodDisplayStatus,
  OkrProgressRateMode,
  OkrProgressStatus,
  OkrProgressStatusType,
  TextElementType,
  ViewType,
};
