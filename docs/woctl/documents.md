# PDF 与 Excel 文档工具

这些命令在 Node 原生 CLI 中提供，不需要配置服务；Web CLI 不加载文件系统或 WASM 文档解析器。安装时会自动安装 PDF/Excel 所需的运行依赖。

## PDF

```sh
woctl pdf info document.pdf --json
woctl pdf inspect document.pdf --detail full --text --pages 1-3 --json
woctl pdf read document.pdf --pages 1,3-5 --output md
woctl pdf parse --list-templates --json
woctl pdf parse document.pdf --output json
woctl pdf render document.pdf --page 1 --width 1200 --output page.png
woctl pdf render document.pdf --pages all --output 'page-%03d.png'
```

`info` 返回文件摘要、元数据、页尺寸、大纲及附件概况；`inspect` 支持按 detail 选择更深的文本、注解、结构与操作符信息。`read` 按页重建文本和 Markdown。`parse` 按内置模板解析字段，可用 `--template` 指定模板或自动检测；模板属于启发式提取，使用时应核对原文。

页选择支持 `1,3-5`、`last`、`odd`、`even`、`all`。`--page-limit` 控制未显式选择页面时读取的页数。密码使用 `--password`，或通过 `--password-env PDF_PASSWORD` 在执行时读取自己的环境变量；帮助和模板列表不读取密码。

PDF 的 `-o/--output` 在 info/inspect/read/parse 下选择格式，在 render 下选择 PNG 路径。文本另存用 `--output-file result.md`。PNG 支持 `--dpi`、`--scale`、`--width`、`--height` 和透明背景；多页须指定带 `%03d`、`{page}` 或 `{index}` 的路径模式。PNG 二进制可以重定向到文件，交互终端要求明确提供输出路径。

## Excel / XLSX

```sh
woctl xlsx list workbook.xlsx
woctl xlsx inspect workbook.xlsx --output json
woctl xlsx read workbook.xlsx --sheet Data --range A1:D20 --header --output csv
woctl xlsx props workbook.xlsx --output json
woctl xlsx edit --create --out workbook.xlsx --csv-file rows.csv --header-style --autofit
woctl xlsx edit workbook.xlsx --out updated.xlsx --set 'B2=42' --style 'A1:D1=header'
woctl xlsx tidy workbook.xlsx --out compact.xlsx
woctl xlsx export workbook.xlsx --out-dir exported --bom
```

`list` 的别名为 `sheets`，`props` 的别名为 `properties`。`read` 支持 sheet 名称或从零开始的索引、range、offset、limit，`--limit 0` 表示全部行；`--raw` 读取原始单元格值。`--header` 用第一行作为 CSV/表格/JSONL 字段名；`--raw-rows` 导出原始 CSV 行，不生成列名。

`edit` 接受 CSV 或 JSON 行数据、单元格赋值和样式；`--csv-file -`、`--json-file -` 可读 stdin。支持追加行、替换工作表、样式合并/替换、冻结表头、自动列宽，以及字体大小、填充、对齐和数字格式。读取已有工作簿后默认写到独立的 `--out` 文件；覆盖输入文件须明确 `--in-place`。

`tidy` 从实际单元格重建工作簿，用于清理陈旧的尺寸、样式和内部数据，同时会丢弃图片、绘图及未保留的复杂工作表结构。请先输出独立文件核对。`export` 按工作表生成 CSV，可选 UTF-8 BOM，默认写入 `xlsx.manifest.json`，`--no-manifest` 可关闭。

## 通过 render 自动识别

```sh
woctl render document.pdf --pages 1-3
woctl render document.pdf --format text -o document.txt
woctl render workbook.xlsx --sheet Data --limit 20
woctl render workbook.xlsx --sheet Data --format csv -o rows.csv
```

`render` 根据扩展名识别 PDF、XLSX/XLSM/XLTX/XLTM，也可用 `--input pdf|xlsx` 指定类型。PDF 支持页选择与密码，Excel 支持 sheet/range/limit/offset/header。CSV 输出要求选择单张工作表，输出不包含 Markdown 标题。

本地文件工具在正常结束、失败和取消时释放已创建的解析器资源；WASM 计算和同步文件操作无法保证在任意指令中途立即终止。
