# @wener/ui

`@wener/ui` 提供应用无关、发布安全的 React UI primitives。行为基于 Base UI 或原生 HTML，视觉使用 Tailwind CSS v4、DaisyUI v5 semantic classes 与 CVA。

## 设计约束

- `src/base/` 只承载 Base UI 的交互和可访问性原语，`src/primitive/` 承载带 DaisyUI 语义样式的基础控件；两者都可以通过对应 namespace subpath 独立消费。
- 旧的 `@wener/ui/<family>` family subpath 继续保留，用于兼容现有应用；新的代码优先使用 `@wener/ui/primitive/<family>` 或 `@wener/ui/base/<family>`。
- Native/Base UI props、ref、事件、`aria-*`、`data-*` 与 `className` 落到真实控件。
- 稳定视觉选择使用 CVA；调用方 class 使用 `cn()` 合并。
- Base UI 负责需要状态机、Portal、焦点或键盘行为的组件。
- Native HTML 负责浏览器已经完整支持的 input、file input、range、progress、table 等语义。
- Native `<input>` wrapper 使用 `controlSize` 选择 DaisyUI 尺寸，保留原生 `size?: number` 属性。
- DaisyUI 负责 theme-aware visual classes；禁止动态拼接 `component-${value}`，确保 Tailwind 可以扫描完整 class。
- 共享 `@wener/ui/daisy` 只提供受限 vocabulary type，不提供接受任意 modifier 的万能 builder。
- Console、Resource、Window、File、Agent 和 Auth runtime 属于应用域，不进入本 package；应用侧 `registry.json` 只负责 Shadcn 发布元数据。
- 本 package 的基础/展示 family 不要求逐项生成 `/r/*.json`。

## Public families

### Forms

- `button`
- `input`
- `textarea`
- `file-input`
- `checkbox`
- `radio-group`
- `switch`
- `select`
- `slider`
- `label`
- `field`
- `fieldset`

### Feedback and display

- `alert`
- `badge`
- `loading`，同时导出 `Spinner`
- `progress`
- `skeleton`
- `status`
- `toast`
- `tooltip`
- `avatar`
- `card`
- `separator`
- `table`
- `kbd`

### Structure and navigation

- `accordion`
- `collapsible`
- `tabs`
- `breadcrumb`
- `pagination`
- `menu`：静态导航结构
- `dropdown-menu`：Base UI 弹层菜单行为

### Overlays

- `dialog`
- `alert-dialog`
- `popover`
- `drawer`：支持 swipe 的移动面板
- `sheet`：基于 Dialog 的侧边面板

### Shared

- `daisy`
- `utils`
- `examples`

Root `@wener/ui` 重新导出全部原有 family；`primitive` 额外提供 Link、Divider、Diff、OTP、Radio、Range 和 Toggle 等通用基础控件；`base` 提供 Accordion、Autocomplete、Combobox、Dialog、Menu、Popover 和 Tooltip 的无样式行为入口。`examples` 只通过独立 subpath 使用。现有 `Button`、`Dialog`、`Input`、`Popover`、`Textarea` subpath 与 Dialog/Popover namespace API 保持兼容。

## Storybook

Storybook 位于 package 边界内，不依赖 Waku、registry、代理或应用数据：

```bash
pnpm -C packages/ui storybook
pnpm -C packages/ui build-storybook
```

预览只提供 light/dark 两个通用 DaisyUI 主题。产品品牌、供应商名称、部署代理和业务页面不属于本 package。

## Consumer CSS

消费应用必须启用 Tailwind CSS v4 与 DaisyUI v5，并扫描 package source：

```css
@import 'tailwindcss';
@source "../node_modules/@wener/ui/src";
@plugin "daisyui";
```

Monorepo 应按实际相对路径设置 `@source`。Theme 通过 `data-theme` 选择，组件不硬编码 theme 名。

## Verification

```bash
pnpm -C packages/ui test
pnpm -C packages/ui typecheck
pnpm -C packages/ui build
pnpm -C packages/ui storybook
pnpm -C packages/ui build-storybook
```

发布前还必须验证 pack 后的 root 与全部 family ESM entry 可以从构建产物加载。

## Build traps

- `packages/ui/.swcrc` 必须保持 React automatic JSX runtime；否则 SWC 会生成没有 React import 的 `React.createElement`，tarball 只能 import、不能实际 render。
- `pnpm test` 先 build，再从 `lib/` SSR 真实组件，不能只测试 Vite 转换过的 `src/`。
- Base UI Checkbox/Radio/Switch 默认渲染 span/button。DaisyUI checked state 可以通过 `aria-checked` 工作，但 input 专用 size modifier 不一定改变几何，因此 wrapper 同时提供静态可扫描的 `size-*` 或 `h-*/w-*` utility。
