// Monaco编辑器的One Dark主题配置
// 与One Light主题对应的暗色主题

/**
 * One Dark颜色值
 * 这些颜色与One Light主题相对应，但适用于暗色背景
 */

const oneDark = {
  base: 'vs-dark', // 使用暗色主题作为基础
  inherit: true, // 继承基础主题的规则
  rules: [
    // 基本语法元素
    { token: '', foreground: '#abb2bf' }, // 默认文本颜色
    { token: 'comment', foreground: '#5c6370', fontStyle: 'italic' }, // 注释
    { token: 'keyword', foreground: '#c678dd' }, // 关键字
    { token: 'operator', foreground: '#c678dd' }, // 操作符
    { token: 'string', foreground: '#98c379' }, // 字符串
    { token: 'string.escape', foreground: '#98c379' }, // 转义字符
    { token: 'constant', foreground: '#d19a66' }, // 常量
    { token: 'variable', foreground: '#61afef' }, // 变量
    { token: 'variable.parameter', foreground: '#abb2bf' }, // 参数变量
    { token: 'variable.language', foreground: '#c678dd' }, // 语言变量 (this, self等)
    { token: 'function', foreground: '#61afef' }, // 函数
    { token: 'number', foreground: '#d19a66' }, // 数字
    { token: 'boolean', foreground: '#d19a66' }, // 布尔值
    { token: 'regexp', foreground: '#98c379' }, // 正则表达式

    // 标记和标签
    { token: 'tag', foreground: '#e06c75' }, // 标签
    { token: 'tag.attribute.name', foreground: '#d19a66' }, // 属性名
    { token: 'attribute.name', foreground: '#d19a66' }, // 属性名
    { token: 'attribute.value', foreground: '#98c379' }, // 属性值

    // Python - 根据monaco-python-language.js中的token规则更新
    { token: 'keyword.python', foreground: '#c678dd' }, // Python关键字
    { token: 'identifier.python', foreground: '#abb2bf' }, // Python标识符
    { token: 'delimiter.python', foreground: '#abb2bf' }, // Python分隔符
    { token: 'delimiter.parenthesis.python', foreground: '#abb2bf' }, // Python括号
    { token: 'delimiter.curly.python', foreground: '#abb2bf' }, // Python大括号
    { token: 'delimiter.bracket.python', foreground: '#abb2bf' }, // Python方括号
    { token: 'white.python', foreground: '#abb2bf' }, // Python空白
    { token: 'comment.python', foreground: '#5c6370', fontStyle: 'italic' }, // Python注释
    { token: 'string.python', foreground: '#98c379' }, // Python字符串
    { token: 'string.prefix.python', foreground: '#98c379' },
    { token: 'string.escape.python', foreground: '#56b6c2' }, // Python字符串转义
    { token: 'number.python', foreground: '#d19a66' }, // Python数字
    { token: 'number.hex.python', foreground: '#d19a66' }, // Python十六进制数字
    { token: 'tag.python', foreground: '#e06c75' }, // Python装饰器
    { token: 'function.python', foreground: '#98c379' }, // Python内置函数
    { token: 'constant.python', foreground: '#d19a66' }, // Python常量
    { token: 'operator.python', foreground: '#61afef' }, // Python操作符
    { token: 'type.identifier', foreground: '#d19a66' }, // Python类名 - 黄色高亮
    { token: 'method.name', foreground: '#61afef' }, // Python方法名 - 蓝色高亮
    { token: 'keyword.def', foreground: '#c678dd' }, // def 关键字
    { token: 'template.content', foreground: '#abb2bf' }, // 模板字符串内容
    
    // JavaScript - 根据monaco-javascript-language.js中的token规则更新
    { token: 'keyword.js', foreground: '#c678dd' }, // JavaScript关键字
    { token: 'identifier.js', foreground: '#abb2bf' }, // JavaScript标识符
    { token: 'delimiter.js', foreground: '#abb2bf' }, // JavaScript分隔符
    { token: 'white.js', foreground: '#abb2bf' }, // JavaScript空白
    { token: 'comment.js', foreground: '#5c6370', fontStyle: 'italic' }, // JavaScript注释
    { token: 'string.js', foreground: '#98c379' }, // JavaScript字符串
    { token: 'string.escape.js', foreground: '#56b6c2' }, // JavaScript字符串转义
    { token: 'number.js', foreground: '#d19a66' }, // JavaScript数字
    { token: 'regexp.js', foreground: '#98c379' }, // JavaScript正则表达式
    { token: 'regexp.escape.js', foreground: '#56b6c2' }, // JavaScript正则表达式转义
    { token: 'regexp.flag.js', foreground: '#d19a66' }, // JavaScript正则表达式标志
    { token: 'tag.js', foreground: '#e06c75' }, // JavaScript装饰器
    { token: 'function.js', foreground: '#98c379' }, // JavaScript内置函数
    { token: 'constant.js', foreground: '#d19a66' }, // JavaScript常量
    { token: 'operator.js', foreground: '#61afef' }, // JavaScript操作符
    { token: 'type.js', foreground: '#d19a66' }, // JavaScript类型
    { token: 'type.identifier', foreground: '#d19a66' }, // JavaScript类名 - 黄色高亮
    { token: 'method.name', foreground: '#61afef' } // JavaScript方法名 - 蓝色高亮
  ],
  colors: {
    // 编辑器基础颜色
    'editor.background': '#282c34', // 背景色
    'editor.foreground': '#abb2bf', // 前景色
    'editorCursor.foreground': '#528bff', // 光标颜色
    'editor.selectionBackground': '#3e4451', // 选择背景
    'editor.inactiveSelectionBackground': '#3a3f4b', // 非活动选择背景
    'editor.lineHighlightBackground': '#2c313a', // 当前行高亮

    // 编辑器组件颜色
    'editorLineNumber.foreground': '#5c6370', // 行号
    'editorIndentGuide.background': '#ffffff15', // 缩进指南
    'editorIndentGuide.activeBackground': '#626772', // 活动缩进指南
    'editorBracketMatch.background': '#3e4451', // 括号匹配背景
    'editorBracketMatch.border': '#528bff', // 括号匹配边框

    // 搜索和高亮
    'editor.findMatchBackground': '#3e4451', // 查找匹配
    'editor.findMatchHighlightBackground': '#3e445180', // 查找高亮

    // 错误和警告
    'editorError.foreground': '#e06c75', // 错误
    'editorWarning.foreground': '#d19a66', // 警告

    // 其他UI元素
    'editorGutter.background': '#282c34', // 行号背景
    'editorWidget.background': '#21252b', // 编辑器小部件背景
    'editorSuggestWidget.background': '#21252b', // 建议小部件背景
    'editorSuggestWidget.border': '#3a3f4b', // 建议小部件边框
    'editorSuggestWidget.selectedBackground': '#2c313a', // 建议小部件选中项
    'editorHoverWidget.background': '#21252b', // 悬停小部件背景
    'editorHoverWidget.border': '#3a3f4b' // 悬停小部件边框
  }
}

export default oneDark
