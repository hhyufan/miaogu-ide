// Monaco编辑器的JavaScript语言定义
// 包含自定义的语法高亮规则和标识符识别

// 在Monaco编辑器初始化后调用此函数
function initJavaScriptLanguage() {
  // 注册JavaScript语言
  // eslint-disable-next-line no-undef
  monaco.languages.register({ id: 'javascript' })

  // 设置JavaScript语言的语法高亮规则
  // eslint-disable-next-line no-undef
  monaco.languages.setMonarchTokensProvider('javascript', {
    // 设置默认的token
    defaultToken: '',
    tokenPostfix: '.js',

    // 关键字
    keywords: [
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'export',
      'extends',
      'false',
      'finally',
      'for',
      'from',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'let',
      'new',
      'null',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
      'async',
      'await'
    ],

    // 内置对象和函数
    builtins: [
      'Array',
      'Boolean',
      'Date',
      'Error',
      'Function',
      'JSON',
      'Math',
      'Number',
      'Object',
      'Promise',
      'RegExp',
      'String',
      'Symbol',
      'console',
      'document',
      'window',
      'fetch',
      'parseInt',
      'parseFloat',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'localStorage',
      'sessionStorage',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Proxy',
      'Reflect'
    ],

    // 内置类型
    types: [
      'Array',
      'Boolean',
      'Date',
      'Error',
      'Function',
      'Map',
      'Number',
      'Object',
      'Promise',
      'RegExp',
      'Set',
      'String',
      'Symbol',
      'WeakMap',
      'WeakSet'
    ],

    // 特殊变量和常量
    specialConstants: [
      'true',
      'false',
      'null',
      'undefined',
      'NaN',
      'Infinity',
      'this',
      'arguments',
      'globalThis'
    ],

    // 操作符
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
      '=>',
      '...'
    ],

    // 符号
    symbols: /[=><!~?:&|+\-*/^%]+/,

    // 转义字符
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // 整数
    digits: /\d+/,

    // 八进制数
    octaldigits: /[0-7]+/,

    // 二进制数
    binarydigits: /[0-1]+/,

    // 十六进制数
    hexdigits: /[\da-fA-F]+/,

    // 正则表达式
    regexpctl: /[(){}[\]$^|\-*+?.]/,
    regexpesc: /\\(?:[bBdDfnrstvwW0\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

    // 标记器规则
    tokenizer: {
      root: [
        // 空白
        [/\s+/, 'white.js'],

        // 注释
        [/\/\/.*$/, 'comment.js'],
        [/\/\*/, 'comment.js', '@comment'],

        // 关键字
        [
          /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await)\b/,
          'keyword.js'
        ],

        // 特殊常量
        [/\b(?:true|false|null|undefined|NaN|Infinity)\b/, 'constant.js'],

        // 内置对象和函数
        [
          /\b(?:Array|Boolean|Date|Error|Function|JSON|Math|Number|Object|Promise|RegExp|String|Symbol|console|document|window)\b/,
          'type.js'
        ],

        // 正则表达式
        [
          /\/(?=(?:[^\\/[]|\\.|\[([^\]\\]|\\.)+])+\/(?!\/))(\/)/,
          { token: 'regexp.js', next: '@regexp' }
        ],

        // 字符串 - 模板字符串
        [
          /`/,
          {
            token: 'string.js',
            next: '@templatestring'
          }
        ],

        // 双引号字符串
        [
          /"/,
          {
            token: 'string.js',
            next: '@string.double'
          }
        ],

        // 单引号字符串
        [
          /'/,
          {
            token: 'string.js',
            next: '@string.single'
          }
        ],

        // 数字
        [
          /\b(0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+\.\d+([eE][+-]?\d+)?|\d+[eE][+-]?\d+|\d+)\b/,
          'number.js'
        ],

        // 装饰器
        [/@[a-zA-Z_$][\w$]*/, 'tag.js'],

        // 分隔符和括号
        [/[{}[\]()]/, 'delimiter.js'],
        [/[,.:;]/, 'delimiter.js'],

        // 操作符
        [/[=+\-*/%&|^~<>!?]+|\b(?:instanceof|in|of|new|typeof|void)\b/, 'operator.js'],

        // 类名识别 - 在class关键字后的标识符作为类名
        [/[A-Z][\w$]*/, 'type.identifier'],

        // 函数定义
        [
          /\b(function)\b/,
          {
            token: 'keyword.function',
            next: '@function_def'
          }
        ],

        // 标识符
        [
          /\b[a-zA-Z_$][\w$]*\b/,
          {
            cases: {
              '@keywords': 'keyword.js',
              '@builtins': 'function.js',
              '@types': 'type.js',
              '@specialConstants': 'constant.js',
              '@default': 'identifier.js'
            }
          }
        ]
      ],

      // 函数名捕获状态
      function_def: [
        [/\s+/, 'white'], // 跳过所有空白字符
        [
          /([a-zA-Z_$][\w$]*)/, // 匹配函数名
          {
            token: 'method.name',
            next: '@pop' // 处理完函数名后返回root状态
          }
        ],
        // 添加括号处理逻辑，避免后续字符干扰
        [/\(/, { token: 'delimiter.parenthesis', next: '@pop', bracket: '@open' }],
        // 错误处理
        [/./, { token: 'invalid', next: '@pop' }]
      ],

      // 注释状态
      comment: [
        [/[^/*]+/, 'comment.js'],
        [/\*\//, 'comment.js', '@pop'],
        [/[/*]/, 'comment.js']
      ],

      // 正则表达式状态
      regexp: [
        [/(\/)(\w+)/, ['regexp.js', 'regexp.flag.js']],
        [/[^\\/]+/, 'regexp.js'],
        [/\\./, 'regexp.escape.js'],
        [/\//, 'regexp.js', '@pop']
      ],

      // 双引号字符串处理
      'string.double': [
        // 转义字符
        [/\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/, 'string.escape.js'],
        // 双引号终止
        [
          /"/,
          {
            token: 'string.js',
            next: '@pop'
          }
        ],
        // 字符串内容
        [/[^\\"]+/, 'string.js'],
        // 容错规则
        [/./, 'string.js']
      ],

      // 单引号字符串处理
      'string.single': [
        // 转义字符
        [/\\(['\\])/, 'string.escape.js'],
        // 单引号终止
        [
          /'/,
          {
            token: 'string.js',
            next: '@pop'
          }
        ],
        // 字符串内容
        [/[^\\']+/, 'string.js'],
        // 容错规则
        [/./, 'string.js']
      ],

      // 模板字符串处理
      templatestring: [
        // 转义字符
        [/\\(`)/, 'string.escape.js'],
        // 模板表达式开始
        [
          /\${/,
          {
            token: 'delimiter.js',
            next: '@templateExpr'
          }
        ],
        // 模板字符串终止
        [
          /`/,
          {
            token: 'string.js',
            next: '@pop'
          }
        ],
        // 字符串内容
        [/[^\\`$]+/, 'string.js'],
        // 容错规则
        [/./, 'string.js']
      ],

      // 模板表达式
      templateExpr: [[/}/, { token: 'delimiter.js', next: '@pop' }], { include: 'root' }]
    }
  })

  // 注册JavaScript语言的自动完成提供者
  // eslint-disable-next-line no-undef
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: () => {
      const suggestions = []

      if (window.codeBlockManager) {
        const currentBlock = window.codeBlockManager.getCurrentBlock()
        if (currentBlock) {
          // 添加自定义类补全
          const customClasses = currentBlock.getCustomClasses()
          if (customClasses && customClasses.length > 0) {
            customClasses.forEach((cls) => {
              suggestions.push({
                label: cls.name,
                // eslint-disable-next-line no-undef
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: cls.name,
                detail: '自定义类',
                documentation: cls.docstring || '用户定义的类'
              })
            })
          }

          // 添加自定义函数补全
          const customFunctions = currentBlock.getCustomFunctions()
          if (customFunctions && customFunctions.length > 0) {
            customFunctions.forEach((func) => {
              // 构建参数字符串
              const paramsString = func.parameters
                .map((p) => (p.hasDefaultValue ? `${p.name}=${p.defaultValue}` : p.name))
                .join(', ')

              // 只插入函数名和括号，将光标定位在括号内
              suggestions.push({
                label: `${func.name}(${paramsString})`,
                // eslint-disable-next-line no-undef
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: `${func.name}(\${1})`,
                // eslint-disable-next-line no-undef
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: '自定义函数',
                documentation: func.docstring || '用户定义的函数'
              })
            })
          }
        }
      }

      // 添加变量建议
      if (window.codeBlockManager) {
        const currentBlock = window.codeBlockManager.getCurrentBlock()
        if (currentBlock) {
          const variables = currentBlock.getVariables()
          if (variables && variables.length > 0) {
            variables.forEach((variable) => {
              suggestions.push({
                label: variable.name,
                // eslint-disable-next-line no-undef
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: variable.name,
                detail: `变量 (${variable.type})`,
                documentation: variable.value ? `值: ${variable.value}` : undefined
              })
            })
          }
        }
      }

      // 添加关键字建议
      ;[
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'export',
        'extends',
        'finally',
        'for',
        'from',
        'function',
        'if',
        'import',
        'in',
        'instanceof',
        'let',
        'new',
        'return',
        'super',
        'switch',
        'this',
        'throw',
        'try',
        'typeof',
        'var',
        'void',
        'while',
        'with',
        'yield',
        'async',
        'await'
      ].forEach((keyword) => {
        suggestions.push({
          label: keyword,
          // eslint-disable-next-line no-undef
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword
        })
      })

      // 添加内置对象和函数建议
      ;[
        'console.log',
        'console.error',
        'console.warn',
        'console.info',
        'console.debug',
        'console.table',
        'console.time',
        'console.timeEnd',
        'document.getElementById',
        'document.querySelector',
        'document.querySelectorAll',
        'document.createElement',
        'window.addEventListener',
        'window.setTimeout',
        'window.setInterval',
        'window.clearTimeout',
        'window.clearInterval',
        'Array.isArray',
        'Object.keys',
        'Object.values',
        'Object.entries',
        'Object.assign',
        'JSON.parse',
        'JSON.stringify',
        'Math.random',
        'Math.floor',
        'Math.ceil',
        'Math.round',
        'Math.max',
        'Math.min',
        'String.prototype.trim',
        'String.prototype.split',
        'String.prototype.replace',
        'Array.prototype.map',
        'Array.prototype.filter',
        'Array.prototype.reduce',
        'Array.prototype.forEach',
        'Array.prototype.find',
        'Array.prototype.some',
        'Array.prototype.every',
        'Promise.resolve',
        'Promise.reject',
        'Promise.all',
        'Promise.race'
      ].forEach((func) => {
        const parts = func.split('.')
        const insertText = parts.length > 2 ? `${parts[0]}.${parts[1]}(\${1})` : `${func}(\${1})`

        suggestions.push({
          label: func,
          // eslint-disable-next-line no-undef
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: insertText,
          // eslint-disable-next-line no-undef
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '内置函数/方法'
        })
      })

      // 添加常用方法建议
      ;[
        '.map(',
        '.filter(',
        '.reduce(',
        '.forEach(',
        '.find(',
        '.some(',
        '.every(',
        '.includes(',
        '.indexOf(',
        '.join(',
        '.split(',
        '.slice(',
        '.splice(',
        '.push(',
        '.pop(',
        '.shift(',
        '.unshift(',
        '.concat(',
        '.reverse(',
        '.sort(',
        '.trim(',
        '.toLowerCase(',
        '.toUpperCase(',
        '.replace(',
        '.match(',
        '.test(',
        '.exec(',
        '.then(',
        '.catch(',
        '.finally('
      ].forEach((method) => {
        suggestions.push({
          label: method,
          // eslint-disable-next-line no-undef
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: method + '${1})',
          // eslint-disable-next-line no-undef
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '常用方法'
        })
      })

      return { suggestions }
    }
  })
}

export default initJavaScriptLanguage
