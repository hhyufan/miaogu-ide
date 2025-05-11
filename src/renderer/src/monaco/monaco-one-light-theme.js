// Monaco编辑器的One Light主题配置
// 基于Atom's One Light主题和prism-one-light.css

/**
 * One Light颜色值 (来自prism-one-light.css)
 * --mono-1: hsl(230, 8%, 24%)  - 主要文本
 * --mono-2: hsl(230, 6%, 44%)  - 次要文本
 * --mono-3: hsl(230, 4%, 64%)  - 注释
 * --hue-1: hsl(198, 99%, 37%)  - URL
 * --hue-2: hsl(221, 87%, 60%)  - 变量、函数
 * --hue-3: hsl(301, 63%, 40%)  - 关键字
 * --hue-4: hsl(119, 34%, 47%)  - 字符串
 * --hue-5: hsl(5, 74%, 59%)    - 属性、标签
 * --hue-5-2: hsl(344, 84%, 43%) - 插值标点
 * --hue-6: hsl(35, 99%, 36%)   - 属性名、布尔值、常量
 * --hue-6-2: hsl(35, 99%, 40%) - 数字
 * --syntax-fg: hsl(230, 8%, 24%)  - 前景色
 * --syntax-bg: hsl(230, 1%, 98%)  - 背景色
 * --syntax-selection: hsl(230, 1%, 90%) - 选择背景
 */

