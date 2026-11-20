/**
 * dsh-skin 客户端模块。
 *
 * 做的事：用 ctx.theme.overrideTokens 在活动主题之上叠一层 token 覆盖，把
 * 界面换成一套完整的外观（配色、字体、圆角、阴影），再往设置 → 常规里注册一行，
 * 能选风格、开关、选强调色、选圆角档、恢复默认。
 *
 * 三套风格：
 *   minimal  中性灰底、无衬线、小圆角（默认）
 *   hacker   荧光绿 + 等宽字体 + 几乎直角，深色是荧光屏，浅色是纸带
 *   writing  暖纸底 + 宋体正文 + 大圆角，深色是夜里读书
 *
 * 只覆盖 token，不碰组件 CSS，也不读别人的 DOM。所以 dsh 升级改了组件结构，
 * 这层皮肤照样生效；只有 token 改名才会掉效果。
 *
 * 选择存在 localStorage（每个浏览器各存各的）。第三方主题 id 过不了设置 schema，
 * 存不进 dsh 自己的设置文档，皮肤是纯前端的东西，localStorage 够用。
 *
 * 整个 apply 包在 try/catch 里：客户端条目应用失败会让界面停在加载页，
 * 一个皮肤不该有这种权力。
 */
window.__ModuleLoader__.load({
  id: 'dsh-skin',
  factory: function (require) {
    var React = require('react')
    var h = React.createElement
    var useEffect = React.useEffect
    var useState = React.useState

    /** 设置行所在的 locale 命名空间。 */
    var NS = 'skin'
    /** token 覆盖层的身份，也就是本插件的包名。 */
    var SOURCE = 'dsh-skin'
    /** 浏览器本地保存键。 */
    var STORE_KEY = 'dsh-skin:settings:v2'

    /** DSH 自己的鲸鱼轮廓（ui-primitives FishLogoPath），viewBox 0 0 23.16 17.04。 */
    var WHALE_PATH = 'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z'

    /** 等宽字体栈，黑客风格用。 */
    var MONO_UI = "'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, Consolas, 'PingFang SC', monospace"
    /** 打字机字体栈，sketch 风格用。 */
    var TYPEWRITER_UI = "'Courier New', Courier, ui-monospace, 'SF Mono', Menlo, monospace"

    /** 衬线字体栈，写作风格用。优先宋体，再退到西文衬线。 */
    var SERIF_UI = "'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif"

    /**
     * 风格表。每套风格自带色板、字体、三档圆角和四个强调色。
     * 深浅两套色板的键必须完全一致，buildTokens 按键配对。
     */
    var STYLES = {
      minimal: {
        name: 'styleMinimal',
        font: null,
        radii: {
          small: { xs: '3px', sm: '5px', md: '7px', lg: '10px', xl: '12px', panel: '16px' },
          medium: { xs: '5px', sm: '8px', md: '11px', lg: '14px', xl: '17px', panel: '20px' },
          large: { xs: '7px', sm: '11px', md: '16px', lg: '21px', xl: '26px', panel: '28px' }
        },
        accents: [
          { id: 'indigo', name: 'accIndigo', light: { fill: '#4B5BD6', hover: '#4150C0', link: '#4553CC' }, dark: { fill: '#4F60DC', hover: '#6070EE', link: '#9AA6FF' } },
          { id: 'teal', name: 'accTeal', light: { fill: '#0F7A6E', hover: '#0C6A60', link: '#0E7A6E' }, dark: { fill: '#12897B', hover: '#17A090', link: '#5AD1BF' } },
          { id: 'amber', name: 'accAmber', light: { fill: '#B45309', hover: '#9A4708', link: '#A54C08' }, dark: { fill: '#B4630A', hover: '#CB790F', link: '#F0B357' } },
          { id: 'graphite', name: 'accGraphite', light: { fill: '#3F444B', hover: '#33373D', link: '#3F444B' }, dark: { fill: '#4A5058', hover: '#575E67', link: '#C9CDD4' } }
        ],
        light: {
          '--dsw-alias-bg-base': '#F2F2F4',
          '--dsw-alias-bg-layer-1': '#FFFFFF',
          '--dsw-alias-bg-layer-2': '#FFFFFF',
          '--dsw-alias-bg-layer-3': '#FFFFFF',
          '--dsw-alias-bg-overlay': '#EDEDEF',
          '--dsw-alias-bg-module-platform': '#F1F1F3',
          '--dsw-specific-sidebar-fill': '#E9EAEC',
          '--dsw-specific-input-major': '#FFFFFF',
          '--dsw-alias-card-fill': '#FFFFFF',
          '--dsw-alias-card-fill-hover': '#F6F6F8',
          '--dsw-alias-markdown-code-block': '#EFEFF1',
          '--dsw-alias-markdown-code-block-banner': '#E9E9EB',
          '--dsw-alias-markdown-inline-code': '#ECECEF',
          '--dsw-alias-border-l1': 'rgba(17, 19, 23, 0.06)',
          '--dsw-alias-border-l2': 'rgba(17, 19, 23, 0.09)',
          '--dsw-alias-border-l3': 'rgba(17, 19, 23, 0.12)',
          '--dsw-alias-border-l4': 'rgba(17, 19, 23, 0.16)',
          '--dsw-alias-label-primary': '#16181B',
          '--dsw-alias-label-secondary': '#5B6068',
          '--dsw-alias-label-tertiary': '#767A82',
          '--dsw-alias-label-caption': '#7F838A',
          '--dsw-alias-interactive-bg-hover': 'rgba(17, 19, 23, 0.045)',
          '--dsw-alias-interactive-bg-hover-solid': '#F0F0F2',
          '--dsw-shadow-lv1': '0 1px 2px rgba(17, 19, 23, 0.05)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(17, 19, 23, 0.04)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(17, 19, 23, 0.06), 0 1px 2px rgba(17, 19, 23, 0.04)',
          '--dsw-shadow-lv3': '0 12px 32px rgba(17, 19, 23, 0.10), 0 2px 8px rgba(17, 19, 23, 0.05)',
          '--dsw-elevation-stroke-color': 'rgba(17, 19, 23, 0.07)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(17, 19, 23, 0.07), 0 2px 8px rgba(17, 19, 23, 0.05)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(17, 19, 23, 0.07), 0 6px 20px rgba(17, 19, 23, 0.08)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(17, 19, 23, 0.07), 0 4px 14px rgba(17, 19, 23, 0.05)'
        },
        dark: {
          '--dsw-alias-bg-base': '#0C0D0F',
          '--dsw-alias-bg-layer-1': '#17191D',
          '--dsw-alias-bg-layer-2': '#1E2125',
          '--dsw-alias-bg-layer-3': '#25282D',
          '--dsw-alias-bg-overlay': '#24272C',
          '--dsw-alias-bg-module-platform': '#1D2024',
          '--dsw-specific-sidebar-fill': '#0F1113',
          '--dsw-specific-input-major': '#1E2226',
          '--dsw-alias-card-fill': '#1B1E22',
          '--dsw-alias-card-fill-hover': '#23272C',
          '--dsw-alias-markdown-code-block': '#141619',
          '--dsw-alias-markdown-code-block-banner': '#1A1D21',
          '--dsw-alias-markdown-inline-code': '#1E2125',
          '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.07)',
          '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.10)',
          '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.14)',
          '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.18)',
          '--dsw-alias-label-primary': '#ECEDEF',
          '--dsw-alias-label-secondary': '#A5AAB2',
          '--dsw-alias-label-tertiary': '#7B818A',
          '--dsw-alias-label-caption': '#6E747C',
          '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#23262B',
          '--dsw-shadow-lv1': '0 1px 2px rgba(0, 0, 0, 0.45)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(0, 0, 0, 0.35)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.35)',
          '--dsw-shadow-lv3': '0 12px 32px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)',
          '--dsw-elevation-stroke-color': 'rgba(255, 255, 255, 0.09)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(255, 255, 255, 0.09), 0 2px 8px rgba(0, 0, 0, 0.45)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(255, 255, 255, 0.09), 0 6px 20px rgba(0, 0, 0, 0.5)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(255, 255, 255, 0.09), 0 4px 14px rgba(0, 0, 0, 0.4)'
        }
      },

      hacker: {
        name: 'styleHacker',
        font: MONO_UI,
        radii: {
          small: { xs: '0px', sm: '0px', md: '1px', lg: '2px', xl: '2px', panel: '4px' },
          medium: { xs: '1px', sm: '2px', md: '3px', lg: '5px', xl: '6px', panel: '8px' },
          large: { xs: '2px', sm: '4px', md: '6px', lg: '9px', xl: '12px', panel: '14px' }
        },
        accents: [
          { id: 'green', name: 'accGreen', light: { fill: '#1FCB6E', hover: '#19B561', link: '#118448' }, dark: { fill: '#1FCE74', hover: '#2BE08A', link: '#4CFFA6' } },
          { id: 'cyan', name: 'accCyan', light: { fill: '#0E9FBF', hover: '#0C8CA9', link: '#0B7D96' }, dark: { fill: '#12B4D6', hover: '#1FC9EC', link: '#4FE3FF' } },
          { id: 'amber', name: 'accAmber', light: { fill: '#B45309', hover: '#9A4708', link: '#A54C08' }, dark: { fill: '#C47610', hover: '#D98A16', link: '#FFB454' } },
          { id: 'steel', name: 'accSteel', light: { fill: '#3F6C8F', hover: '#365D7C', link: '#3A6584' }, dark: { fill: '#6FA6CC', hover: '#86B7D8', link: '#8FC2E0' } }
        ],
        light: {
          '--dsw-alias-bg-base': '#E8EDE6',
          '--dsw-alias-bg-layer-1': '#F4F8F1',
          '--dsw-alias-bg-layer-2': '#F8FBF6',
          '--dsw-alias-bg-layer-3': '#FBFDF9',
          '--dsw-alias-bg-overlay': '#DDE5D9',
          '--dsw-alias-bg-module-platform': '#E3EAE0',
          '--dsw-specific-sidebar-fill': 'repeating-linear-gradient(180deg, rgba(12, 40, 24, 0.045) 0px, rgba(12, 40, 24, 0.045) 1px, transparent 1px, transparent 4px), linear-gradient(180deg, #E3E9DF 0%, #DDE5D9 100%)',
          '--dsw-specific-input-major': '#FAFDF8',
          '--dsw-alias-card-fill': '#F7FBF4',
          '--dsw-alias-card-fill-hover': '#EDF3E9',
          '--dsw-alias-markdown-code-block': '#E4ECE0',
          '--dsw-alias-markdown-code-block-banner': '#D9E3D5',
          '--dsw-alias-markdown-inline-code': '#E1EAD9',
          '--dsw-alias-border-l1': 'rgba(12, 40, 24, 0.09)',
          '--dsw-alias-border-l2': 'rgba(12, 40, 24, 0.12)',
          '--dsw-alias-border-l3': 'rgba(12, 40, 24, 0.16)',
          '--dsw-alias-border-l4': 'rgba(12, 40, 24, 0.20)',
          '--dsw-alias-label-primary': '#131A16',
          '--dsw-alias-label-secondary': '#3F4845',
          '--dsw-alias-label-tertiary': '#5C6662',
          '--dsw-alias-label-caption': '#6E7873',
          '--dsw-alias-label-on-color': '#05140C',
          '--dsw-alias-interactive-bg-hover': 'rgba(12, 40, 24, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#DEE7DA',
          '--dsw-shadow-lv1': '0 1px 2px rgba(12, 40, 24, 0.08)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(12, 40, 24, 0.06)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(12, 40, 24, 0.09), 0 1px 2px rgba(12, 40, 24, 0.06)',
          '--dsw-shadow-lv3': '0 12px 28px rgba(12, 40, 24, 0.14), 0 2px 8px rgba(12, 40, 24, 0.08)',
          '--dsw-elevation-stroke-color': 'rgba(12, 40, 24, 0.12)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(12, 40, 24, 0.12), 0 2px 8px rgba(12, 40, 24, 0.07)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(12, 40, 24, 0.12), 0 6px 20px rgba(12, 40, 24, 0.10)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(12, 40, 24, 0.12), 0 4px 14px rgba(12, 40, 24, 0.07)'
        },
        dark: {
          '--dsw-alias-bg-base': '#05080A',
          '--dsw-alias-bg-layer-1': '#0A1013',
          '--dsw-alias-bg-layer-2': '#0E1619',
          '--dsw-alias-bg-layer-3': '#131C20',
          '--dsw-alias-bg-overlay': '#16211F',
          '--dsw-alias-bg-module-platform': '#0D1517',
          '--dsw-specific-sidebar-fill': 'repeating-linear-gradient(180deg, rgba(140, 205, 170, 0.05) 0px, rgba(140, 205, 170, 0.05) 1px, transparent 1px, transparent 4px), linear-gradient(180deg, #070D0F 0%, #0A1315 100%)',
          '--dsw-specific-input-major': '#0D1518',
          '--dsw-alias-card-fill': '#0C1417',
          '--dsw-alias-card-fill-hover': '#121C20',
          '--dsw-alias-markdown-code-block': '#060E0C',
          '--dsw-alias-markdown-code-block-banner': '#0A1412',
          '--dsw-alias-markdown-inline-code': '#0E1815',
          '--dsw-alias-border-l1': 'rgba(140, 205, 170, 0.08)',
          '--dsw-alias-border-l2': 'rgba(140, 205, 170, 0.12)',
          '--dsw-alias-border-l3': 'rgba(140, 205, 170, 0.16)',
          '--dsw-alias-border-l4': 'rgba(140, 205, 170, 0.22)',
          '--dsw-alias-label-primary': '#D7DDDE',
          '--dsw-alias-label-secondary': '#98A3A5',
          '--dsw-alias-label-tertiary': '#6E797B',
          '--dsw-alias-label-caption': '#636D70',
          '--dsw-alias-label-on-color': '#04120A',
          '--dsw-alias-interactive-bg-hover': 'rgba(200, 230, 215, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#10201A',
          '--dsw-shadow-lv1': '0 0 0 0.5px rgba(140, 205, 170, 0.12)',
          '--dsw-shadow-lv1-blur': '0 4px 12px rgba(0, 0, 0, 0.6)',
          '--dsw-shadow-lv2': '0 0 0 0.5px rgba(140, 205, 170, 0.14), 0 2px 8px rgba(0, 0, 0, 0.55)',
          '--dsw-shadow-lv3': '0 0 0 0.5px rgba(140, 205, 170, 0.18), 0 12px 32px rgba(0, 0, 0, 0.7)',
          '--dsw-elevation-stroke-color': 'rgba(140, 205, 170, 0.14)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(140, 205, 170, 0.14), 0 2px 8px rgba(0, 0, 0, 0.55)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(140, 205, 170, 0.18), 0 6px 20px rgba(0, 0, 0, 0.6)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(140, 205, 170, 0.12), 0 4px 14px rgba(0, 0, 0, 0.5)'
        }
      },

      writing: {
        name: 'styleWriting',
        font: SERIF_UI,
        radii: {
          small: { xs: '4px', sm: '6px', md: '9px', lg: '12px', xl: '15px', panel: '20px' },
          medium: { xs: '6px', sm: '9px', md: '13px', lg: '17px', xl: '21px', panel: '26px' },
          large: { xs: '10px', sm: '14px', md: '20px', lg: '26px', xl: '32px', panel: '36px' }
        },
        accents: [
          { id: 'sepia', name: 'accSepia', light: { fill: '#9A4B2F', hover: '#873F27', link: '#8E452B' }, dark: { fill: '#B85B37', hover: '#CC6B44', link: '#E08A63' } },
          { id: 'forest', name: 'accForest', light: { fill: '#3F5F45', hover: '#36523B', link: '#3A5840' }, dark: { fill: '#4F7355', hover: '#5C8462', link: '#8FB894' } },
          { id: 'brick', name: 'accBrick', light: { fill: '#8E3B2E', hover: '#7B3328', link: '#86382C' }, dark: { fill: '#A85A44', hover: '#BC6C54', link: '#D89A86' } },
          { id: 'ink', name: 'accInk', light: { fill: '#2A2520', hover: '#211D19', link: '#262119' }, dark: { fill: '#4A4238', hover: '#5A5145', link: '#CDBFA8' } }
        ],
        light: {
          '--dsw-alias-bg-base': '#F3EFE7',
          '--dsw-alias-bg-layer-1': '#FFFDF9',
          '--dsw-alias-bg-layer-2': '#FFFEFC',
          '--dsw-alias-bg-layer-3': '#FFFFFF',
          '--dsw-alias-bg-overlay': '#EDE8DE',
          '--dsw-alias-bg-module-platform': '#F1EDE4',
          '--dsw-specific-sidebar-fill': 'linear-gradient(180deg, #F0EBE1 0%, #F4EFE7 100%)',
          '--dsw-specific-input-major': 'linear-gradient(180deg, #FFFDFA 0%, #FBF6EC 100%)',
          '--dsw-alias-card-fill': '#FBF7EF',
          '--dsw-alias-card-fill-hover': '#F5F0E6',
          '--dsw-alias-markdown-code-block': '#F1ECE2',
          '--dsw-alias-markdown-code-block-banner': '#EAE4D8',
          '--dsw-alias-markdown-inline-code': '#EFEAE0',
          '--dsw-alias-border-l1': 'rgba(52, 45, 36, 0.12)',
          '--dsw-alias-border-l2': 'rgba(52, 45, 36, 0.16)',
          '--dsw-alias-border-l3': 'rgba(52, 45, 36, 0.20)',
          '--dsw-alias-border-l4': 'rgba(52, 45, 36, 0.26)',
          '--dsw-alias-label-primary': '#1F1C18',
          '--dsw-alias-label-secondary': '#4E4A43',
          '--dsw-alias-label-tertiary': '#6F6A62',
          '--dsw-alias-label-caption': '#78736B',
          '--dsw-alias-interactive-bg-hover': 'rgba(52, 45, 36, 0.05)',
          '--dsw-alias-interactive-bg-hover-solid': '#EFEAE0',
          '--dsw-shadow-lv1': '0 1px 2px rgba(52, 45, 36, 0.07)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(52, 45, 36, 0.05)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(52, 45, 36, 0.08), 0 1px 2px rgba(52, 45, 36, 0.05)',
          '--dsw-shadow-lv3': '0 12px 30px rgba(52, 45, 36, 0.12), 0 2px 8px rgba(52, 45, 36, 0.07)',
          '--dsw-elevation-stroke-color': 'rgba(52, 45, 36, 0.14)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(52, 45, 36, 0.14), 0 2px 8px rgba(52, 45, 36, 0.06)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(52, 45, 36, 0.14), 0 6px 20px rgba(52, 45, 36, 0.10)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(52, 45, 36, 0.14), 0 4px 14px rgba(52, 45, 36, 0.07)'
        },
        dark: {
          '--dsw-alias-bg-base': '#151310',
          '--dsw-alias-bg-layer-1': '#1D1A16',
          '--dsw-alias-bg-layer-2': '#24211C',
          '--dsw-alias-bg-layer-3': '#2C2823',
          '--dsw-alias-bg-overlay': '#29251F',
          '--dsw-alias-bg-module-platform': '#221F1A',
          '--dsw-specific-sidebar-fill': 'linear-gradient(180deg, #131110 0%, #17140F 100%)',
          '--dsw-specific-input-major': 'linear-gradient(180deg, #211E19 0%, #1C1915 100%)',
          '--dsw-alias-card-fill': '#1F1C17',
          '--dsw-alias-card-fill-hover': '#272319',
          '--dsw-alias-markdown-code-block': '#181614',
          '--dsw-alias-markdown-code-block-banner': '#201D18',
          '--dsw-alias-markdown-inline-code': '#221F1A',
          '--dsw-alias-border-l1': 'rgba(230, 222, 205, 0.10)',
          '--dsw-alias-border-l2': 'rgba(230, 222, 205, 0.14)',
          '--dsw-alias-border-l3': 'rgba(230, 222, 205, 0.18)',
          '--dsw-alias-border-l4': 'rgba(230, 222, 205, 0.24)',
          '--dsw-alias-label-primary': '#ECE7DE',
          '--dsw-alias-label-secondary': '#ADA69A',
          '--dsw-alias-label-tertiary': '#8C857A',
          '--dsw-alias-label-caption': '#7C7569',
          '--dsw-alias-interactive-bg-hover': 'rgba(230, 222, 205, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#29251F',
          '--dsw-shadow-lv1': '0 1px 2px rgba(0, 0, 0, 0.4)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(0, 0, 0, 0.3)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
          '--dsw-shadow-lv3': '0 12px 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35)',
          '--dsw-elevation-stroke-color': 'rgba(230, 222, 205, 0.12)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(230, 222, 205, 0.12), 0 2px 8px rgba(0, 0, 0, 0.4)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(230, 222, 205, 0.16), 0 6px 20px rgba(0, 0, 0, 0.45)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(230, 222, 205, 0.10), 0 4px 14px rgba(0, 0, 0, 0.35)'
        }
      },

      sketch: {
        name: 'styleSketch',
        font: TYPEWRITER_UI,
        radii: {
          small: { xs: '3px', sm: '4px', md: '6px', lg: '8px', xl: '10px', panel: '12px' },
          medium: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '14px', panel: '16px' },
          large: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '20px', panel: '24px' }
        },
        accents: [
          { id: 'ink', name: 'accInkPen', light: { fill: '#111111', hover: '#2B2B2B', link: '#111111' }, dark: { fill: '#F5F5F5', hover: '#FFFFFF', link: '#F5F5F5' } },
          { id: 'blue', name: 'accBlue', light: { fill: '#0063DC', hover: '#0055BE', link: '#0055BE' }, dark: { fill: '#4D9EFF', hover: '#6FB2FF', link: '#6FB2FF' } },
          { id: 'pink', name: 'accPink', light: { fill: '#E8007A', hover: '#D6006F', link: '#D6006F' }, dark: { fill: '#FF5CA8', hover: '#FF7AB8', link: '#FF7AB8' } },
          { id: 'slate', name: 'accSlate', light: { fill: '#5A5A5A', hover: '#494949', link: '#5A5A5A' }, dark: { fill: '#ADADAD', hover: '#C4C4C4', link: '#ADADAD' } }
        ],
        light: {
          '--dsw-alias-bg-base': '#F4F4F4',
          '--dsw-alias-bg-layer-1': '#FFFFFF',
          '--dsw-alias-bg-layer-2': '#FFFFFF',
          '--dsw-alias-bg-layer-3': '#FFFFFF',
          '--dsw-alias-bg-overlay': '#EDEDED',
          '--dsw-alias-bg-module-platform': '#E8E8E8',
          '--dsw-specific-sidebar-fill': 'repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.045) 0 1px, transparent 1px 6px), linear-gradient(180deg, #F2F2F2 0%, #ECECEC 100%)',
          '--dsw-specific-input-major': '#FFFFFF',
          '--dsw-alias-card-fill': '#FFFFFF',
          '--dsw-alias-card-fill-hover': '#F2F2F2',
          '--dsw-alias-markdown-code-block': '#F2F2F2',
          '--dsw-alias-markdown-code-block-banner': '#E9E9E9',
          '--dsw-alias-markdown-inline-code': '#EFEFEF',
          '--dsw-alias-border-l1': 'rgba(0, 0, 0, 0.12)',
          '--dsw-alias-border-l2': 'rgba(0, 0, 0, 0.16)',
          '--dsw-alias-border-l3': 'rgba(0, 0, 0, 0.22)',
          '--dsw-alias-border-l4': 'rgba(0, 0, 0, 0.30)',
          '--dsw-alias-label-primary': '#111111',
          '--dsw-alias-label-secondary': '#3A3A3A',
          '--dsw-alias-label-tertiary': '#666666',
          '--dsw-alias-label-caption': '#757575',
          '--dsw-alias-label-on-color': '#FFFFFF',
          '--dsw-alias-interactive-bg-hover': 'rgba(0, 0, 0, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#E8E8E8',
          '--dsw-shadow-lv1': '1px 1px 0 rgba(0, 0, 0, 0.12)',
          '--dsw-shadow-lv1-blur': '2px 2px 0 rgba(0, 0, 0, 0.10)',
          '--dsw-shadow-lv2': '2px 2px 0 rgba(0, 0, 0, 0.14)',
          '--dsw-shadow-lv3': '3px 3px 0 rgba(0, 0, 0, 0.16)',
          '--dsw-elevation-stroke-color': 'rgba(0, 0, 0, 0.16)',
          '--dsw-elevation-panel': '1px 1px 0 rgba(0, 0, 0, 0.14)',
          '--dsw-elevation-prominent': '2px 2px 0 rgba(0, 0, 0, 0.16)',
          '--dsw-elevation-soft': '1px 1px 0 rgba(0, 0, 0, 0.12)'
        },
        dark: {
          '--dsw-alias-bg-base': '#121212',
          '--dsw-alias-bg-layer-1': '#1C1C1C',
          '--dsw-alias-bg-layer-2': '#242424',
          '--dsw-alias-bg-layer-3': '#2C2C2C',
          '--dsw-alias-bg-overlay': '#2E2E2E',
          '--dsw-alias-bg-module-platform': '#202020',
          '--dsw-specific-sidebar-fill': 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 6px), linear-gradient(180deg, #181818 0%, #111111 100%)',
          '--dsw-specific-input-major': '#1F1F1F',
          '--dsw-alias-card-fill': '#1C1C1C',
          '--dsw-alias-card-fill-hover': '#242424',
          '--dsw-alias-markdown-code-block': '#181818',
          '--dsw-alias-markdown-code-block-banner': '#202020',
          '--dsw-alias-markdown-inline-code': '#232323',
          '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.14)',
          '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.18)',
          '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.24)',
          '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.32)',
          '--dsw-alias-label-primary': '#F2F2F2',
          '--dsw-alias-label-secondary': '#C0C0C0',
          '--dsw-alias-label-tertiary': '#969696',
          '--dsw-alias-label-caption': '#868686',
          '--dsw-alias-label-on-color': '#121212',
          '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.08)',
          '--dsw-alias-interactive-bg-hover-solid': '#242424',
          '--dsw-shadow-lv1': '1px 1px 0 rgba(0, 0, 0, 0.45)',
          '--dsw-shadow-lv1-blur': '2px 2px 0 rgba(0, 0, 0, 0.4)',
          '--dsw-shadow-lv2': '2px 2px 0 rgba(0, 0, 0, 0.45)',
          '--dsw-shadow-lv3': '3px 3px 0 rgba(0, 0, 0, 0.5)',
          '--dsw-elevation-stroke-color': 'rgba(255, 255, 255, 0.18)',
          '--dsw-elevation-panel': '1px 1px 0 rgba(0, 0, 0, 0.45)',
          '--dsw-elevation-prominent': '2px 2px 0 rgba(0, 0, 0, 0.5)',
          '--dsw-elevation-soft': '1px 1px 0 rgba(0, 0, 0, 0.4)'
        }
      }
    }

    /** 默认值。 */
    var DEFAULTS = { enabled: true, style: 'minimal', accent: 'indigo', radius: 'small' }

    /**
     * 强调色落点。发送键用 info-fill，配的是白字，深浅两套都成立；
     * 主按钮（button-primary-fill）不能动：它配 label-primary-foreground，
     * 深色主题下那是近黑色，压在中间调的强调色上只剩 2-4:1。
     * 品牌主色 --dsw-alias-brand-primary 也不动，它管 logo 和品牌文字。
     */
    var ACCENT_FILL_TOKENS = ['--dsw-alias-button-info-fill']
    var ACCENT_FILL_HOVER_TOKENS = ['--dsw-alias-button-info-hover']
    var ACCENT_LINK_TOKENS = [
      '--dsw-alias-state-business-primary',
      '--dsw-alias-link',
      '--dsw-alias-trajectory-accent',
      '--dsw-alias-brand-primary-new-colorprimary-new-color',
      '--dsw-specific-sidebar-right-flash',
      '--dsw-alias-chart-messages',
      '--dsw-alias-border-selected'
    ]

    /** 设置行和控件文案。 */
    var STRINGS = {
      zh: {
        title: '界面配色与圆角',
        description: '整套外观：配色、字体、圆角、阴影。只对当前浏览器生效。',
        style: '风格',
        accent: '强调色',
        radius: '圆角半径',
        radiusSmall: '小',
        radiusMedium: '中',
        radiusLarge: '大',
        toggle: '启用皮肤',
        reset: '恢复皮肤默认',
        noTheme: '没接上 dsh 的主题服务，皮肤暂时不生效。',
        styleMinimal: '极简',
        styleHacker: '黑客',
        styleWriting: '写作',
        styleSketch: '手绘',
        accIndigo: '靛蓝',
        accTeal: '青绿',
        accAmber: '琥珀',
        accGraphite: '石墨',
        accGreen: '荧光绿',
        accCyan: '电子青',
        accSteel: '钢蓝',
        accSepia: '赭石',
        accForest: '墨绿',
        accBrick: '砖红',
        accInk: '墨',
        accInkPen: '墨',
        accBlue: '蓝',
        accPink: '粉',
        accSlate: '灰',
        accSage: '苔绿'
      },
      en: {
        title: 'Colors & corners',
        description: 'One whole look: colors, fonts, corners, and shadows. Applies to this browser only.',
        style: 'Style',
        accent: 'Accent',
        radius: 'Corner radius',
        radiusSmall: 'Small',
        radiusMedium: 'Medium',
        radiusLarge: 'Large',
        toggle: 'Enable skin',
        reset: 'Reset skin defaults',
        noTheme: 'The dsh theme service is unavailable, so the skin is not applied.',
        styleMinimal: 'Minimal',
        styleHacker: 'Terminal',
        styleWriting: 'Editorial',
        styleSketch: 'Sketch',
        accIndigo: 'Indigo',
        accTeal: 'Teal',
        accAmber: 'Amber',
        accGraphite: 'Graphite',
        accGreen: 'Phosphor',
        accCyan: 'Cyan',
        accSteel: 'Steel blue',
        accSepia: 'Sepia',
        accForest: 'Forest',
        accBrick: 'Brick',
        accInk: 'Ink',
        accInkPen: 'Ink',
        accBlue: 'Blue',
        accPink: 'Pink',
        accSlate: 'Slate',
        accSage: 'Sage'
      }
    }

    /** 设置行样式。全部走主题 token，跟随深浅色。 */
    var CSS = [
      '.dsk-row { display: flex; flex-direction: column; gap: 8px; padding: 16px 0; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }',
      '.dsk-head { display: flex; align-items: center; gap: 8px; }',
      '.dsk-title { font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary); }',
      '.dsk-desc { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }',
      '.dsk-warn { font-size: 12px; line-height: 18px; color: color-mix(in srgb, var(--dsw-alias-state-warn-label) 65%, var(--dsw-alias-label-primary)); }',
      '.dsk-body { display: flex; flex-direction: column; gap: 8px; }',
      '.dsk-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
      '.dsk-label { min-width: 104px; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }',
      '.dsk-pv { width: 12px; height: 12px; border-radius: 3px; background: var(--dsk-pv-light); box-shadow: inset 0 0 0 0.5px rgba(127, 127, 127, 0.35); }',
      'body[data-ds-dark-theme] .dsk-pv { background: var(--dsk-pv-dark); }',
      '.dsk-swatch { box-sizing: border-box; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: var(--dsk-fill); box-shadow: inset 0 0 0 0.5px rgba(127, 127, 127, 0.35); cursor: pointer; outline-offset: 2px; }',
      'body[data-ds-dark-theme] .dsk-swatch { background: var(--dsk-fill-dark); }',
      '@media (hover: hover) { .dsk-swatch:hover { box-shadow: inset 0 0 0 0.5px rgba(127, 127, 127, 0.35), 0 0 0 3px var(--dsw-alias-interactive-bg-hover-accent); } }',
      '.dsk-swatch[aria-pressed="true"] { outline: 1.5px solid var(--dsw-alias-label-primary); }',
      'body[data-dsh-skin-style] ::selection { background: color-mix(in srgb, var(--dsw-alias-link) 26%, transparent); }',
      '.dsk-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-sm); background: transparent; font: inherit; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); cursor: pointer; }',
      '.dsk-chip[aria-pressed="true"] { background: var(--dsw-alias-bg-module-platform); border-color: var(--dsw-alias-border-selected); color: var(--dsw-alias-label-primary); }',
      '@media (hover: hover) { .dsk-chip:hover { background: var(--dsw-alias-interactive-bg-hover); } }',
      '.dsk-switch { position: relative; margin-left: auto; width: 32px; height: 18px; padding: 0; border: 0; border-radius: 999px; background: var(--dsw-alias-state-idle-primary); cursor: pointer; transition: background-color 150ms ease; }',
      '.dsk-switch[aria-checked="true"] { background: var(--dsw-alias-button-info-fill); }',
      '.dsk-knob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 150ms ease; }',
      '.dsk-switch[aria-checked="true"] .dsk-knob { transform: translateX(14px); }',
      '.dsk-reset { align-self: flex-start; padding: 4px 0; border: 0; background: transparent; font: inherit; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); cursor: pointer; }',
      '.dsk-reset:disabled { opacity: 0.5; cursor: default; }',
      '@media (hover: hover) { .dsk-reset:hover:not(:disabled) { color: var(--dsw-alias-label-primary); } }',
      '.dsk-off .dsk-body { opacity: 0.7; }',
      'body[data-dsh-skin-style], body[data-dsh-skin-style] * { --dsw-elevation-stroke: 0 0 0 0.5px var(--dsk-elevation-stroke-color); --dsw-elevation-panel: var(--dsk-elevation-panel); --dsw-elevation-prominent: var(--dsk-elevation-prominent); --dsw-elevation-soft: var(--dsk-elevation-soft); }',
      'body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button { transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, color 150ms ease; }',
      'body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) { height: 46px; align-items: center; padding: 0 14px; }',
      'body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) [class*="newSessionContent"] { justify-content: flex-start; width: auto; flex: 1; gap: 8px; }',
      'body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):active { transform: translateY(1px); }',
      'body[data-dsh-skin-style="minimal"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) { height: 40px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-md); background: transparent; color: var(--dsw-alias-label-secondary); font-weight: 400; }',
      '@media (hover: hover) { body[data-dsh-skin-style="minimal"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):hover { background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-primary); } }',
      'body[data-dsh-skin-style="hacker"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) { height: 46px; border: 0; border-radius: 0; clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%); letter-spacing: 0.1em; font-weight: 600; color: var(--dsw-alias-link); background: repeating-linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-link) 10%, transparent) 0 1px, transparent 1px 4px), var(--dsw-alias-bg-layer-1); box-shadow: inset 3px 0 0 var(--dsw-alias-link); }',
      '@media (hover: hover) { body[data-dsh-skin-style="hacker"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):hover { box-shadow: inset 3px 0 0 var(--dsw-alias-link), inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-link) 45%, transparent); } }',
      'body[data-dsh-skin-style="writing"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) { height: 48px; border: 0; border-radius: 6px 6px 0 0; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), 50% 100%, 0 calc(100% - 10px)); letter-spacing: 0.03em; font-weight: 600; color: var(--dsw-alias-label-primary); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-link) 12%, var(--dsw-alias-bg-layer-1)), var(--dsw-alias-bg-layer-1)); }',
      '@media (hover: hover) { body[data-dsh-skin-style="writing"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):hover { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-link) 20%, var(--dsw-alias-bg-layer-1)), var(--dsw-alias-bg-layer-1)); } }',
      'body[data-dsh-skin-style="sketch"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]) { height: 44px; border: 1.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 2px 2px 0 var(--dsw-alias-border-l3); letter-spacing: 0.05em; font-weight: 700; }',
      '@media (hover: hover) { body[data-dsh-skin-style="sketch"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); } }',
      'body[data-dsh-skin-style="sketch"] [data-slot="sidebar.session.action"] button:has([class*="newSessionLabel"]):active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--dsw-alias-border-l3); }',
      '@media (prefers-reduced-motion: reduce) { body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button::after { animation: none; } }',
    ].join('\n')

    /** 出错只报告，不向外抛：抛出去就是整页停在加载页。 */
    function report(error) {
      try {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-skin]', error)
        }
      } catch {
        // 报告本身失败也无所谓，不做事
      }
    }

    /** @param {Array<object>} list @param {string} id @returns {object|null} */
    function findById(list, id) {
      for (var index = 0; index < list.length; index += 1) {
        if (list[index].id === id) return list[index]
      }
      return null
    }

    /**
     * 把任意来源的选择收成一份合法值：风格不存在回默认，强调色不属于当前
     * 风格就落到该风格第一个，圆角档不存在回默认。
     * @param {object} value
     * @returns {{ enabled: boolean, style: string, accent: string, radius: string }}
     */
    function normalizeSettings(value) {
      var styleId = STYLES[value.style] === undefined ? DEFAULTS.style : value.style
      var style = STYLES[styleId]
      var accent = findById(style.accents, value.accent) || style.accents[0]
      var radius = style.radii[value.radius] === undefined ? DEFAULTS.radius : value.radius
      return {
        enabled: value.enabled === false ? false : true,
        style: styleId,
        accent: accent.id,
        radius: radius
      }
    }

    /** 读本地保存的选择；读不出来或值不认识就回默认。 */
    function readSettings() {
      var saved = null
      try {
        saved = window.localStorage.getItem(STORE_KEY)
      } catch (error) {
        saved = null
      }
      var raw = { enabled: DEFAULTS.enabled, style: DEFAULTS.style, accent: DEFAULTS.accent, radius: DEFAULTS.radius }
      if (saved === null || saved === undefined || saved === '') return normalizeSettings(raw)
      var parsed
      try {
        parsed = JSON.parse(saved)
      } catch (error) {
        return normalizeSettings(raw)
      }
      if (parsed === null || typeof parsed !== 'object') return normalizeSettings(raw)
      if (parsed.enabled === true || parsed.enabled === false) raw.enabled = parsed.enabled
      if (typeof parsed.style === 'string') raw.style = parsed.style
      if (typeof parsed.accent === 'string') raw.accent = parsed.accent
      if (typeof parsed.radius === 'string') raw.radius = parsed.radius
      return normalizeSettings(raw)
    }

    /** 写本地保存；写不进去就算了，本次会话照样生效。 */
    function writeSettings(value) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(value))
      } catch (error) {
        report(error)
      }
    }

    /** 当前选择。模块级一份，设置行和 token 层共用。 */
    var settings = readSettings()
    /** 设置行的订阅者。 */
    var listeners = []
    /** 主题就绪后挂上的应用函数；没就绪时是 null。 */
    var applier = null
    /** 当前挂着的 token 覆盖层撤销函数。 */
    var disposeLayer = null
    /** 主题服务的接线状态，给设置行画一句提示用。 */
    var runtime = { ready: false, settled: false }

    /** 订阅设置变化，返回退订函数。 */
    function subscribe(listener) {
      listeners.push(listener)
      return function () {
        var index = listeners.indexOf(listener)
        if (index >= 0) listeners.splice(index, 1)
      }
    }

    /** 通知设置行重画。 */
    function emit() {
      var snapshot = listeners.slice()
      for (var index = 0; index < snapshot.length; index += 1) {
        try {
          snapshot[index]()
        } catch (error) {
          report(error)
        }
      }
    }

    /** 把强调色按比例混进底色，得到一块同色系的浅底。 */
    function tint(color, weight, base) {
      return 'color-mix(in srgb, ' + color + ' ' + weight + '%, ' + base + ')'
    }

    /**
     * 把一份选择翻成 overrideTokens 要的形状：每个 token 一对 light/dark。
     * 圆角和字体跟明暗无关，两边填同一个值。
     * @param {{ style: string, accent: string, radius: string }} value
     * @returns {Record<string, { light: string, dark: string }>}
     */
    function buildTokens(value) {
      var style = STYLES[value.style] || STYLES[DEFAULTS.style]
      var accent = findById(style.accents, value.accent) || style.accents[0]
      var radii = style.radii[value.radius] || style.radii.small
      var out = {}
      var name
      for (name in style.light) {
        if (!Object.prototype.hasOwnProperty.call(style.light, name)) continue
        out[name] = { light: style.light[name], dark: style.dark[name] || style.light[name] }
      }
      for (var index = 0; index < ACCENT_FILL_TOKENS.length; index += 1) {
        out[ACCENT_FILL_TOKENS[index]] = { light: accent.light.fill, dark: accent.dark.fill }
      }
      for (var hover = 0; hover < ACCENT_FILL_HOVER_TOKENS.length; hover += 1) {
        out[ACCENT_FILL_HOVER_TOKENS[hover]] = { light: accent.light.hover, dark: accent.dark.hover }
      }
      for (var link = 0; link < ACCENT_LINK_TOKENS.length; link += 1) {
        out[ACCENT_LINK_TOKENS[link]] = { light: accent.light.link, dark: accent.dark.link }
      }
      for (name in radii) {
        if (!Object.prototype.hasOwnProperty.call(radii, name)) continue
        out['--dsw-radius-' + name] = { light: radii[name], dark: radii[name] }
      }
      // 字体接管：风格自己定 UI 字体（写作是宋体，黑客是等宽）。
      // 写在 token 层里，会盖掉「字体设置」行里的选择——这是风格的代价。
      if (style.font !== null) {
        out['--dsw-font-family'] = { light: style.font, dark: style.font }
      }
      // 强调色配套的浅色底（用户气泡、计划模式底、导航选中底）。不换这几个，
      // 聊天里最大的那块有色面会永远是淡蓝色。宿主本身大量用 color-mix，基线支持。
      var lightBase = style.light['--dsw-alias-bg-layer-2']
      var darkBase = style.dark['--dsw-alias-bg-layer-2']
      out['--dsw-alias-state-business-tertiary'] = {
        light: tint(accent.light.fill, 10, lightBase),
        dark: tint(accent.dark.fill, 22, darkBase)
      }
      out['--dsw-specific-bubble'] = {
        light: tint(accent.light.fill, 8, lightBase),
        dark: tint(accent.dark.fill, 16, darkBase)
      }
      out['--dsw-specific-bubble-highlight'] = {
        light: tint(accent.light.fill, 16, lightBase),
        dark: tint(accent.dark.fill, 28, darkBase)
      }
      out['--dsw-specific-sidebar-nav-item-active-accent'] = {
        light: tint(accent.light.fill, 10, lightBase),
        dark: tint(accent.dark.fill, 20, darkBase)
      }
      // 宿主的 --dsw-elevation-* 是声明在 body, body * 上的，只覆盖 body 传不到组件；
      // 这里另发一份 --dsk-* 私有变量，由样式表转发到每个元素。
      var forwarded = ['--dsw-elevation-panel', '--dsw-elevation-prominent', '--dsw-elevation-soft', '--dsw-elevation-stroke-color']
      for (var index2 = 0; index2 < forwarded.length; index2 += 1) {
        var key = forwarded[index2]
        var privateName = '--dsk' + key.slice(5)
        out[privateName] = { light: style.light[key], dark: style.dark[key] || style.light[key] }
      }
      return out
    }

    /** 改选择：规范化、存盘、重挂 token 层、通知设置行。 */
    function update(patch) {
      var next = normalizeSettings({
        enabled: patch.enabled === undefined ? settings.enabled : patch.enabled,
        style: patch.style === undefined ? settings.style : patch.style,
        accent: patch.accent === undefined ? settings.accent : patch.accent,
        radius: patch.radius === undefined ? settings.radius : patch.radius
      })
      settings = next
      writeSettings(settings)
      if (applier !== null) {
        try {
          applier()
        } catch (error) {
          report(error)
        }
      }
      emit()
    }

    /**
     * 在 body 上打一个风格标记，给样式表按风格选规则用（现在是选取色）。
     * 用属性不用类名：宿主不认这个属性，不会跟它的样式打架。
     */
    function syncAttribute() {
      try {
        if (typeof document === 'undefined' || document.body === null) return
        if (settings.enabled) document.body.setAttribute('data-dsh-skin-style', settings.style)
        else document.body.removeAttribute('data-dsh-skin-style')
      } catch (error) {
        report(error)
      }
    }

    /** 撤掉当前 token 层。 */
    function clearLayer() {
      if (disposeLayer === null) return
      try {
        disposeLayer()
      } catch (error) {
        report(error)
      }
      disposeLayer = null
    }

    /**
     * 接上主题服务：换肤就是叠一层 token 覆盖，停用就是把这一层撤掉。
     * 每次重挂前先撤旧的，避免同一 source 反复替换留下残值。
     * @param {object} theme ctx.theme 服务
     */
    function installApplier(theme) {
      applier = function () {
        clearLayer()
        syncAttribute()
        if (!settings.enabled) return
        disposeLayer = theme.overrideTokens(SOURCE, buildTokens(settings))
      }
      applier()
    }

    /** 插件停用时撤掉 token 层，不让皮肤留到下次刷新。 */
    function detach() {
      clearLayer()
      applier = null
      runtime.ready = false
      try {
        if (brandDisposer !== null) brandDisposer()
      } catch (error) {
        report(error)
      }
      brandDisposer = null
      brandApi = null
      brandReady = false
      try {
        if (typeof document !== 'undefined' && document.body !== null) document.body.removeAttribute('data-dsh-skin-style')
      } catch (error) {
        report(error)
      }
    }

    /** 读主题服务；拿不到或形状不对就返回 null。 */
    function lookupTheme(ctx) {
      try {
        var theme = typeof ctx.get === 'function' ? ctx.get('theme') : ctx.theme
        if (theme !== null && theme !== undefined && typeof theme.overrideTokens === 'function') return theme
      } catch (error) {
        report(error)
      }
      return null
    }

    /** 接上主题服务并把当前选择挂上去；重复调用只生效一次。 */
    function attachTheme(theme) {
      runtime.ready = true
      runtime.settled = true
      if (applier !== null) return
      installApplier(theme)
      emit()
    }

    /**
     * 等主题服务出现。ui-theme 是 immediate 加载的，正常这里立刻就能拿到；
     * 拿不到就短轮询约 3 秒，并顺手挂一个 ctx.inject 当快通道。
     * 两条路都走不通时把状态标成 settled，设置行会显示一句提示。
     */
    function waitForTheme(ctx) {
      var immediate = lookupTheme(ctx)
      if (immediate !== null) {
        attachTheme(immediate)
        return
      }
      var tries = 0
      var timer = setInterval(function () {
        tries += 1
        var found = lookupTheme(ctx)
        if (found !== null) {
          clearInterval(timer)
          attachTheme(found)
          return
        }
        if (tries >= 25) {
          clearInterval(timer)
          runtime.settled = true
          emit()
          report(new Error('theme service unavailable after 3s'))
        }
      }, 120)
      try {
        ctx.effect(function () {
          return function () {
            clearInterval(timer)
          }
        }, 'dsh-skin: theme retry timer')
      } catch (error) {
        report(error)
      }
      if (typeof ctx.inject !== 'function') return
      try {
        ctx.inject(['theme'], function (scope) {
          var injected = lookupTheme(scope)
          if (injected === null) return
          clearInterval(timer)
          attachTheme(injected)
        })
      } catch (error) {
        report(error)
      }
    }

    /** 拉一次设置行样式，卸载时移除。 */
    function ensureStyle(ctx) {
      ctx.effect(function () {
        var style = document.createElement('style')
        style.setAttribute('data-dsh-skin', '')
        style.textContent = CSS
        document.head.appendChild(style)
        return function () {
          style.remove()
        }
      }, 'dsh-skin: settings row styles')
    }

    /** 当前界面语言，用来挑兜底词典（locale 服务没接上时用）。 */
    function detectLang() {
      var lang = ''
      try {
        lang = typeof document === 'undefined' ? '' : String(document.documentElement.lang || '')
      } catch (error) {
        lang = ''
      }
      return lang.indexOf('zh') === 0 ? 'zh' : 'en'
    }

    /** 取翻译函数：优先用槽位塞进来的 t，没有就自己查。 */
    function bindT(props) {
      if (props !== null && props !== undefined && typeof props.t === 'function') return props.t
      var dict = STRINGS[detectLang()] || STRINGS.en
      return function (key) {
        if (dict[key] !== undefined) return dict[key]
        if (STRINGS.en[key] !== undefined) return STRINGS.en[key]
        return key
      }
    }

    /** 鲸鱼缩进徽章后的缩放和左边距：等比缩到 18 宽。 */
    var WHALE_SCALE = 0.777
    var WHALE_LEFT = 3

    /**
     * 侧栏品牌标记：鲸鱼举一件大道具。
     * 道具和鲸鱼用两种颜色，重叠也不会糊成一团：鲸鱼走强调色，道具走正文色。
     * 道具画在鲸鱼上层，看起来是举在身前。极简不举东西。
     */
    function BrandMark(props) {
      var size = props !== null && props !== undefined && typeof props.size === 'number' ? props.size : 24
      var pair = useState(settings)
      useEffect(function () {
        return subscribe(function () {
          pair[1](Object.assign({}, settings))
        })
      }, [])
      var styleId = pair[0].style
      var ink = 'var(--dsw-alias-link)'
      var propInk = 'var(--dsw-alias-label-primary)'

      if (styleId === 'minimal') {
        return h('svg', {
          viewBox: '0 0 23.16 17.04',
          width: size,
          height: (size * 17.04) / 23.16,
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block' }
        }, h('path', { d: WHALE_PATH, fill: 'var(--dsw-alias-label-primary)' }))
      }

      // 手绘：不拿道具，画成涂鸦——淡色填充、墨线勾边、头顶两道喷气。
      if (styleId === 'sketch') {
        return h('svg', {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block' }
        }, [
          h('path', {
            key: 'whale',
            d: WHALE_PATH,
            transform: 'translate(2.4 5.2) scale(0.84)',
            fill: ink,
            fillOpacity: 0.22,
            stroke: propInk,
            strokeWidth: 1.6,
            strokeLinejoin: 'round'
          }),
          h('path', { key: 'spout-1', d: 'M6.6 5.0 C6.2 3.8 6.8 3.0 7.4 2.6', stroke: propInk, strokeWidth: 1.1, strokeLinecap: 'round', fill: 'none' }),
          h('path', { key: 'spout-2', d: 'M8.6 4.6 C8.4 3.4 9.0 2.6 9.6 2.2', stroke: propInk, strokeWidth: 1.1, strokeLinecap: 'round', fill: 'none' })
        ])
      }

      var prop
      if (styleId === 'hacker') {
        // 一道大闪电，从左下劈到右上
        prop = h('path', {
          key: 'bolt',
          d: 'M5.6 0.8 L1.4 10.6 H4.4 L2.8 17.6 L8.4 7.6 H5.4 Z',
          fill: propInk
        })
      } else if (styleId === 'writing') {
        // 一支大羽毛笔，笔尖在左下
        prop = h('g', { key: 'quill' },
          h('path', { d: 'M1.8 18.6 C2.2 11.6 4.8 4.6 8.8 1.4 C9.2 8.4 6.6 15.4 1.8 18.6 Z', fill: propInk }),
          h('path', { d: 'M2.4 17.4 C4.2 12.4 6.4 7.4 8.6 2.6', stroke: 'var(--dsw-alias-bg-layer-1)', strokeWidth: 1.1, fill: 'none' })
        )
      } else {
        // 兜底：不该走到这里
        prop = null
      }

      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        focusable: 'false',
        style: { display: 'block' }
      }, [
        h('g', { key: 'whale', transform: 'translate(6.6 10.0) scale(0.73)' },
          h('path', { d: WHALE_PATH, fill: ink })),
        prop
      ])
    }

    /** 侧栏品牌槽的服务和当前注册句柄。 */
    var brandApi = null
    var brandReady = false
    var brandDisposer = null

    /** 按开关状态挂上或撤掉品牌标记；撤掉后宿主会画回自己的 logo。 */
    function syncBrand() {
      if (!brandReady || brandApi === null) return
      try {
        if (settings.enabled && brandDisposer === null) {
          brandDisposer = brandApi.register({ name: 'sidebar.brand.mark' }, BrandMark)
          return
        }
        if (!settings.enabled && brandDisposer !== null) {
          brandDisposer()
          brandDisposer = null
        }
      } catch (error) {
        report(error)
        brandDisposer = null
      }
    }

    /** 设置行：开关、风格、强调色、圆角、恢复默认。 */
    function SkinRow(props) {
      var t = bindT(props)
      var pair = useState(settings)
      var current = pair[0]
      useEffect(function () {
        return subscribe(function () {
          // 必须给新引用：runtime 变了但 settings 引用没变时，React 会直接
          // bail out，那句「没接上主题」就永远不出来。
          pair[1](Object.assign({}, settings))
        })
      }, [])

      var style = STYLES[current.style] || STYLES[DEFAULTS.style]
      var currentAccent = findById(style.accents, current.accent) || style.accents[0]

      var styleChips = Object.keys(STYLES).map(function (id) {
        var preset = STYLES[id]
        var preview = {
          '--dsk-pv-light': 'linear-gradient(135deg, ' + preset.light['--dsw-alias-bg-base'] + ' 0 52%, ' + preset.accents[0].light.fill + ' 52% 100%)',
          '--dsk-pv-dark': 'linear-gradient(135deg, ' + preset.dark['--dsw-alias-bg-base'] + ' 0 52%, ' + preset.accents[0].dark.fill + ' 52% 100%)'
        }
        return h('button', {
          key: id,
          type: 'button',
          className: 'dsk-chip',
          'aria-pressed': current.style === id,
          onClick: function () {
            update({ style: id, enabled: true })
          }
        }, h('span', { className: 'dsk-pv', style: preview }), t(preset.name))
      })

      var swatches = style.accents.map(function (item) {
        return h('button', {
          key: item.id,
          type: 'button',
          className: 'dsk-swatch',
          style: { '--dsk-fill': item.light.fill, '--dsk-fill-dark': item.dark.fill },
          title: t(item.name),
          'aria-label': t(item.name),
          'aria-pressed': current.accent === item.id,
          onClick: function () {
            update({ accent: item.id, enabled: true })
          }
        })
      })

      var levels = ['small', 'medium', 'large']
      var levelLabels = { small: 'radiusSmall', medium: 'radiusMedium', large: 'radiusLarge' }
      var chips = levels.map(function (level) {
        return h('button', {
          key: level,
          type: 'button',
          className: 'dsk-chip',
          'aria-pressed': current.radius === level,
          onClick: function () {
            update({ radius: level, enabled: true })
          }
        }, t(levelLabels[level]))
      })

      var atDefault = current.enabled
        && current.style === DEFAULTS.style
        && current.accent === DEFAULTS.accent
        && current.radius === DEFAULTS.radius

      return h('div', { className: current.enabled ? 'dsk-row' : 'dsk-row dsk-off' },
        h('div', { className: 'dsk-head' },
          h('div', { className: 'dsk-title' }, t('title')),
          h('button', {
            type: 'button',
            className: 'dsk-switch',
            role: 'switch',
            'aria-checked': current.enabled,
            'aria-label': t('toggle'),
            onClick: function () {
              update({ enabled: !current.enabled })
            }
          }, h('span', { className: 'dsk-knob' }))
        ),
        h('div', { className: 'dsk-desc' }, t('description')),
        runtime.ready || !runtime.settled ? null : h('div', { className: 'dsk-warn' }, t('noTheme')),
        h('div', { className: 'dsk-body' },
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-style-label' },
            h('span', { className: 'dsk-label', id: 'dsk-style-label' }, t('style')),
            styleChips
          ),
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-accent-label' },
            h('span', { className: 'dsk-label', id: 'dsk-accent-label' }, t('accent') + ' · ' + t(currentAccent.name)),
            swatches
          ),
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-radius-label' },
            h('span', { className: 'dsk-label', id: 'dsk-radius-label' }, t('radius') + ' · ' + t(levelLabels[current.radius])),
            chips
          ),
          h('button', {
            type: 'button',
            className: 'dsk-reset',
            disabled: atDefault,
            onClick: function () {
              update({ enabled: true, style: DEFAULTS.style, accent: DEFAULTS.accent, radius: DEFAULTS.radius })
            }
          }, t('reset'))
        )
      )
    }

    /**
     * 注册。theme 没就绪就等；slots 没就绪就只换肤不建设置行。
     * 整段包 try/catch，失败只停用自己。
     */
    function apply(ctx) {
      try {
        if (typeof document === 'undefined') return
        ensureStyle(ctx)

        var locale = typeof ctx.get === 'function' ? ctx.get('locale') : ctx.locale
        var hasLocale = locale !== null && locale !== undefined && typeof locale.register === 'function'
        if (hasLocale) {
          try {
            ctx.effect(function () {
              return locale.register(NS, STRINGS)
            }, 'dsh-skin: row dictionaries')
          } catch (error) {
            report(error)
            hasLocale = false
          }
        }

        ctx.effect(function () {
          return detach
        }, 'dsh-skin: token layer')

        waitForTheme(ctx)

        var slots = typeof ctx.get === 'function' ? ctx.get('slots') : ctx.slots
        if (slots === null || slots === undefined || typeof slots.inject !== 'function') return
        slots.inject('sidebar.brand.mark', function () {
          try {
            // 官方构建会先占住这个槽，那种情况不抢，保留官方标记。
            if (typeof slots.entries === 'function' && slots.entries('sidebar.brand.mark').length > 0) return
            brandApi = slots
            brandReady = true
            syncBrand()
          } catch (error) {
            report(error)
          }
        })
        slots.inject('settings.general.item', function () {
          var options = { name: 'settings.general.item', id: 'dsh-skin', order: 13 }
          if (hasLocale) options.locale = NS
          return slots.register(options, SkinRow)
        })
      } catch (error) {
        report(error)
      }
    }

    return {
      name: 'dsh-skin',
      inject: ['slots'],
      apply: apply,
      /** 测试用：暴露内部函数。 */
      __internals: {
        buildTokens: buildTokens,
        readSettings: readSettings,
        normalizeSettings: normalizeSettings,
        update: update,
        STYLES: STYLES,
        SkinRow: SkinRow,
        BrandMark: BrandMark
      }
    }
  }
})
