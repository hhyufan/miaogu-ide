// Monaco编辑器配置文件
import oneLightTheme from './monaco-one-light-theme'
import oneDarkTheme from './monaco-one-dark-theme'
import initPythonLanguage from './language/monaco-python-language'
import initJavaScriptLanguage from './language/monaco-javascript-language'
import { codeBlockManager } from './code-block-manager'

const monaco = {
  init: () => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js'
    script.onload = () => {
      window.require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' },
        'vs/nls': { availableLanguages: { '*': 'zh-cn' } }
      })

      // 将codeBlockManager挂载到window对象上，使其全局可用
      window.codeBlockManager = codeBlockManager

      // 加载Monaco编辑器
      window.require(['vs/editor/editor.main'], () => {
        // 注册自定义主题
        window.monaco.editor.defineTheme('one-light', oneLightTheme)
        window.monaco.editor.defineTheme('one-dark', oneDarkTheme)
        // 初始化Python语言定义，包括自定义语法高亮规则
        initPythonLanguage()
        // 初始化JavaScript语言定义，包括自定义语法高亮规则
        initJavaScriptLanguage()
      })
    }
    document.body.appendChild(script)
  },

  // 获取当前主题名称
  getThemeName: (isDark) => {
    return isDark ? 'one-dark' : 'one-light'
  }
}

// 初始化Monaco编辑器
monaco.init()

// 导出加载器
export { monaco }
