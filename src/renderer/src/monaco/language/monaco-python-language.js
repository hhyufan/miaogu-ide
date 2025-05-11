// Monaco编辑器的Python语言定义
// 包含自定义的语法高亮规则和标识符识别

// 在Monaco编辑器初始化后调用此函数
function initPythonLanguage() {
  // 注册Python语言
  // eslint-disable-next-line no-undef
  monaco.languages.register({ id: 'python' })

  // 注意：自动完成提供者已移至文件末尾，避免重复注册

  // 注意：解析代码中的自定义函数和类的功能已移至CodeBlockManager类

  // 设置Python语言的语法高亮规则
  // eslint-disable-next-line no-undef
  monaco.languages.setMonarchTokensProvider('python', {
    // 设置默认的token
    defaultToken: '',
    tokenPostfix: '.python',

    // 关键字
    keywords: [
      'and',
      'as',
      'assert',
      'break',
      'class',
      'continue',
      // 'def', 取消冲突关键字
      'del',
      'elif',
      'else',
      'except',
      'exec',
      'finally',
      'for',
      'from',
      'global',
      'if',
      'import',
      'in',
      'is',
      'lambda',
      'not',
      'or',
      'pass',
      'print',
      'raise',
      'return',
      'try',
      'while',
      'with',
      'yield',
      'async',
      'await',
      'nonlocal'
    ],

    // 内置函数
    builtins: [
      'abs',
      'all',
      'any',
      'bin',
      'bool',
      'bytearray',
      'callable',
      'chr',
      'classmethod',
      'compile',
      'complex',
      'delattr',
      'dict',
      'dir',
      'divmod',
      'enumerate',
      'eval',
      'filter',
      'float',
      'format',
      'frozenset',
      'getattr',
      'globals',
      'hasattr',
      'hash',
      'help',
      'hex',
      'id',
      'input',
      'int',
      'isinstance',
      'issubclass',
      'iter',
      'len',
      'list',
      'locals',
      'map',
      'max',
      'memoryview',
      'min',
      'next',
      'object',
      'oct',
      'open',
      'ord',
      'pow',
      'property',
      'range',
      'repr',
      'reversed',
      'round',
      'set',
      'setattr',
      'slice',
      'sorted',
      'staticmethod',
      'str',
      'sum',
      'super',
      'tuple',
      'type',
      'vars',
      'zip',
      '__import__',
      'NotImplemented',
      'Ellipsis',
      '__debug__'
    ],

    // 内置类型
    types: [
      'bool',
      'int',
      'float',
      'complex',
      'list',
      'tuple',
      'range',
      'str',
      'bytes',
      'bytearray',
      'memoryview',
      'set',
      'frozenset',
      'dict',
      'type',
      'object'
    ],

    // 内置异常
    exceptions: [
      'BaseException',
      'Exception',
      'ArithmeticError',
      'LookupError',
      'AssertionError',
      'AttributeError',
      'BufferError',
      'EOFError',
      'FloatingPointError',
      'GeneratorExit',
      'ImportError',
      'ModuleNotFoundError',
      'IndexError',
      'KeyError',
      'KeyboardInterrupt',
      'MemoryError',
      'NameError',
      'NotImplementedError',
      'OSError',
      'OverflowError',
      'RecursionError',
      'ReferenceError',
      'RuntimeError',
      'StopIteration',
      'StopAsyncIteration',
      'SyntaxError',
      'IndentationError',
      'TabError',
      'SystemError',
      'SystemExit',
      'TypeError',
      'UnboundLocalError',
      'UnicodeError',
      'UnicodeEncodeError',
      'UnicodeDecodeError',
      'UnicodeTranslateError',
      'ValueError',
      'ZeroDivisionError',
      'EnvironmentError',
      'IOError',
      'WindowsError'
    ],

    // 特殊变量和常量
    specialConstants: [
      'None',
      'True',
      'False',
      'self',
      'cls',
      '__name__',
      '__doc__',
      '__package__',
      '__loader__',
      '__spec__',
      '__build_class__',
      '__import__',
      '__init__'
    ],

    // 操作符
    operators: [
      '+',
      '-',
      '*',
      '**',
      '/',
      '//',
      '%',
      '@',
      '<<',
      '>>',
      '&',
      '|',
      '^',
      '~',
      '<',
      '>',
      '<=',
      '>=',
      '==',
      '!='
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
    // 标记器规则
    tokenizer: {
      root: [
        // 空白
        [/\s+/, 'white.python'],

        // 注释
        [/#.*$/, 'comment.python'],

        // 关键字
        [
          /\b(?:print|if|while|for|return|import|from|as|class|try|except|finally|with|async|await)\b/,
          'keyword.python'
        ],

        // 特殊常量
        [/\b(?:None|True|False)\b/, 'constant.python'],
        // 内置函数
        [/\b(?:len|range|int|str|float|list|dict|set|tuple|file)\b/, 'function.python'],

        // 字符串 - 三引号
        [
          /([uUbBrRfF]+)?("""|''')/,
          {
            token: 'string.python',
            next: '@multistring.$2'
          }
        ],

        // 双引号字符串
        [
          /([uUbBrRfF]+)?(")/,
          {
            token: 'string.python',
            next: '@string.double'
          }
        ],

        // 单引号字符串
        [
          /([uUbBrRfF]+)?(')/,
          {
            token: 'string.python',
            next: '@string.single'
          }
        ],

        // 数字
        [/\b\d+(\.\d+)?\b/, 'number.python'],

        // 装饰器
        [/@\w+/, 'tag.python'],

        // 分隔符和括号
        [/[{}[\]()]/, 'delimiter.python'],
        [/[,.:;]/, 'delimiter.python'],

        // 操作符
        [/[=+\-*/!%<>]=?|\b(?:and|or|not|in|is)\b/, 'operator.python'],

        // 类名识别 - 在class关键字后的标识符作为类名，设置为黄色高亮
        [/[A-Z][\w$]*/, 'type.identifier'],

        [
          /\b(def)\b/,
          {
            token: 'keyword.def',
            next: '@method_def' // 使用更明确的状态名
          }
        ],
        // 标识符
        [
          /\b[A-Za-z_]\w*\b/,
          {
            cases: {
              '@keywords': 'keyword.python',
              '@builtins': 'function.python',
              '@types': 'type.python',
              '@exceptions': 'type.python',
              '@specialConstants': 'constant.python',
              '@default': 'identifier.python'
            }
          }
        ]
      ],
      // 方法名捕获状态（更名为method_def）
      method_def: [
        [/\s+/, 'white'], // 跳过所有空白字符
        [
          /([A-Za-z_]\w*)/, // 匹配方法名
          {
            token: 'method.name',
            next: '@pop' // 处理完方法名后返回root状态
          }
        ],
        // 添加括号处理逻辑，避免后续字符干扰
        [/\(/, { token: 'delimiter.parenthesis', next: '@pop', bracket: '@open' }],
        // 错误处理
        [/./, { token: 'invalid', next: '@pop' }]
      ],
      // 双引号字符串处理
      'string.double': [
        // 转义字符（包括转义双引号）
        [/\\(["'\\{}])/, 'string.escape.python'],
        // 模板开始
        [
          /{/,
          {
            token: 'template.bracket.open',
            next: '@template_content',
            bracket: '@open'
          }
        ],
        // 双引号终止
        [
          /"/,
          {
            token: 'string.python',
            next: '@pop',
            action: { nextEmbedded: '@popall' }
          }
        ],
        // 字符串内容（排除特殊字符）
        [/[^\\"{]+/, 'string.python'],
        // 容错规则
        [/./, 'string.python']
      ],

      // 单引号字符串处理
      'string.single': [
        // 转义字符（包括转义单引号）
        [/\\(['"\\{}])/, 'string.escape.python'],
        // 模板开始
        [
          /{/,
          {
            token: 'template.bracket.open',
            next: '@template_content',
            bracket: '@open'
          }
        ],
        // 单引号终止
        [
          /'/,
          {
            token: 'string.python',
            next: '@pop',
            action: { nextEmbedded: '@popall' }
          }
        ],
        // 字符串内容（排除特殊字符）
        [/[^\\'{]+/, 'string.python'],
        // 容错规则
        [/./, 'string.python']
      ],

      // 多行字符串状态（三引号）
      multistring: [
        // 优先处理转义字符
        [/\\['"{]/, 'string.escape.python'],

        // 处理模板开始
        [
          /(?<!\\){/,
          {
            token: 'template.bracket.open',
            next: '@template_content',
            bracket: '@open'
          }
        ],

        // 增强三引号终止检测
        [
          /"""|'''/,
          {
            token: 'string.python',
            next: '@pop',
            action: {
              // 强制退出所有可能嵌套的状态
              nextEmbedded: '@popall',
              // 调试日志
              log: '退出多行字符串状态'
            }
          }
        ],

        // 处理跨行内容（新增规则）
        [/[\s\S]*?(?="""|'''|\{)/, 'string.python'], // 非贪婪匹配

        // 容错规则（必须放在最后）
        [/./, 'string.python']
      ],

      // 模板内容状态（增强健壮性）
      template_content: [
        // 1. 处理模板闭合（最高优先级）
        [
          /(?<!\\)}/,
          {
            token: 'template.bracket.close',
            next: '@pop',
            bracket: '@close',
            action: { log: '正常退出模板' }
          }
        ],

        // 处理嵌套模板（支持无限层级，但目前py并不支持多层字符串模板）
        [
          /(?<!\\){/,
          {
            token: 'template.bracket.open',
            next: '@push', // 压栈当前状态
            bracket: '@open',
            action: { log: '进入嵌套模板层级' }
          }
        ],
        // 内容高亮规则（需在转义规则之后）
        // 特殊常量
        [/\b(?:None|True|False)\b/, 'constant.python'],

        // 内置函数
        [/\b(?:print|len|range|int|str|float|list|dict|set|tuple)\b/, 'function.python'],

        // 字符串 - 三引号
        [
          /([uUbBrRfF]+)?("""|''')/,
          {
            token: 'string.python',
            next: '@multistring.$2'
          }
        ],

        // 双引号字符串
        [
          /([uUbBrRfF]+)?(")/,
          {
            token: 'string.python',
            next: '@string.double'
          }
        ],

        // 单引号字符串
        [
          /([uUbBrRfF]+)?(')/,
          {
            token: 'string.python',
            next: '@string.single'
          }
        ],
        // 数字
        [/\b\d+(\.\d+)?\b/, 'number.python'],

        // 分隔符和括号
        [/[{}[\]()]/, 'delimiter.python'],
        [/[,.:;]/, 'delimiter.python'],

        // 操作符
        [/[=+\-*/!<>]=?|\b(?:and|or|not|in|is)\b/, 'operator.python'],

        // 类名，类型
        [/[A-Z][\w$]*/, 'type.identifier'],
        // 标识符
        [
          /\b[A-Za-z_]\w*\b/,
          {
            cases: {
              '@keywords': 'keyword.python',
              '@builtins': 'function.python',
              '@types': 'type.python',
              '@exceptions': 'type.python',
              '@specialConstants': 'constant.python',
              '@default': 'identifier.python'
            }
          }
        ],
        // 5. 转义字符（必须在模板规则之后）
        [/\\['"{}\\]/, 'string.escape.python'],

        // 6. 容错规则（最后匹配）
        [/./, 'template.content']
      ]
    }
  })

  // 注册Python语言的自动完成提供者
  // eslint-disable-next-line no-undef
  monaco.languages.registerCompletionItemProvider('python', {
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
        'and',
        'as',
        'assert',
        'break',
        'class',
        'continue',
        'def',
        'del',
        'elif',
        'else',
        'except',
        'finally',
        'for',
        'from',
        'global',
        'if',
        'import',
        'in',
        'is',
        'lambda',
        'not',
        'or',
        'pass',
        'raise',
        'return',
        'try',
        'while',
        'with',
        'yield',
        'async',
        'await',
        'nonlocal'
      ].forEach((keyword) => {
        suggestions.push({
          label: keyword,
          // eslint-disable-next-line no-undef
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword
        })
      })

      // 添加内置函数建议
      ;[
        'print',
        'len',
        'range',
        'int',
        'str',
        'float',
        'list',
        'dict',
        'set',
        'tuple',
        'abs',
        'all',
        'any',
        'bin',
        'bool',
        'bytearray',
        'callable',
        'chr',
        'classmethod',
        'compile',
        'complex',
        'delattr',
        'dir',
        'divmod',
        'enumerate',
        'eval',
        'filter',
        'format',
        'frozenset',
        'getattr',
        'globals',
        'hasattr',
        'hash',
        'help',
        'hex',
        'id',
        'input',
        'isinstance',
        'issubclass',
        'iter',
        'locals',
        'map',
        'max',
        'min',
        'next',
        'object',
        'oct',
        'open',
        'ord',
        'pow',
        'property',
        'repr',
        'reversed',
        'round',
        'setattr',
        'slice',
        'sorted',
        'staticmethod',
        'sum',
        'super',
        'type',
        'vars',
        'zip'
      ].forEach((func) => {
        suggestions.push({
          label: func,
          // eslint-disable-next-line no-undef
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: func + '(${1})',
          // eslint-disable-next-line no-undef
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: '内置函数'
        })
      })

      // 添加常用方法建议
      ;[
        '.append(',
        '.extend(',
        '.insert(',
        '.remove(',
        '.pop(',
        '.clear(',
        '.index(',
        '.count(',
        '.sort(',
        '.reverse(',
        '.copy(',
        '.keys(',
        '.values(',
        '.items(',
        '.get(',
        '.update(',
        '.add(',
        '.discard(',
        '.clear(',
        '.strip(',
        '.lstrip(',
        '.rstrip(',
        '.split(',
        '.join(',
        '.upper(',
        '.lower(',
        '.title(',
        '.capitalize(',
        '.find(',
        '.replace('
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

export default initPythonLanguage