const oneLight = {
  base: 'vs', // 使用浅色主题作为基础
  inherit: true, // 继承基础主题的规则
  rules: [
    // 基本语法元素
    { token: '', foreground: '#383a42' }, // 默认文本颜色 (--syntax-fg)
    { token: 'comment', foreground: '#9d9d9f', fontStyle: 'italic' }, // 注释 (--mono-3)
    { token: 'keyword', foreground: '#a626a4' }, // 关键字 (--hue-3)
    { token: 'operator', foreground: '#a626a4' }, // 操作符 (--hue-3)
    { token: 'string', foreground: '#50a14f' }, // 字符串 (--hue-4)
    { token: 'string.escape', foreground: '#50a14f' }, // 转义字符
    { token: 'constant', foreground: '#c18401' }, // 常量 (--hue-6)
    { token: 'variable', foreground: '#4078f2' }, // 变量 (--hue-2)
    { token: 'variable.parameter', foreground: '#383a42' }, // 参数变量
    { token: 'variable.language', foreground: '#a626a4' }, // 语言变量 (this, self等)
    { token: 'function', foreground: '#4078f2' }, // 函数 (--hue-2)
    { token: 'number', foreground: '#c18401' }, // 数字 (--hue-6)
    { token: 'regexp', foreground: '#50a14f' }, // 正则表达式 (--hue-4)

    // 标记和标签
    { token: 'tag', foreground: '#e45649' }, // 标签 (--hue-5)
    { token: 'tag.attribute.name', foreground: '#c18401' }, // 属性名 (--hue-6)
    { token: 'attribute.name', foreground: '#c18401' }, // 属性名 (--hue-6)
    { token: 'attribute.value', foreground: '#50a14f' }, // 属性值 (--hue-4)

    // Python
    { token: 'identifier.python', foreground: '#383a42' }, // Python标识符
    { token: 'constant.python', foreground: '#c18401' }, // 黄色高亮布尔值
    { token: 'delimiter.python', foreground: '#abb2bf' }, // Python分隔符
    { token: 'delimiter.parenthesis.python', foreground: '#abb2bf' }, // Python括号
    { token: 'delimiter.curly.python', foreground: '#abb2bf' }, // Python大括号
    { token: 'delimiter.bracket.python', foreground: '#abb2bf' }, // Python方括号
    { token: 'comment.python', foreground: '#5c6370', fontStyle: 'italic' }, // Python注释
    { token: 'string.python', foreground: '#50a14f' }, // Python字符串
    { token: 'string.prefix.python', foreground: '#50a14f' },
    { token: 'string.escape.python', foreground: '#56b6c2' }, // Python字符串转义
    { token: 'function.python', foreground: '#50a14f' },
    { token: 'number.python', foreground: '#d19a66' }, // Python数字
    { token: 'number.hex.python', foreground: '#d19a66' }, // Python十六进制数字
    { token: 'tag.python', foreground: '#e06c75' }, // Python装饰器
    { token: 'type.identifier', foreground: '#c18401' }, // Python类名 - 黄色高亮
    { token: 'method.name', foreground: '#4078f2' }, // Python方法名 - 蓝色高亮
    { token: 'keyword.def', foreground: '#a626a4' },
    { token: 'operator.python', foreground: '#4078f2' }, // Python操作符 - 蓝色高亮
    { token: 'template.content', foreground: '#383a42' }, // 模板字符串内容

    // JavaScript
    { token: 'keyword.js', foreground: '#a626a4' }, // JavaScript关键字
    { token: 'identifier.js', foreground: '#383a42' }, // JavaScript标识符
    { token: 'delimiter.js', foreground: '#abb2bf' }, // JavaScript分隔符
    { token: 'white.js', foreground: '#383a42' }, // JavaScript空白
    { token: 'comment.js', foreground: '#9d9d9f', fontStyle: 'italic' }, // JavaScript注释
    { token: 'string.js', foreground: '#50a14f' }, // JavaScript字符串
    { token: 'string.escape.js', foreground: '#56b6c2' }, // JavaScript字符串转义
    { token: 'number.js', foreground: '#c18401' }, // JavaScript数字
    { token: 'regexp.js', foreground: '#50a14f' }, // JavaScript正则表达式
    { token: 'regexp.escape.js', foreground: '#56b6c2' }, // JavaScript正则表达式转义
    { token: 'regexp.flag.js', foreground: '#c18401' }, // JavaScript正则表达式标志
    { token: 'tag.js', foreground: '#e06c75' }, // JavaScript装饰器
    { token: 'function.js', foreground: '#50a14f' }, // JavaScript内置函数
    { token: 'constant.js', foreground: '#c18401' }, // JavaScript常量
    { token: 'operator.js', foreground: '#4078f2' }, // JavaScript操作符
    { token: 'type.js', foreground: '#c18401' } // JavaScript类型
  ],
  colors: {
    // 编辑器基础颜色
    'editor.background': '#fafafa', // 背景色 (--syntax-bg)
    'editor.foreground': '#383a42', // 前景色 (--syntax-fg)
    'editorCursor.foreground': '#526fff', // 光标颜色 (--syntax-accent)
    'editor.selectionBackground': '#e5e5e6', // 选择背景 (--syntax-selection)
    'editor.inactiveSelectionBackground': '#e5e5e6', // 非活动选择背景
    'editor.lineHighlightBackground': '#f2f2f2', // 当前行高亮 (--syntax-cursor-line)

    // 编辑器组件颜色
    'editorLineNumber.foreground': '#9d9d9f', // 行号 (--syntax-gutter)
    'editorIndentGuide.background': '#00000015', // 缩进指南 (--syntax-guide)
    'editorIndentGuide.activeBackground': '#626772', // 活动缩进指南
    'editorBracketMatch.background': '#e5e5e6', // 括号匹配背景
    'editorBracketMatch.border': '#526fff', // 括号匹配边框

    // 搜索和高亮
    'editor.findMatchBackground': '#e5e5e6', // 查找匹配
    'editor.findMatchHighlightBackground': '#e5e5e680', // 查找高亮

    // 错误和警告
    'editorError.foreground': '#e45649', // 错误 (--hue-5)
    'editorWarning.foreground': '#c18401', // 警告 (--hue-6)

    // 其他UI元素
    'editorGutter.background': '#fafafa', // 行号背景
    'editorWidget.background': '#f5f5f5', // 编辑器小部件背景
    'editorSuggestWidget.background': '#f5f5f5', // 建议小部件背景
    'editorSuggestWidget.border': '#e5e5e6', // 建议小部件边框
    'editorSuggestWidget.selectedBackground': '#e5e5e6', // 建议小部件选中项
    'editorHoverWidget.background': '#f5f5f5', // 悬停小部件背景
    'editorHoverWidget.border': '#e5e5e6' // 悬停小部件边框
  }
}

export default oneLight
