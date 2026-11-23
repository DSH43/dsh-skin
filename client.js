/**
 * dsh-skin 客户端模块。
 *
 * 做的事：用 ctx.theme.overrideTokens 在活动主题之上叠一层 token 覆盖，把
 * 界面换成一套完整的外观（配色、字体、圆角、阴影），再往设置 → 常规里注册一行，
 * 能选风格、开关、选强调色、选圆角档、恢复默认。
 *
 * 四套风格：
 *   minimal  中性灰底、无衬线、小圆角（默认）
 *   hacker   清晰的工作区层级，代码与版本保留等宽，强调色保留终端风格
 *   writing  纸白画布 + 宋体正文 + 墨青强调
 *
 *   sketch   中性纸底 + 局部纹理 + 墨线细阴影
 *
 * 配色和字体通过主题 token 覆盖，布局规则由皮肤启用状态和宿主槽位限定。
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

    /** DSH 的原版鲸鱼轮廓，四套皮肤使用同一路径。 */
    var WHALE_PATH = 'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z'

    /** 原版轮廓按 22 × 16 像素重绘，保留头部留白、侧眼和分岔尾鳍。 */
    var PIXEL_WHALE = [
      '..........#....#......',
      '....#######....##.....',
      '..##########...###.###',
      '.############..#######',
      '.#############..#####.',
      '###############.###...',
      '##...##############...',
      '##.....#####..####....',
      '##......#####.####....',
      '##.......#########....',
      '.##.......#######.....',
      '.###.......######.....',
      '..###..###..####......',
      '...########.#####.....',
      '...##########.###.....',
      '.....#######..........'
    ]

    /** 把每行相邻的着色像素写成一段直角路径。 */
    function buildPixelWhalePath() {
      var blocks = []
      for (var y = 0; y < PIXEL_WHALE.length; y += 1) {
        for (var run of PIXEL_WHALE[y].matchAll(/#+/g)) {
          var width = run[0].length
          blocks.push('M' + run.index + ' ' + y + 'h' + width + 'v1h-' + width + 'Z')
        }
      }
      return blocks.join(' ')
    }

    /** 模块加载时生成一次，主题切换不重复计算。 */
    var PIXEL_WHALE_PATH = buildPixelWhalePath()

    /** 写作正文的字体栈，优先宋体。 */
    var SERIF_UI = "'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif"

    /**
     * 风格表。每套风格自带色板、三档圆角和四个强调色。
     * 深浅两套色板的键必须完全一致，buildTokens 按键配对。
     */
    var STYLES = {
      minimal: {
        name: 'styleMinimal',
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
        radii: {
          small: { xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '10px', panel: '12px' },
          medium: { xs: '3px', sm: '5px', md: '8px', lg: '11px', xl: '13px', panel: '16px' },
          large: { xs: '4px', sm: '7px', md: '10px', lg: '14px', xl: '16px', panel: '20px' }
        },
        accents: [
          { id: 'green', name: 'accGreen', light: { fill: '#1FCB6E', hover: '#19B561', link: '#118448' }, dark: { fill: '#1FCE74', hover: '#2BE08A', link: '#60EEAA' } },
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
          '--dsw-specific-sidebar-fill': '#DEE7DF',
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
          '--dsw-alias-bg-base': '#0D1215',
          '--dsw-alias-bg-layer-1': '#151D21',
          '--dsw-alias-bg-layer-2': '#1B2428',
          '--dsw-alias-bg-layer-3': '#222C30',
          '--dsw-alias-bg-overlay': '#16211F',
          '--dsw-alias-bg-module-platform': '#0D1517',
          '--dsw-specific-sidebar-fill': '#141C20',
          '--dsw-specific-input-major': '#151D21',
          '--dsw-alias-card-fill': '#0C1417',
          '--dsw-alias-card-fill-hover': '#121C20',
          '--dsw-alias-markdown-code-block': '#060E0C',
          '--dsw-alias-markdown-code-block-banner': '#0A1412',
          '--dsw-alias-markdown-inline-code': '#182321',
          '--dsw-alias-border-l1': 'rgba(140, 205, 170, 0.08)',
          '--dsw-alias-border-l2': 'rgba(140, 205, 170, 0.12)',
          '--dsw-alias-border-l3': 'rgba(140, 205, 170, 0.16)',
          '--dsw-alias-border-l4': 'rgba(140, 205, 170, 0.22)',
          '--dsw-alias-label-primary': '#E0E7E7',
          '--dsw-alias-label-secondary': '#A3AFB1',
          '--dsw-alias-label-tertiary': '#899699',
          '--dsw-alias-label-caption': '#7D8A8D',
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
        radii: {
          small: { xs: '4px', sm: '6px', md: '9px', lg: '12px', xl: '15px', panel: '20px' },
          medium: { xs: '6px', sm: '9px', md: '13px', lg: '17px', xl: '21px', panel: '26px' },
          large: { xs: '10px', sm: '14px', md: '20px', lg: '26px', xl: '32px', panel: '36px' }
        },
        accents: [
          { id: 'writing-ink', name: 'accWritingInk', light: { fill: '#3E615D', hover: '#32534F', link: '#355A56' }, dark: { fill: '#456B64', hover: '#51776F', link: '#9AC7BD' } },
          { id: 'brass', name: 'accBrass', light: { fill: '#7C5E31', hover: '#6C5028', link: '#74562A' }, dark: { fill: '#785F38', hover: '#856B41', link: '#D2B786' } },
          { id: 'seal', name: 'accSeal', light: { fill: '#854F53', hover: '#734146', link: '#7C464C' }, dark: { fill: '#84545A', hover: '#905F65', link: '#D7A5AA' } },
          { id: 'writing-graphite', name: 'accWritingGraphite', light: { fill: '#505950', hover: '#424B42', link: '#495349' }, dark: { fill: '#5A635B', hover: '#666E65', link: '#B9C4B9' } }
        ],
        light: {
          '--dsw-alias-bg-base': '#F8F7F3',
          '--dsw-alias-bg-layer-1': '#FCFBF8',
          '--dsw-alias-bg-layer-2': '#FFFFFF',
          '--dsw-alias-bg-layer-3': '#FFFFFF',
          '--dsw-alias-bg-overlay': '#EBEAE4',
          '--dsw-alias-bg-module-platform': '#F0EFE9',
          '--dsw-specific-sidebar-fill': '#EEEDE7',
          '--dsw-specific-input-major': '#FFFFFF',
          '--dsw-alias-card-fill': '#FBFAF7',
          '--dsw-alias-card-fill-hover': '#F0EFE9',
          '--dsw-alias-markdown-code-block': '#F0EFEA',
          '--dsw-alias-markdown-code-block-banner': '#E9E8E2',
          '--dsw-alias-markdown-inline-code': '#EEEDE8',
          '--dsw-alias-border-l1': 'rgba(46, 51, 45, 0.12)',
          '--dsw-alias-border-l2': 'rgba(46, 51, 45, 0.16)',
          '--dsw-alias-border-l3': 'rgba(46, 51, 45, 0.20)',
          '--dsw-alias-border-l4': 'rgba(46, 51, 45, 0.26)',
          '--dsw-alias-label-primary': '#242724',
          '--dsw-alias-label-secondary': '#535A55',
          '--dsw-alias-label-tertiary': '#64695F',
          '--dsw-alias-label-caption': '#666B61',
          '--dsw-alias-interactive-bg-hover': 'rgba(46, 51, 45, 0.05)',
          '--dsw-alias-interactive-bg-hover-solid': '#EEEDE8',
          '--dsw-shadow-lv1': '0 1px 2px rgba(46, 51, 45, 0.07)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(46, 51, 45, 0.05)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(46, 51, 45, 0.08), 0 1px 2px rgba(46, 51, 45, 0.05)',
          '--dsw-shadow-lv3': '0 12px 30px rgba(46, 51, 45, 0.12), 0 2px 8px rgba(46, 51, 45, 0.07)',
          '--dsw-elevation-stroke-color': 'rgba(46, 51, 45, 0.14)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(46, 51, 45, 0.14), 0 2px 8px rgba(46, 51, 45, 0.06)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(46, 51, 45, 0.14), 0 6px 20px rgba(46, 51, 45, 0.10)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(46, 51, 45, 0.14), 0 4px 14px rgba(46, 51, 45, 0.07)'
        },
        dark: {
          '--dsw-alias-bg-base': '#1B1C19',
          '--dsw-alias-bg-layer-1': '#242522',
          '--dsw-alias-bg-layer-2': '#282A26',
          '--dsw-alias-bg-layer-3': '#30332E',
          '--dsw-alias-bg-overlay': '#2D2F2B',
          '--dsw-alias-bg-module-platform': '#272923',
          '--dsw-specific-sidebar-fill': '#242520',
          '--dsw-specific-input-major': '#292A25',
          '--dsw-alias-card-fill': '#292A25',
          '--dsw-alias-card-fill-hover': '#30322B',
          '--dsw-alias-markdown-code-block': '#21231F',
          '--dsw-alias-markdown-code-block-banner': '#2A2D27',
          '--dsw-alias-markdown-inline-code': '#272923',
          '--dsw-alias-border-l1': 'rgba(205, 211, 195, 0.10)',
          '--dsw-alias-border-l2': 'rgba(205, 211, 195, 0.14)',
          '--dsw-alias-border-l3': 'rgba(205, 211, 195, 0.18)',
          '--dsw-alias-border-l4': 'rgba(205, 211, 195, 0.24)',
          '--dsw-alias-label-primary': '#EBEAE3',
          '--dsw-alias-label-secondary': '#BFC1B6',
          '--dsw-alias-label-tertiary': '#A3AA9F',
          '--dsw-alias-label-caption': '#A0A69B',
          '--dsw-alias-interactive-bg-hover': 'rgba(205, 211, 195, 0.06)',
          '--dsw-alias-interactive-bg-hover-solid': '#2D2F2B',
          '--dsw-shadow-lv1': '0 1px 2px rgba(0, 0, 0, 0.4)',
          '--dsw-shadow-lv1-blur': '0 4px 10px rgba(0, 0, 0, 0.3)',
          '--dsw-shadow-lv2': '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
          '--dsw-shadow-lv3': '0 12px 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35)',
          '--dsw-elevation-stroke-color': 'rgba(205, 211, 195, 0.12)',
          '--dsw-elevation-panel': '0 0 0 0.5px rgba(205, 211, 195, 0.12), 0 2px 8px rgba(0, 0, 0, 0.4)',
          '--dsw-elevation-prominent': '0 0 0 0.5px rgba(205, 211, 195, 0.16), 0 6px 20px rgba(0, 0, 0, 0.45)',
          '--dsw-elevation-soft': '0 0 0 0.5px rgba(205, 211, 195, 0.10), 0 4px 14px rgba(0, 0, 0, 0.35)'
        }
      },

      sketch: {
        name: 'styleSketch',
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
          '--dsw-specific-sidebar-fill': 'linear-gradient(transparent, #ECECEC) top / 100% 72px no-repeat, repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.035) 0 1px, transparent 1px 7px) top / 100% 72px no-repeat, #ECECEC',
          '--dsw-specific-input-major': '#FFFFFF',
          '--dsw-alias-card-fill': '#FFFFFF',
          '--dsw-alias-card-fill-hover': '#F2F2F2',
          '--dsw-alias-markdown-code-block': '#F2F2F2',
          '--dsw-alias-markdown-code-block-banner': '#E9E9E9',
          '--dsw-alias-markdown-inline-code': '#EFEFEF',
          '--dsw-alias-border-l1': 'rgba(0, 0, 0, 0.12)',
          '--dsw-alias-border-l2': 'rgba(0, 0, 0, 0.16)',
          '--dsw-alias-border-l3': 'rgba(0, 0, 0, 0.14)',
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
          '--dsw-specific-sidebar-fill': 'linear-gradient(transparent, #1B1B1B) top / 100% 72px no-repeat, repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 7px) top / 100% 72px no-repeat, #1B1B1B',
          '--dsw-specific-input-major': '#1F1F1F',
          '--dsw-alias-card-fill': '#1C1C1C',
          '--dsw-alias-card-fill-hover': '#242424',
          '--dsw-alias-markdown-code-block': '#181818',
          '--dsw-alias-markdown-code-block-banner': '#202020',
          '--dsw-alias-markdown-inline-code': '#232323',
          '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.14)',
          '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.18)',
          '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.14)',
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

    /** 行距档位。standard 不动宿主的排版 token，其余两档改正文、代码块、表格和小字的行高。 */
    var LINE_HEIGHTS = {
      compact: { base: 20, code: 17, small: 17, table: 19 },
      standard: null,
      loose: { base: 28, code: 22, small: 23, table: 25 }
    }

    /** 默认值。 */
    var DEFAULTS = { enabled: true, style: 'minimal', accent: 'indigo', radius: 'small', lineHeight: 'standard' }

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

    /** 读取旧版写作偏好时，映射到新色板中最接近的色卡。 */
    var EDITORIAL_ACCENT_ALIASES = {
      sepia: 'writing-ink',
      forest: 'writing-ink',
      brick: 'seal',
      ink: 'writing-graphite',
      iris: 'writing-ink',
      storm: 'writing-ink',
      plum: 'seal',
      'editorial-ink': 'writing-graphite'
    }

    /** 设置行和控件文案。 */
    var STRINGS = {
      zh: {
        title: '界面皮肤',
        description: '外观偏好保存在当前浏览器。',
        style: '风格',
        accent: '强调色',
        radius: '圆角半径',
        radiusSmall: '小',
        radiusMedium: '中',
        radiusLarge: '大',
        lineHeight: '行距',
        lhCompact: '紧凑',
        lhStandard: '标准',
        lhLoose: '宽松',
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
        accWritingInk: '墨青',
        accBrass: '黄铜',
        accSeal: '印泥红',
        accWritingGraphite: '石墨',
        accInkPen: '墨',
        accBlue: '蓝',
        accPink: '粉',
        accSlate: '灰',
        accSage: '苔绿'
      },
      en: {
        title: 'Interface skin',
        description: 'Appearance preferences are saved in this browser.',
        style: 'Style',
        accent: 'Accent',
        radius: 'Corner radius',
        radiusSmall: 'Small',
        radiusMedium: 'Medium',
        radiusLarge: 'Large',
        lineHeight: 'Line spacing',
        lhCompact: 'Compact',
        lhStandard: 'Standard',
        lhLoose: 'Loose',
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
        accWritingInk: 'Ink green',
        accBrass: 'Brass',
        accSeal: 'Seal red',
        accWritingGraphite: 'Graphite',
        accInkPen: 'Ink',
        accBlue: 'Blue',
        accPink: 'Pink',
        accSlate: 'Slate',
        accSage: 'Sage'
      }
    }

    /**
     * 每套皮肤的签名句：新会话页那句 "Into the Unknown" 换成角色自己的话。
     * 宿主把这句标题锁在 locale 字典里、没开槽位，皮肤只能接管那个文本节点。
     */
    var HERO_LINES = {
      minimal: { zh: '少，但更好', en: 'Less, but better.' },
      hacker: { zh: '$ hello, world', en: '$ hello, world' },
      writing: { zh: '写下一句真话', en: 'One true sentence.' },
      sketch: { zh: '先画一条线', en: 'Start with a line.' }
    }

    /** Markdown 容器在宿主构建中有普通类名和 CSS Module 类名两种形式。 */
    var CHAT_PROSE = '[data-slot="conversation.chat.node"] :is(.markdown, [class*="_markdown_"])'

    /** 品牌布局只覆盖侧栏品牌槽，版本检查插件仍负责状态和交互。 */
    var SIDEBAR_BRAND = 'body[data-dsh-skin-style] [data-slot="sidebar.brand.name"]'

    /** 插件布局走宿主槽位和语义属性，设置控件使用 dsk 私有类。 */
    var LAYOUT_CSS = `
      /* 设置面板：预览优先，个性化选项按面板可用宽度排列。 */
      .dsk-row {
        container: dsk-settings / inline-size;
        display: grid;
        gap: 16px;
        padding: 18px 0;
        border-block-end: 1px solid var(--dsw-alias-border-l2);
      }

      .dsk-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .dsk-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 600; line-height: 22px; }
      .dsk-desc { margin-block-start: 3px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .dsk-warn { color: var(--dsw-alias-state-warn-label); font-size: 12px; line-height: 18px; }
      .dsk-group { display: grid; min-inline-size: 0; gap: 8px; align-content: start; }
      .dsk-label { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; line-height: 18px; }

      .dsk-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .dsk-options {
        display: grid;
        gap: 14px;
        padding: 12px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: var(--dsw-radius-lg);
      }

      @container dsk-settings (min-width: 420px) {
        .dsk-presets { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      @container dsk-settings (min-width: 550px) {
        .dsk-options { grid-template-columns: 140px minmax(0, 0.85fr) minmax(0, 1.15fr); }
      }

      .dsk-row button { box-sizing: border-box; font: inherit; color: inherit; cursor: pointer; }
      .dsk-row button:focus-visible { outline: 2px solid var(--dsw-alias-link); outline-offset: 2px; }

      .dsk-row .dsk-preset {
        display: grid;
        gap: 7px;
        min-inline-size: 0;
        padding: 6px;
        border: 1px solid var(--dsw-alias-border-l3);
        border-radius: var(--dsw-radius-md);
        background: var(--dsw-alias-bg-layer-1);
        text-align: start;
      }

      .dsk-row .dsk-preset[aria-pressed="true"] {
        border-color: var(--dsw-alias-border-selected);
        box-shadow: inset 0 0 0 1px var(--dsw-alias-border-selected);
      }

      .dsk-preset-name {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        min-block-size: 19px;
        padding-inline: 3px;
        overflow-wrap: anywhere;
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 18px;
      }

      .dsk-preset[aria-pressed="true"] .dsk-preset-name { font-weight: 600; }
      .dsk-preset[aria-pressed="true"] .dsk-preset-name::after {
        content: '';
        box-sizing: border-box;
        flex: 0 0 6px;
        block-size: 10px;
        border: solid var(--dsw-alias-link);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) translate(-2px, -1px);
      }

      /* 预览使用各套风格的画布、侧栏、面板和强调色。 */
      .dsk-preview {
        --dsk-preview-canvas: var(--dsk-preview-canvas-light);
        --dsk-preview-rail: var(--dsk-preview-rail-light);
        --dsk-preview-surface: var(--dsk-preview-surface-light);
        --dsk-preview-accent: var(--dsk-preview-accent-light);
        position: relative;
        display: block;
        box-sizing: border-box;
        block-size: 54px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: var(--dsk-preview-radius);
        background: var(--dsk-preview-canvas);
        overflow: hidden;
      }

      .dsk-preview::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        inline-size: 26%;
        background: var(--dsk-preview-rail);
        border-inline-end: 1px solid var(--dsw-alias-border-l2);
      }

      .dsk-preview::after {
        content: '';
        position: absolute;
        inset: 9px auto auto 7%;
        inline-size: 12%;
        block-size: 3px;
        border-radius: var(--dsk-preview-radius);
        background: var(--dsk-preview-accent);
      }

      .dsk-preview-panel {
        position: absolute;
        inset: 12px 10% 12px 37%;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: var(--dsk-preview-radius);
        background: linear-gradient(var(--dsk-preview-accent), var(--dsk-preview-accent)) 82% 74% / 7px 7px no-repeat,
          linear-gradient(var(--dsk-preview-accent), var(--dsk-preview-accent)) 22% 35% / 43% 2px no-repeat,
          var(--dsk-preview-surface);
      }

      body[data-ds-dark-theme] .dsk-preview {
        --dsk-preview-canvas: var(--dsk-preview-canvas-dark);
        --dsk-preview-rail: var(--dsk-preview-rail-dark);
        --dsk-preview-surface: var(--dsk-preview-surface-dark);
        --dsk-preview-accent: var(--dsk-preview-accent-dark);
      }

      .dsk-swatches { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
      .dsk-row .dsk-swatch {
        display: grid;
        place-items: center;
        inline-size: 30px;
        block-size: 32px;
        padding: 0;
        border: 0;
        border-radius: var(--dsw-radius-sm);
        background: transparent;
      }

      .dsk-swatch::before {
        content: '';
        inline-size: 18px;
        block-size: 18px;
        border-radius: 50%;
        corner-shape: round;
        background: var(--dsk-fill);
        box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.35);
      }

      body[data-ds-dark-theme] .dsk-swatch::before { background: var(--dsk-fill-dark); }
      .dsk-swatch[aria-pressed="true"]::before { outline: 1px solid var(--dsw-alias-label-primary); outline-offset: 3px; }

      .dsk-segments {
        display: grid;
        grid-template-columns: repeat(3, minmax(min-content, 1fr));
        gap: 2px;
        padding: 2px;
        border-radius: var(--dsw-radius-md);
        background: var(--dsw-alias-bg-module-platform);
      }

      .dsk-row .dsk-chip {
        min-block-size: 28px;
        padding: 3px 2px;
        border: 1px solid transparent;
        border-radius: var(--dsw-radius-sm);
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 16px;
        overflow-wrap: normal;
      }

      .dsk-row .dsk-chip[aria-pressed="true"] {
        border-color: var(--dsw-alias-border-l3);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-weight: 600;
      }

      .dsk-row .dsk-switch {
        position: relative;
        flex: 0 0 36px;
        block-size: 22px;
        margin-block-start: 1px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: var(--dsw-alias-state-idle-primary);
      }

      .dsk-row .dsk-switch[aria-checked="true"] { background: var(--dsw-alias-button-info-fill); }
      .dsk-knob {
        position: absolute;
        inset: 3px auto auto 3px;
        inline-size: 16px;
        block-size: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 150ms ease;
      }

      .dsk-switch[aria-checked="true"] .dsk-knob { transform: translateX(14px); }
      .dsk-row .dsk-reset {
        justify-self: start;
        min-block-size: 26px;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
      }

      .dsk-row .dsk-reset:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
      @media (hover: hover) {
        .dsk-row .dsk-preset:not([aria-pressed="true"]):hover { background: var(--dsw-alias-card-fill-hover); }
        .dsk-row :is(.dsk-chip:not([aria-pressed="true"]), .dsk-swatch):hover { background: var(--dsw-alias-interactive-bg-hover); }
        .dsk-row .dsk-reset:hover:not(:disabled) { color: var(--dsw-alias-label-primary); text-decoration: underline; }
      }

      /* 四套皮肤使用相同的品牌空间，折叠时跟随宿主的展开按钮。 */
      body[data-dsh-skin-style] [data-slot="sidebar"] [class*="brandIdentity"]:has([data-slot="sidebar.brand.mark"]) {
        inline-size: 100%;
        block-size: 44px;
        gap: 8px;
      }

      body[data-dsh-skin-style] [data-slot="sidebar"] [class*="brandName"]:has(> [data-slot="sidebar.brand.name"]) {
        flex: 1;
        block-size: auto;
        letter-spacing: 0;
      }

      body[data-dsh-skin-style] [data-slot="sidebar.brand.mark"] .dsk-brand-mark {
        display: grid;
        flex: none;
        place-items: center;
        inline-size: 44px;
        block-size: 44px;
        color: var(--dsw-alias-link);
      }

      body[data-dsh-skin-style] [data-sidebar-toggle] [data-slot="sidebar.brand.mark"] .dsk-brand-mark {
        inline-size: 32px;
        block-size: 32px;
      }

      body[data-dsh-skin-style] [data-sidebar-toggle] .dsk-brand-mark > svg {
        inline-size: 30px;
        block-size: 30px;
      }

      /* 同时支持版本检查插件和宿主本地构建的备用品牌文字。 */
      ${SIDEBAR_BRAND} :is(.dsvc-brand, [data-copy-version]) {
        display: grid;
        align-content: center;
        justify-items: start;
        gap: 4px;
        min-inline-size: 0;
        max-inline-size: 100%;
        block-size: 36px;
        text-align: start;
      }

      ${SIDEBAR_BRAND} :is(.dsvc-brand-title, [class*="localBuildTitle"], [class*="fallbackBrandName"]) {
        display: block;
        max-inline-size: 100%;
        overflow: hidden;
        color: var(--dsw-alias-label-primary);
        font-family: var(--dsw-font-family);
        font-size: 13px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ${SIDEBAR_BRAND} .dsvc-brand-line {
        display: flex;
        gap: 6px;
        align-items: center;
        max-inline-size: 100%;
        overflow: hidden;
      }

      ${SIDEBAR_BRAND} :is(.dsvc-pill, [class*="buildVersion"]) {
        display: block;
        flex: 0 1 auto;
        min-inline-size: 0;
        max-inline-size: 100%;
        block-size: auto;
        padding: 0;
        overflow: hidden;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font-family: var(--ds-font-family-code);
        font-size: 10px;
        font-weight: 500;
        line-height: 12px;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ${SIDEBAR_BRAND} .dsvc-state {
        flex: 0 1 auto;
        min-inline-size: 0;
        font-family: var(--dsw-font-family);
        font-size: 10px;
        font-weight: 500;
        line-height: 12px;
        letter-spacing: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ${SIDEBAR_BRAND} .dsvc-state-available { color: var(--dsw-alias-link); }

      ${SIDEBAR_BRAND} .dsvc-brand:focus-visible {
        outline: 1px solid var(--dsw-alias-link);
        outline-offset: -1px;
        box-shadow: none;
      }

      /* 展开侧栏的入口共用尺寸与对齐，颜色和笔触由主题决定。 */
      body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button:has([class*="newSessionContent"] > [class*="newSessionLabel"]) {
        height: 38px;
        padding: 0 9px;
        border: 1px solid var(--dsw-alias-border-l3);
        border-radius: var(--dsw-radius-md);
        background: var(--dsk-session-fill, var(--dsw-alias-bg-layer-1));
        color: var(--dsw-alias-label-primary);
        box-shadow: var(--dsk-session-shadow, none);
        font-size: 13px;
        font-weight: 600;
      }

      body[data-dsh-skin-style] [data-slot="sidebar.session.action"] [class*="newSessionContent"]:has(> [class*="newSessionLabel"]) {
        justify-content: flex-start;
        inline-size: auto;
        gap: 8px;
      }

      body[data-dsh-skin-style] [data-slot="sidebar.session.action"] [class*="newSessionContent"] > [class*="newSessionLabel"] {
        text-overflow: ellipsis;
      }

      body[data-dsh-skin-style="hacker"] {
        --dsk-session-shadow: inset 2px 0 0 var(--dsw-alias-link);
      }

      body[data-dsh-skin-style="hacker"] [data-slot="sidebar.session.action"] [class*="newSessionContent"] > svg {
        color: var(--dsw-alias-link);
      }

      /* 黑客的新会话标题是一行终端输出，跟等宽走。 */
      body[data-dsh-skin-style="hacker"] [class*="titleGroup"] > span:first-child {
        font-family: var(--ds-font-family-code);
      }

      body[data-dsh-skin-style] [data-slot="sidebar.workspaces"] [data-row-key^="session:"][aria-selected="true"] {
        background-color: color-mix(in srgb, var(--dsw-alias-link) 10%, transparent);
      }

      body[data-dsh-skin-style="writing"] {
        --dsk-session-fill: color-mix(in srgb, var(--dsw-alias-link) 5%, var(--dsw-alias-bg-layer-1));
      }

      body[data-dsh-skin-style="sketch"] {
        --dsk-session-shadow: 1px 1px 0 var(--dsw-alias-border-l3);
      }

      @media (hover: hover) {
        body[data-dsh-skin-style] [data-slot="sidebar.session.action"] button:has([class*="newSessionContent"] > [class*="newSessionLabel"]):hover {
          background: color-mix(in srgb, var(--dsw-alias-link) 8%, var(--dsw-alias-bg-layer-1));
        }
      }

      /* 会话正文的宿主边距比输入区多 16px。使用同一宽度轴与边距，
         保留窗口缩放、用户拖拽列宽和窄屏时的自适应计算。 */
      body[data-dsh-skin-style] [data-slot="main.conversation"] [data-content-phase="active"]:has([data-slot="conversation.chat.flow"]) {
        --dsh-composer-card-max-width: var(--dsh-chat-content-width);
      }

      body[data-dsh-skin-style] [data-slot="main.conversation"] [data-content-phase="active"]
        [data-conversation-scroll]:has([data-slot="conversation.chat.flow"]) > [data-composer-seat] {
        padding-inline: 16px;
      }

      /* 完成时长是辅助信息，回复正文从它下方的细线开始。 */
      body[data-dsh-skin-style] [data-slot="main.conversation"] [data-turn-process] {
        height: calc(29px + var(--dsh-content-font-delta, 0px));
        font-size: calc(12px + var(--dsh-content-font-delta-secondary, 0px));
      }

      /* 只装饰可编辑的会话输入框，工作区选择器继续用宿主的虚线反馈。 */
      body[data-dsh-skin-style] [data-slot="main.conversation"] [data-composer-card]:has([data-composer-input][contenteditable="true"]) {
        box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l3), var(--dsw-elevation-soft);
      }

      body[data-dsh-skin-style] [data-slot="main.conversation"] [data-composer-card]:has([data-composer-input]:focus) {
        box-shadow: inset 0 0 0 1px var(--dsw-alias-border-selected), var(--dsw-elevation-soft);
      }

      /* 调整会话正文的块间节奏，保留行距设置、代码块和表格的滚动规则。 */
      body[data-dsh-skin-style] ${CHAT_PROSE} > :is(p, ul, ol):not(:first-child, :last-child) {
        margin-block: 12px;
      }

      body[data-dsh-skin-style] ${CHAT_PROSE} > :is(h1, h2, h3):not(:first-child) {
        margin-block-start: 24px;
      }

      body[data-dsh-skin-style] ${CHAT_PROSE} > :is(h1, h2, h3):not(:last-child) {
        margin-block-end: 10px;
      }

      /* 写作风格的宋体只作用于会话正文，导航、控件和代码保留宿主字体。 */
      body[data-dsh-skin-style="writing"] ${CHAT_PROSE},
      body[data-dsh-skin-style="writing"] ${CHAT_PROSE} :is(h1, h2, h3, h4, h5, h6, th, td) {
        font-family: ${SERIF_UI};
      }

      /* 代码标记靠底色区分，密集的文件名和路径之间保留连贯的阅读视线。 */
      body:is([data-dsh-skin-style="writing"], [data-dsh-skin-style="sketch"]) ${CHAT_PROSE} :not(pre) > code {
        border-color: transparent;
        padding-inline: 4px;
      }

      @media (prefers-reduced-motion: reduce) {
        .dsk-knob { transition: none; }
      }
    `

    /** 保留皮肤的文本换行、选区和阴影覆盖。 */
    var CSS = [
      LAYOUT_CSS,
      'body[data-dsh-skin-style] ::selection { background: color-mix(in srgb, var(--dsw-alias-link) 26%, transparent); }',
      /* 会话列是 overflow: hidden，任何超宽内容都会被直接裁掉、连滚动条都没有。
         这里让正文里的长串主动找断点，别把整行顶出列宽。 */
      'body[data-dsh-skin-style] { overflow-wrap: anywhere; }',
      'body[data-dsh-skin-style] [data-slot="main"] :is(p, li, blockquote, td, th, h1, h2, h3, h4, h5, h6) { overflow-wrap: anywhere; word-break: break-word; }',
      /* KaTeX 默认把公式放大到 1.21em，行内一多就显得字一大一小。压回跟正文一致。
         公式本身没有空格，浏览器找不到断行点，所以放开断词，长公式才会在行内折开。 */
      /* DSH 的公式容器实际是 .katex-base，KaTeX 给它写了 white-space: nowrap
         和 width: min-content，既不肯折行、又把盒子撑到最长那一段的宽度。
         这里把这两条都改掉，让它按普通行内内容参与折行。 */
      'body[data-dsh-skin-style] .katex-base { display: inline; white-space: normal; width: auto; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; font-size: 1.02em; }',
      'body[data-dsh-skin-style] .katex-base .mord, body[data-dsh-skin-style] .katex-base .cjk_fallback { display: inline; white-space: normal; }',
      'body[data-dsh-skin-style] .katex { font-size: 1.02em; display: inline; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }',
      'body[data-dsh-skin-style] .katex .katex-html { display: inline; }',
      'body[data-dsh-skin-style] .katex-display { font-size: 1em; white-space: normal; overflow-x: auto; overflow-y: hidden; }',
      'body[data-dsh-skin-style] .katex-display > .katex { display: inline; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }',
      'body[data-dsh-skin-style], body[data-dsh-skin-style] * { --dsw-elevation-stroke: 0 0 0 0.5px var(--dsk-elevation-stroke-color); --dsw-elevation-panel: var(--dsk-elevation-panel); --dsw-elevation-prominent: var(--dsk-elevation-prominent); --dsw-elevation-soft: var(--dsk-elevation-soft); }',
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
      var lineHeight = LINE_HEIGHTS[value.lineHeight] === undefined && value.lineHeight !== 'standard'
        ? DEFAULTS.lineHeight
        : (value.lineHeight === undefined ? DEFAULTS.lineHeight : value.lineHeight)
      return {
        enabled: value.enabled === false ? false : true,
        style: styleId,
        accent: accent.id,
        radius: radius,
        lineHeight: LINE_HEIGHTS[lineHeight] === undefined && lineHeight !== 'standard' ? DEFAULTS.lineHeight : lineHeight
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
      var raw = { enabled: DEFAULTS.enabled, style: DEFAULTS.style, accent: DEFAULTS.accent, radius: DEFAULTS.radius, lineHeight: DEFAULTS.lineHeight }
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
      if (typeof parsed.lineHeight === 'string') raw.lineHeight = parsed.lineHeight
      if (raw.style === 'writing' && Object.prototype.hasOwnProperty.call(EDITORIAL_ACCENT_ALIASES, raw.accent)) {
        raw.accent = EDITORIAL_ACCENT_ALIASES[raw.accent]
      }
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
        dark: tint(accent.dark.fill, value.style === 'hacker' ? 10 : 16, darkBase)
      }
      out['--dsw-specific-bubble-highlight'] = {
        light: tint(accent.light.fill, 16, lightBase),
        dark: tint(accent.dark.fill, 28, darkBase)
      }
      out['--dsw-specific-sidebar-nav-item-active-accent'] = {
        light: tint(accent.light.fill, 10, lightBase),
        dark: tint(accent.dark.fill, 20, darkBase)
      }
      // 行距：只改行高，字号沿用当前设置。standard 不覆盖，直接吃宿主的 24px。
      var lh = LINE_HEIGHTS[value.lineHeight]
      if (lh) {
        var size = 'var(--dsh-content-font-size, 14px)'
        var size2 = 'var(--dsh-content-font-size-secondary, 13px)'
        var baseLh = 'calc(' + lh.base + 'px + var(--dsh-content-font-delta))'
        var tableLh = 'calc(' + lh.table + 'px + var(--dsh-content-font-delta-secondary, 0px))'
        var codeLh = 'calc(' + lh.code + 'px + var(--dsh-code-font-delta))'
        var typed = {
          '--dsw-font-markdown-base': size + '/' + baseLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-base-line-height': baseLh,
          '--dsw-font-markdown-base-strong': '600 ' + size + '/' + baseLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-base-strong-line-height': baseLh,
          '--dsw-font-markdown-base-italic': 'italic ' + size + '/' + baseLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-base-italic-line-height': baseLh,
          '--dsw-font-markdown-base-strong-italic': 'italic 600 ' + size + '/' + baseLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-base-strong-italic-line-height': baseLh,
          '--dsw-font-markdown-small': '12px/' + lh.small + 'px var(--dsw-font-family)',
          '--dsw-font-markdown-small-line-height': lh.small + 'px',
          '--dsw-font-markdown-table': size2 + '/' + tableLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-table-line-height': tableLh,
          '--dsw-font-markdown-table-head': '500 ' + size2 + '/' + tableLh + ' var(--dsw-font-family)',
          '--dsw-font-markdown-table-head-line-height': tableLh,
          '--dsw-font-markdown-code': 'calc(12px + var(--dsh-code-font-delta))' + '/' + codeLh + ' var(--ds-font-family-code)',
          '--dsw-font-markdown-code-line-height': codeLh,
          '--dsw-font-markdown-code-block': 'var(--dsh-code-font-size, 11px)' + '/' + codeLh + ' var(--ds-font-family-code)',
          '--dsw-font-markdown-code-block-line-height': codeLh
        }
        for (var typedName in typed) {
          if (!Object.prototype.hasOwnProperty.call(typed, typedName)) continue
          out[typedName] = { light: typed[typedName], dark: typed[typedName] }
        }
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
        radius: patch.radius === undefined ? settings.radius : patch.radius,
        lineHeight: patch.lineHeight === undefined ? settings.lineHeight : patch.lineHeight
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
      syncBrand()
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

    /** 被接管的新会话标题：节点、写进去的句子、接管前宿主自己的文案。 */
    var heroNode = null
    var heroApplied = null
    var heroOriginal = null
    var heroObserver = null
    var heroQueued = false

    /** 新会话标题那个 span：titleGroup 里唯一不带类名的子元素，另一个是预览徽章。 */
    function heroTitle() {
      var group = document.querySelector('[class*="titleGroup"]')
      if (group === null) return null
      for (var index = 0; index < group.children.length; index += 1) {
        var child = group.children[index]
        if (child.classList.length === 0) return child
      }
      return null
    }

    /** 当前皮肤当前语言该说的那句话。 */
    function heroLineOf(value) {
      var preset = HERO_LINES[value.style]
      if (preset === undefined) return null
      return preset[detectLang()] || preset.en
    }

    /** 把标题写成当前皮肤的那句话。宿主重画、换语言、切风格都靠这里追平。 */
    function applyHero() {
      if (typeof document === 'undefined' || document.body === null) return
      var wanted = settings.enabled ? heroLineOf(settings) : null
      if (heroNode !== null && heroNode.isConnected && heroNode.textContent === wanted) return
      if (wanted === null) {
        restoreHero()
        return
      }
      var node = heroTitle()
      if (node === null) {
        heroNode = null
        heroApplied = null
        heroOriginal = null
        return
      }
      if (node !== heroNode) {
        heroNode = node
        heroApplied = null
        heroOriginal = node.textContent
      } else if (node.textContent !== heroApplied) {
        // 宿主换语言时写回了自己的文案，把这句当成新的原文，关皮肤时照着还原。
        heroOriginal = node.textContent
      }
      if (node.textContent !== wanted) node.textContent = wanted
      heroApplied = wanted
    }

    /** 把标题交还宿主：只在上面还挂着我们的句子时动它，别覆盖宿主新写的文案。 */
    function restoreHero() {
      try {
        if (heroNode !== null && heroNode.isConnected && heroOriginal !== null && heroNode.textContent === heroApplied) {
          heroNode.textContent = heroOriginal
        }
      } catch (error) {
        report(error)
      }
      heroNode = null
      heroApplied = null
      heroOriginal = null
    }

    /** DOM 变动很密（流式输出），一帧里最多重算一次。 */
    function scheduleHero() {
      if (heroQueued) return
      heroQueued = true
      var run = function () {
        heroQueued = false
        try {
          applyHero()
        } catch (error) {
          report(error)
        }
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run)
      else setTimeout(run, 16)
    }

    /** 盯着 DOM：React 重画或换了语言，标题会被写回宿主文案，这里再盖一次。 */
    function watchHero() {
      if (heroObserver !== null || typeof MutationObserver === 'undefined') return
      try {
        heroObserver = new MutationObserver(scheduleHero)
        heroObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
      } catch (error) {
        heroObserver = null
        report(error)
      }
    }

    /** 按开关状态接管或交还标题。 */
    function syncHero() {
      try {
        if (typeof document === 'undefined' || document.body === null) return
        if (!settings.enabled) {
          if (heroObserver !== null) {
            heroObserver.disconnect()
            heroObserver = null
          }
          restoreHero()
          return
        }
        watchHero()
        applyHero()
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
        syncHero()
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
        if (heroObserver !== null) {
          heroObserver.disconnect()
          heroObserver = null
        }
        restoreHero()
      } catch (error) {
        report(error)
      }
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

    /** 配饰留在侧脸轮廓上方，给原版眼睛与表情留出空间。 */
    var BRAND_ACCESSORIES = {
      writing: h('g', null,
        h('rect', {
          x: -1.18,
          y: -4.74,
          width: 10.3,
          height: 4.65,
          rx: 2.15,
          fill: 'var(--dsw-alias-bg-layer-1)',
          stroke: 'currentColor',
          strokeWidth: 0.69
        }),
        h('path', {
          d: 'M1.6-2.42h.01m2.35 0h.01m2.35 0h.01',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 0.95,
          strokeLinecap: 'round'
        }),
        h('circle', { cx: 8.66, cy: 0.49, r: 0.44, fill: 'currentColor' }),
        h('circle', { cx: 9.76, cy: 0.76, r: 0.27, fill: 'currentColor' })
      ),
      sketch: h('g', { transform: 'rotate(-10 7.7 2.2)' },
        h('path', {
          d: 'M3.4 2.4C3 .9 4.5-.43 7.3-.62c2.68-.19 5.17.67 5.37 1.98.16 1-1.03 1.63-3.18 1.65l-4.5.05c-.81.01-1.36-.2-1.59-.66Z',
          fill: 'currentColor',
          stroke: 'var(--dsw-alias-bg-layer-1)',
          strokeWidth: 0.65
        }),
        h('path', { d: 'M8.22-.5q.18-.65.85-.87', fill: 'none', stroke: 'currentColor', strokeWidth: 0.72, strokeLinecap: 'round' })
      )
    }

    /** 黑客使用像素轮廓，其他风格使用原版轮廓和各自的配饰。 */
    function BrandMark() {
      var pair = useState(settings.style)
      var variant = pair[0]
      useEffect(function () {
        return subscribe(function () {
          pair[1](settings.style)
        })
      }, [])

      return h('span', { className: 'dsk-brand-mark', 'data-dsk-mascot': variant, 'aria-hidden': true },
        h('svg', { viewBox: '0 0 28 24', width: 44, height: 44, focusable: 'false' },
          h('g', { transform: variant === 'writing' ? 'translate(2.42 5.35)' : 'translate(2.42 4.25)' },
            variant === 'hacker'
              ? h('path', { d: PIXEL_WHALE_PATH, fill: 'currentColor', transform: 'scale(1.0527 1.065)', shapeRendering: 'crispEdges' })
              : h('path', {
                d: WHALE_PATH,
                fill: 'currentColor',
                transform: variant === 'writing' ? 'translate(0 .7)' : undefined
              }),
            BRAND_ACCESSORIES[variant]
          )
        )
      )
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

      var styleCards = Object.keys(STYLES).map(function (id) {
        var preset = STYLES[id]
        var preview = {
          '--dsk-preview-canvas-light': preset.light['--dsw-alias-bg-base'],
          '--dsk-preview-canvas-dark': preset.dark['--dsw-alias-bg-base'],
          '--dsk-preview-rail-light': preset.light['--dsw-specific-sidebar-fill'],
          '--dsk-preview-rail-dark': preset.dark['--dsw-specific-sidebar-fill'],
          '--dsk-preview-surface-light': preset.light['--dsw-alias-bg-layer-1'],
          '--dsk-preview-surface-dark': preset.dark['--dsw-alias-bg-layer-1'],
          '--dsk-preview-accent-light': preset.accents[0].light.fill,
          '--dsk-preview-accent-dark': preset.accents[0].dark.fill,
          '--dsk-preview-radius': preset.radii.medium.sm
        }
        return h('button', {
          key: id,
          type: 'button',
          className: 'dsk-preset',
          'aria-pressed': current.style === id,
          onClick: function () {
            update({ style: id, enabled: true })
          }
        },
          h('span', { className: 'dsk-preview', style: preview, 'aria-hidden': true },
            h('span', { className: 'dsk-preview-panel' })),
          h('span', { className: 'dsk-preset-name' }, t(preset.name))
        )
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

      var lhLevels = ['compact', 'standard', 'loose']
      var lhLabels = { compact: 'lhCompact', standard: 'lhStandard', loose: 'lhLoose' }
      var lhChips = lhLevels.map(function (level) {
        return h('button', {
          key: level,
          type: 'button',
          className: 'dsk-chip',
          'aria-pressed': current.lineHeight === level,
          onClick: function () {
            update({ lineHeight: level, enabled: true })
          }
        }, t(lhLabels[level]))
      })

      var atDefault = current.enabled
        && current.style === DEFAULTS.style
        && current.accent === DEFAULTS.accent
        && current.radius === DEFAULTS.radius
        && current.lineHeight === DEFAULTS.lineHeight

      return h('div', { className: 'dsk-row' },
        h('div', { className: 'dsk-head' },
          h('div', null,
            h('div', { className: 'dsk-title' }, t('title')),
            h('div', { className: 'dsk-desc' }, t('description'))
          ),
          h('button', {
            type: 'button',
            className: 'dsk-switch',
            role: 'switch',
            'aria-checked': current.enabled,
            'aria-label': t('toggle'),
            onClick: function () {
              update({ enabled: !current.enabled })
            }
          }, h('span', { className: 'dsk-knob', 'aria-hidden': true }))
        ),
        runtime.ready || !runtime.settled ? null : h('div', { className: 'dsk-warn', role: 'status' }, t('noTheme')),
        h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-style-label' },
          h('span', { className: 'dsk-label', id: 'dsk-style-label' }, t('style')),
          h('div', { className: 'dsk-presets' }, styleCards)
        ),
        h('div', { className: 'dsk-options' },
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-accent-label' },
            h('span', { className: 'dsk-label', id: 'dsk-accent-label' }, t('accent') + ' · ' + t(currentAccent.name)),
            h('div', { className: 'dsk-swatches' }, swatches)
          ),
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-radius-label' },
            h('span', { className: 'dsk-label', id: 'dsk-radius-label' }, t('radius')),
            h('div', { className: 'dsk-segments' }, chips)
          ),
          h('div', { className: 'dsk-group', role: 'group', 'aria-labelledby': 'dsk-lh-label' },
            h('span', { className: 'dsk-label', id: 'dsk-lh-label' }, t('lineHeight')),
            h('div', { className: 'dsk-segments' }, lhChips)
          )
        ),
        h('button', {
          type: 'button',
          className: 'dsk-reset',
          disabled: atDefault,
          onClick: function () {
            update(DEFAULTS)
          }
        }, t('reset'))
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
