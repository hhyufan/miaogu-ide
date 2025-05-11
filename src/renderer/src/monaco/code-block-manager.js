/**
 * CodeBlockManager - 管理Python代码块中的类、类属性/方法和自定义函数
 * 提供代码分析和智能补全建议功能
 */

class CodeBlockManager {
  constructor() {
    this.currentBlock = null
    this.customFunctions = new Map() // 存储自定义函数
    this.customClasses = new Map() // 存储自定义类
    this.classMembers = new Map() // 存储类的属性和方法
    this.variables = new Map() // 存储变量
  }

  /**
   * 设置当前代码块
   * @param {string} code - 代码内容
   */
  setCurrentBlock(code) {
    this.currentBlock = {
      code,
      getCustomFunctions: () => this.getCustomFunctions(),
      getCustomClasses: () => this.getCustomClasses(),
      getVariables: () => this.getVariables()
    }

    // 分析代码
    this.analyzeCode(code)
  }

  /**
   * 获取当前代码块
   * @returns {Object|null} 当前代码块对象
   */
  getCurrentBlock() {
    return this.currentBlock
  }

  /**
   * 分析Python代码，提取自定义函数、类及其成员和变量
   * @param {string} code - Python代码
   */
  analyzeCode(code) {
    // 清空之前的分析结果
    this.customFunctions.clear()
    this.customClasses.clear()
    this.classMembers.clear()
    this.variables.clear()

    // 分析自定义类
    this.analyzeCustomClasses(code)

    // 分析自定义函数
    this.analyzeCustomFunctions(code)

    // 分析变量
    this.analyzeVariables(code)
  }

  /**
   * 分析并提取自定义函数
   * @param {string} code - Python代码
   */
  analyzeCustomFunctions(code) {
    // 正则表达式匹配Python函数定义
    // 格式: def function_name(param1, param2=default, ...):
    const functionRegex = /def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([^:]*))?\s*:/g
    const docstringRegex = /"""([\s\S]*?)"""/

