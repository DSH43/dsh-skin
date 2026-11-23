# dsh-skin

给 dsh Web 界面换整套外观：配色、字体、圆角、阴影。通过设计 token 和插件内的局部 CSS 调整设置、侧栏与会话排版。

## 风格

四套，设置里随手切：

| 风格 | 浅色 | 深色 | 字体 | 圆角 | 新会话标题 |
|---|---|---|---|---|---|
| 极简 | 中性灰画布 + 白面板 | 近黑分层 | 跟你的字体设置 | 小（3–16px） | 少，但更好 / Less, but better. |
| 黑客 | 浅灰绿侧栏、近黑字 | 石墨画布、浅灰字、绿色强调 | 跟随界面偏好，代码与品牌信息用等宽 | 克制（2–12px） | `$ hello, world` |
| 写作 | 纸白画布、暖灰侧栏、墨青强调 | 深墨灰画布、雾白字、墨青强调 | 正文宋体，控件跟随界面偏好 | 大（4–20px） | 写下一句真话 / One true sentence. |
| 手绘 | 白纸底 + 纯黑墨线 + 错位实心投影，蓝/粉点缀 | 黑板底 + 白墨线 + 同样的硬投影 | 跟你的字体设置 | 小（3–12px），跟参考图一致 | 先画一条线 / Start with a line. |

导航、设置与输入框沿用宿主的字体偏好。写作风格的会话正文使用宋体。

## 装法

从 GitHub 装：

```bash
dsh plugin --profile web add "github:DSH43/dsh-skin#main"
```

也可以把本目录装进 profile，或者在插件页用「添加插件」指向本地目录。装完刷新页面即可，改 `client.js` 不需要重启。

## 用法

设置 → 常规 → 界面皮肤：

- **开关**：整层皮肤开关，关掉立刻回到 DSH 原样。关着的时候点风格、颜色或圆角会自动打开。
- **风格**：极简 / 黑客 / 写作 / 手绘。切换时强调色会自动落到该风格的第一色。
- **强调色**：每套风格四种。落在发送键、链接、焦点环、选中描边、用户气泡、计划模式底上。
- **圆角半径**：小 / 中 / 大三档，每套风格各有自己的三档数值。
- **行距**：紧凑 / 标准 / 宽松。只改行高不动字号——紧凑把正文从 24px 收到 20px、代码块从 19px 收到 17px，宽松放到 28px 和 22px。标准就是不覆盖，用宿主默认。
- **恢复皮肤默认**：回到极简 + 靛蓝 + 小圆角。已经是默认值时按钮不可点。

如果主题服务没接上，行里会显示一句黄色提示，皮肤不生效。

选择存在浏览器 localStorage（键 `dsh-skin:settings:v2`），换浏览器不跟随。

## 不只是换色

除了 token 层面的配色、字体、圆角、阴影，还有这些：

- **侧栏背景**：黑客用平整的石墨色或浅灰绿区分侧栏与正文；写作用低饱和的纸白与暖灰区分侧栏和正文；手绘只在侧栏品牌区铺淡斜纹。侧栏的 `--dsw-specific-sidebar-fill` 全部用在 `background:` 简写里，塞渐变安全。
- **选取颜色**：选中文字时的高亮跟着强调色走，用 `color-mix` 从 `--dsw-alias-link` 算出来。
- **风格预览**：卡片同时预览画布、侧栏、面板和首选强调色，随当前深浅模式切换。设置面板变窄时，四张卡片排成两列，微调选项纵向排列。
- **侧栏品牌**：四套皮肤共用无底框的标记和双行文字布局。极简用原版鲸鱼，黑客用像素鲸鱼，写作配思考气泡，手绘配贝雷帽。标题用界面字体，版本号用等宽字。版本检查插件继续提供更新提示及详情入口。
- **新会话标题**：落地页那句 `Into the Unknown` 换成每套角色自己的话（见上表，跟随界面语言）。关掉皮肤或换风格立刻换回/换掉，徽章保留。
- **新会话按钮**：展开的侧栏统一使用 38px 高度，图标和文字左对齐。极简用细描边，黑客用强调色竖线，写作微微着色，手绘用实心投影。
- **会话排版**：输入框与正文共用列宽和两侧留白，输入框使用细描边和焦点反馈。标题、正文和完成时长各有自己的字号与间距。

产品图标（工具栏、菜单那些）没换。DSH 只允许通过注册整套主题来换，那样会接管明暗切换，外观那一行也会失去选中状态。换侧栏 logo 走的是槽位，没这个副作用。

本地构建的版本文字保留宿主的复制入口。安装版本检查插件时，点击品牌文字可打开版本详情。

## 手绘那套怎么来的

照 NEO-SKEUO 的规则做，只用中性灰（不带暖色）：描边比常规主题略重但不压人（`--dsw-alias-border-l1..l4` 在 12–32% 不透明），阴影是不带模糊的实心错位投影（`1px 1px 0` 到 `3px 3px 0`），侧栏品牌区铺一层渐隐的 45 度斜纹，字体跟随用户的设置。深色是黑板：纯黑底、白墨线、同样的硬投影。整套只用中性灰，没有暖调；强调色是墨黑、Flickr 蓝、Flickr 粉、灰四档。

