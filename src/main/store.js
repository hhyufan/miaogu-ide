// 导入electron-store模块
import Store from 'electron-store'
import { app } from 'electron'
// 创建Store实例用于持久化存储
const store = new Store({
  name: 'user-state', // 存储文件名
  // 确保存储在用户数据目录下
  cwd: app.getPath('userData'),
  // 定义存储结构的默认值
  defaults: {
    // 主题设置
    theme: 'light',
    // 代码编辑内容
    codeEditorContents: {},
    settings: {
      fontSize: 14,
      fontFamily: 'Courier New',
      bgImage: ''
    }
  }
})

/**
 * 获取主题设置
 * @returns {string} 主题名称 ('light' 或 'dark')
 */
function getTheme() {
  return store.get('theme')
}

/**
 * 设置主题
 * @param {string} theme 主题名称 ('light' 或 'dark')
 */
function setTheme(theme) {
  store.set('theme', theme)
}

/**
 * 获取字体大小设置
 * @returns {number} 字体大小
 */
function getFontSize() {
  const settings = store.get('settings')
  return settings.fontSize || 14
}

/**
 * 设置字体大小
 * @param {number} fontSize 字体大小
 */
function setFontSize(fontSize) {
  const settings = store.get('settings')
  settings.fontSize = fontSize
  store.set('settings', settings)
}

/**
 * 获取代码编辑内容
 * @returns {string} 保存的代码内容
 */
function getCodeEditorContent() {
  const codeEditorContents = store.get('codeEditorContents')
  const key = `code-editor`
  return codeEditorContents[key] || ''
}

/**
 * 设置代码编辑内容
 * @param {string} content 代码内容
 */
function setCodeEditorContent(content) {
  const codeEditorContents = store.get('codeEditorContents')
  const key = `code-editor`
  codeEditorContents[key] = content
  store.set('codeEditorContents', codeEditorContents)
}

/**
 * 获取通用状态
 * @param {string} key 状态键名
 * @returns {any} 存储的状态值
 */
function getState(key) {
  return store.get(key, null)
}

/**
 * 设置通用状态
 * @param {string} key 状态键名
 * @param {any} value 要存储的状态值
 * @returns {boolean} 操作是否成功
 */
function setState(key, value) {
  try {
    store.set(key, value)
    return true
  } catch (error) {
    console.error(`设置状态[${key}]失败:`, error)
    return false
  }
}

export default {
  getTheme,
  setTheme,
  getFontSize,
  setFontSize,
  getCodeEditorContent,
  setCodeEditorContent,
  getState,
  setState
}