    let match
    while ((match = functionRegex.exec(code)) !== null) {
      const functionName = match[1]
      const paramsString = match[2]
      const returnType = match[3] ? match[3].trim() : ''

      // 查找函数的文档字符串
      let docstring = ''
      const functionBodyStart = code.indexOf(':', match.index) + 1
      const functionBodyPart = code.substring(functionBodyStart, functionBodyStart + 500) // 限制搜索范围
      const docMatch = docstringRegex.exec(functionBodyPart)
      if (docMatch) {
        docstring = docMatch[1].trim()
      }

      // 解析参数
      const params = this.parseParameters(paramsString)

      // 存储函数信息
      this.customFunctions.set(functionName, {
        name: functionName,
        parameters: params,
        returnType,
        docstring
      })
    }
  }

  /**
   * 解析函数参数
   * @param {string} paramsString - 参数字符串
   * @returns {Array} 参数对象数组
   */
  parseParameters(paramsString) {
    if (!paramsString.trim()) {
      return []
    }

    // 分割参数字符串并处理每个参数
    return paramsString.split(',').map((param) => {
      const trimmedParam = param.trim()
      const parts = trimmedParam.split('=')
      const name = parts[0].trim()
      const defaultValue = parts.length > 1 ? parts[1].trim() : undefined

      // 检查是否有类型注解
      const typeAnnotation = name.includes(':') ? name.split(':') : null
      const paramName = typeAnnotation ? typeAnnotation[0].trim() : name
      const paramType = typeAnnotation ? typeAnnotation[1].trim() : ''

      return {
        name: paramName,
        type: paramType,
        hasDefaultValue: defaultValue !== undefined,
        defaultValue
      }
    })
  }

  /**
   * 获取自定义函数列表
   * @returns {Array} 自定义函数数组
   */
  getCustomFunctions() {
    return Array.from(this.customFunctions.values())
  }

  /**
   * 分析并提取自定义类
   * @param {string} code - Python代码
   */
  analyzeCustomClasses(code) {
    // 正则表达式匹配Python类定义
    // 格式: class ClassName(BaseClass):
    const classRegex = /class\s+([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?\s*:/g
    const docstringRegex = /"""([\s\S]*?)"""/

    let match
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1]
      const baseClasses = match[2] ? match[2].split(',').map((base) => base.trim()) : []

      // 查找类的文档字符串
      let docstring = ''
      const classBodyStart = code.indexOf(':', match.index) + 1
      const classBodyPart = code.substring(classBodyStart, classBodyStart + 500) // 限制搜索范围
      const docMatch = docstringRegex.exec(classBodyPart)
      if (docMatch) {
        docstring = docMatch[1].trim()
      }

      // 存储类信息
      this.customClasses.set(className, {
        name: className,
        baseClasses,
        docstring
      })

      // 分析类的方法和属性（可以在未来扩展）
    }
  }

  /**
   * 获取自定义类列表
   * @returns {Array} 自定义类数组
   */
  getCustomClasses() {
    return Array.from(this.customClasses.values())
  }

  /**
   * 分析并提取变量
   * @param {string} code - Python代码
   */
  analyzeVariables(code) {
    // 匹配变量赋值语句
    const variableRegex = /^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/gm
    // 匹配类属性赋值
    const selfRegex = /^\s*self\.([a-zA-Z_]\w*)\s*=\s*(.+)$/gm

    // 匹配for循环变量
    const forLoopRegex = /for\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s+in\s+.+:/gm

    // 匹配多重赋值
    const multiAssignRegex = /^\s*([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*=\s*(.+)$/gm

    // 处理变量赋值
    let match
    while ((match = variableRegex.exec(code)) !== null) {
      const variableName = match[1].trim()
      const value = match[2].trim()

      // 排除关键字、函数定义和类定义
      if (!this.isKeywordOrDefinition(variableName, code, match.index)) {
        // 检查变量是否是类的实例
        const instanceOfClass = this.checkIfClassInstance(value)

        this.variables.set(variableName, {
          name: variableName,
          value: value,
          type: this.inferType(value),
          instanceOf: instanceOfClass // 如果是类实例，记录类名
        })
      }
    }

    while ((match = selfRegex.exec(code)) !== null) {
      const variableName = match[1].trim()
      const value = match[2].trim()

      // 排除关键字、函数定义和类定义
      if (!this.isKeywordOrDefinition(variableName, code, match.index)) {
        // 检查变量是否是类的实例
        const instanceOfClass = this.checkIfClassInstance(value)

        this.variables.set(variableName, {
          name: variableName,
          value: value,
          type: '实例变量',
          instanceOf: instanceOfClass // 如果是类实例，记录类名
        })
      }
    }
    // 处理for循环变量
    while ((match = forLoopRegex.exec(code)) !== null) {
      const variables = match[1].split(',').map((v) => v.trim())

      variables.forEach((variableName) => {
        if (!this.isKeywordOrDefinition(variableName, code, match.index)) {
          this.variables.set(variableName, {
            name: variableName,
            value: 'for循环变量',
            type: 'unknown'
          })
        }
      })
    }

    // 处理多重赋值
    while ((match = multiAssignRegex.exec(code)) !== null) {
      const variables = match[1].split(',').map((v) => v.trim())
      const value = match[2].trim()

      variables.forEach((variableName) => {
        if (!this.isKeywordOrDefinition(variableName, code, match.index)) {
          this.variables.set(variableName, {
            name: variableName,
            value: value,
            type: 'unknown'
          })
        }
      })
    }
  }

  /**
   * 检查变量值是否是类的实例
   * @param {string} value - 变量值
   * @returns {string|null} 如果是类实例，返回类名，否则返回null
   */
  checkIfClassInstance(value) {
    // 匹配类实例化模式：ClassName(...) 或 ClassName()
    const instanceRegex = /^([A-Za-z_]\w*)\s*\(/
    const match = instanceRegex.exec(value)

    if (match && this.customClasses.has(match[1])) {
      return match[1] // 返回类名
    }

    return null
  }

  /**
   * 检查标识符是否为关键字或函数/类定义
   * @param {string} name - 标识符名称
   * @returns {boolean} 是否为关键字或定义
   */
  isKeywordOrDefinition(name) {
    // Python关键字列表
    const keywords = [
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
    ]

    // 检查是否为关键字
    if (keywords.includes(name)) {
      return true
    }

    // 检查是否为函数名或类名
    return this.customFunctions.has(name) || this.customClasses.has(name)
  }

  /**
   * 推断变量类型
   * @param {string} value - 变量值
   * @returns {string} 推断的类型
   */
  inferType(value) {
    value = value.trim()

    // 检查字符串
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return 'str'
    }

    // 检查数字
    if (/^\d+$/.test(value)) {
      return 'int'
    }

    if (/^\d+\.\d+$/.test(value)) {
      return 'float'
    }

    // 检查列表
    if (value.startsWith('[') && value.endsWith(']')) {
      return 'list'
    }

    // 检查字典
    if (value.startsWith('{') && value.endsWith('}')) {
      return 'dict'
    }

    // 检查元组
    if (value.startsWith('(') && value.endsWith(')')) {
      return 'tuple'
    }

    // 检查布尔值
    if (value === 'True' || value === 'False') {
      return 'bool'
    }

    // 检查None
    if (value === 'None') {
      return 'None'
    }

    // 默认为未知类型
    return 'unknown'
  }

  /**
   * 获取变量列表
   * @returns {Array} 变量数组
   */
  getVariables() {
    return Array.from(this.variables.values())
  }
}

// 创建全局实例
const codeBlockManager = new CodeBlockManager()

// 导出实例和类
export { codeBlockManager, CodeBlockManager }