这里有个坑：宿主的 `--dsw-elevation-*` 声明在 `body, body *` 上，只覆盖 body 传不到组件。插件另发一份 `--dsk-elevation-*` 私有变量，再用 `body[data-dsh-skin-style] *` 转发，四套风格的阴影才真的落到面板上。

## 改了什么

用 `ctx.theme.overrideTokens()` 在活动主题上叠一层覆盖，每条 token 带浅色、深色两个值，切换明暗自动换：

| 类别 | token |
|---|---|
| 底色和面板 | `--dsw-alias-bg-base`、`bg-layer-1..3`、`bg-overlay`、`bg-module-platform` |
| 侧栏和输入框 | `--dsw-specific-sidebar-fill`、`--dsw-specific-input-major` |
| 卡片和代码块 | `--dsw-alias-card-fill`、`card-fill-hover`、`markdown-code-block`、`markdown-code-block-banner`、`markdown-inline-code` |
| 描边 | `--dsw-alias-border-l1..l4` |
| 文字 | `--dsw-alias-label-primary`、`label-secondary`、`label-tertiary`、`label-caption` |
| 悬停 | `--dsw-alias-interactive-bg-hover`、`interactive-bg-hover-solid` |
| 阴影 | `--dsw-shadow-lv1..3`、`--dsw-elevation-panel/prominent/soft`、`elevation-stroke-color` |
| 圆角 | `--dsw-radius-xs/sm/md/lg/xl/panel` |
| 字体 | 写作风格通过会话正文的局部 CSS 使用宋体 |
| 行距 | `--dsw-font-markdown-base`、`base-strong`、`base-italic`、`small`、`table`、`code`、`code-block` 及其 `-line-height`，只在非标准档覆盖 |
| 强调色 | `--dsw-alias-button-info-fill`、`button-info-hover`、`state-business-primary`、`state-business-tertiary`、`link`、`trajectory-accent`、`brand-primary-new-colorprimary-new-color`、`border-selected`、`--dsw-specific-bubble`、`bubble-highlight`、`sidebar-nav-item-active-accent`、`sidebar-right-flash`、`chart-messages` |

强调色配套的浅色底用 `color-mix` 按当前强调色现算，不写死。

## 关于公式

正文渲染默认开着 KaTeX，`$` 会被当公式定界符。价格、金额写成 `$4.99` 这种，两个美元符号会把中间整段当成公式，结果是不折行、字忽大忽小。KaTeX 的每个字符都是独立的 inline-block，靠 `overflow-wrap` 折不开。DSH 渲染出的公式容器是 `.katex-base`，KaTeX 给它写了 `white-space: nowrap` 和 `width: min-content`，既不折行、又把盒子撑到最长那段。皮肤里把这两条改掉（`display: inline; white-space: normal; width: auto`），字号压到 1.02em，长段就能跟着正文折行。代价是真的写复杂公式时可能被拆行，上下标位置也会飘。写价格时用 `\$` 转义、或者干脆不写美元符号，才是干净的做法。

## 一个宿主行为

会话列是 `overflow: hidden`：内容比列宽时直接裁掉，没有横向滚动条。皮肤里给正文加了 `overflow-wrap: anywhere` 主动找断点，能覆盖大多数长串。如果还有被裁的情况，那是宿主的列宽和裁剪规则决定的，插件只能缓解。

## 边界

- 布局样式限定在皮肤设置、侧栏新会话槽位、会话输入框和正文。侧栏通过宿主槽位和展开态类名的语义片段定位，无需绑定构建哈希。
- 新会话标题只改 `titleGroup` 里那个不带类名的 span（预览徽章是它的兄弟节点）。宿主没给这处文本开槽位，它是 locale 字典里的死文案，所以皮肤靠 DOM 接管：宿主重画、切语言、切到新会话都会重写这句，插件按帧跟回去。宿主哪天把这个类片段改了，这处会静默退回原文，其余皮肤照常。
- 圆角档位影响使用 `--dsw-radius-*` 的控件；宿主自己定义的胶囊和圆点沿用原形。
- 写作风格默认用墨青，也可切换黄铜、印泥红或石墨。
- 黑客风格的绿色只给强调色（发送键、链接、焦点环、选中描边、气泡底），文字和描边是中性灰，绿色描边透明度压到 8–22%。
- 黑客风格把 `--dsw-alias-label-on-color` 改成近黑：荧光绿配白字只有 2:1，终端审美本来就是黑字压磷光。这个 token 只用在发送键图标和上传失败角标。
- 品牌主色 `--dsw-alias-brand-primary` 保持石墨色（logo 和品牌文字用它），主按钮也不跟强调色走：它配的是 `label-primary-foreground`，深色主题下那是近黑色，压在中间调的强调色上对比不够。
- `--dsw-corner-shape` 不动，保留宿主自己的超椭圆圆角曲线，只改半径。
- 覆盖集不完整校验，DSH 改 token 名只会掉那一处效果，不会报错。
- 插件本身不读文件、不发请求、不写 profile。

## 版权

鲸鱼轮廓取自 DeepSeek Harness 的 `@deepseek-ai/dsh-client-ui-primitives`（MIT），配饰由本插件绘制。
