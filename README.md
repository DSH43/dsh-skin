# dsh-skin

给 dsh Web 界面换整套外观：配色、字体、圆角、阴影。只改设计 token，不动 DSH 组件代码。

## 风格

四套，设置里随手切：

| 风格 | 浅色 | 深色 | 字体 | 圆角 |
|---|---|---|---|---|
| 极简 | 中性灰画布 + 白面板 | 近黑分层 | 跟你的字体设置 | 小（3–16px） |
| 黑客 | 淡橄榄纸底、近黑字、绿点缀 | 近黑底、中性灰字、磷光绿只出现在强调处 | 等宽 | 几乎直角（0–4px） |
| 写作 | 暖纸底、米白面板、中性墨字 | 暖褐底、中性浅字 | 宋体 | 大（4–20px） |
| 手绘 | 白纸底 + 纯黑墨线 + 错位实心投影，蓝/粉点缀 | 黑板底 + 白墨线 + 同样的硬投影 | 跟你的字体设置 | 小（3–12px），跟参考图一致 |

黑客和写作会接管 UI 字体，盖掉「字体设置」那一行的选择；极简和二次元不管字体，跟随你的设置。

## 装法

从 GitHub 装：

```bash
dsh plugin --profile web add "github:DSH43/dsh-skin#main"
```

也可以把本目录装进 profile，或者在插件页用「添加插件」指向本地目录。装完刷新页面即可，改 `client.js` 不需要重启。

## 用法

设置 → 常规 → 界面配色与圆角：

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

- **侧栏背景**：黑客是一层扫描线加垂直渐变；写作是纸面渐变；二次元是左上角粉色光晕加粉紫渐变。侧栏的 `--dsw-specific-sidebar-fill` 全部用在 `background:` 简写里，塞渐变安全。
- **输入区背景**：写作和二次元的输入框是轻微渐变，不是纯色。
- **选取颜色**：选中文字时的高亮跟着强调色走，用 `color-mix` 从 `--dsw-alias-link` 算出来。
- **滚动条**：二次元的滚动条染成粉灰，不再是系统默认。
- **风格预览**：设置行里每个风格按钮前面有个小方块，左半是这套风格的画布色、右半是它的首选强调色，不用一个个点开试。
- **侧栏 logo**：注册到 `sidebar.brand.mark` 槽。鲸鱼举一件几乎和图标一样高的道具：黑客一道大闪电、写作一支大羽毛笔、手绘一支小铅笔（笔帽、削尖的木头、笔芯三段分明），极简不举、保持原样。鲸鱼走强调色、道具走正文色，两种颜色分开；手绘是纯黑白，两件东西左右错开不重叠，各自的轮廓都清楚。关掉皮肤会撤掉注册，宿主画回自己的 logo。
- **新会话按钮**：用 `[data-slot="sidebar.session.action"]` 这个稳定属性重做外观，点击行为还是宿主的。四套风格四个形状：极简是 40px 细描边条、黑客是 46px 右缘斜切的终端条（扫描线加左侧亮条）、写作是 48px 底部开 V 口的书签、手绘是 2px 墨线框加实心错位投影（悬停抬起、按下压扁）。内容改成左对齐，不再是居中的方按钮。只在展开的侧栏生效，收起成图标时回到宿主样式。

产品图标（工具栏、菜单那些）没换。DSH 只允许通过注册整套主题来换，那样会接管明暗切换，外观那一行也会失去选中状态。换侧栏 logo 走的是槽位，没这个副作用。

侧栏 logo 换成自己的以后，本地构建下点 logo 复制版本号的行为没了；版本号还在品牌名那一侧，行为不受影响。

## 手绘那套怎么来的

照 NEO-SKEUO 的规则做，只用中性灰（不带暖色）：描边比常规主题略重但不压人（`--dsw-alias-border-l1..l4` 在 12–32% 不透明），阴影是不带模糊的实心错位投影（`1px 1px 0` 到 `3px 3px 0`），侧栏铺一层 45 度斜纹当前纸纹，字体跟随用户的设置，不接管。深色是黑板：纯黑底、白墨线、同样的硬投影。整套只用中性灰，没有暖调；强调色是墨黑、Flickr 蓝、Flickr 粉、灰四档。

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
| 字体 | `--dsw-font-family`（仅黑客和写作） |
| 行距 | `--dsw-font-markdown-base`、`base-strong`、`base-italic`、`small`、`table`、`code`、`code-block` 及其 `-line-height`，只在非标准档覆盖 |
| 强调色 | `--dsw-alias-button-info-fill`、`button-info-hover`、`state-business-primary`、`state-business-tertiary`、`link`、`trajectory-accent`、`brand-primary-new-colorprimary-new-color`、`border-selected`、`--dsw-specific-bubble`、`bubble-highlight`、`sidebar-nav-item-active-accent`、`sidebar-right-flash`、`chart-messages` |

强调色配套的浅色底用 `color-mix` 按当前强调色现算，不写死。

## 关于公式

正文渲染默认开着 KaTeX，`$` 会被当公式定界符。价格、金额写成 `$4.99` 这种，两个美元符号会把中间整段当成公式，结果是不折行、字忽大忽小。KaTeX 的每个字符都是独立的 inline-block，靠 `overflow-wrap` 折不开。DSH 渲染出的公式容器是 `.katex-base`，KaTeX 给它写了 `white-space: nowrap` 和 `width: min-content`，既不折行、又把盒子撑到最长那段。皮肤里把这两条改掉（`display: inline; white-space: normal; width: auto`），字号压到 1.02em，长段就能跟着正文折行。代价是真的写复杂公式时可能被拆行，上下标位置也会飘。写价格时用 `\$` 转义、或者干脆不写美元符号，才是干净的做法。

## 一个宿主行为

会话列是 `overflow: hidden`：内容比列宽时直接裁掉，没有横向滚动条。皮肤里给正文加了 `overflow-wrap: anywhere` 主动找断点，能覆盖大多数长串。如果还有被裁的情况，那是宿主的列宽和裁剪规则决定的，插件只能缓解。

## 边界

- 间距、密度没有 token，这个插件不碰。想改只能注全局 CSS 盖组件类名，构建哈希一变就失效。
- 全圆角的地方（`50%`、`999px` 的胶囊和圆点）跟 `--dsw-radius-*` 无关，保持原样。黑客风格的直角只作用于用 token 的圆角。
- 写作风格的暖色只留在底色和描边上，文字用中性墨色，暖度控制在个位数百分比。整页米黄会累眼。
- 黑客风格的绿色只给强调色（发送键、链接、焦点环、选中描边、气泡底），文字和描边是中性灰，绿色描边透明度压到 8–22%。全绿会晃眼。
- 黑客风格把 `--dsw-alias-label-on-color` 改成近黑：荧光绿配白字只有 2:1，终端审美本来就是黑字压磷光。这个 token 只用在发送键图标和上传失败角标。
- 品牌主色 `--dsw-alias-brand-primary` 保持石墨色（logo 和品牌文字用它），主按钮也不跟强调色走：它配的是 `label-primary-foreground`，深色主题下那是近黑色，压在中间调的强调色上对比不够。
- `--dsw-corner-shape` 不动，保留宿主自己的超椭圆圆角曲线，只改半径。
- 覆盖集不完整校验，DSH 改 token 名只会掉那一处效果，不会报错。
- 插件本身不读文件、不发请求、不写 profile。

## 版权

鲸鱼的轮廓路径取自 DeepSeek Harness 的 `@deepseek-ai/dsh-client-ui-primitives`（MIT），本插件只按风格做描边、填充和配饰处理。
