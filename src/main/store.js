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
    // 当前选中的教程
    currentTutorial: '基础知识',
    // 各教程的学习状态
    tutorialStates: {},
    // 已完成的练习
    completedExercises: [],
    // 主题设置
    theme: 'light',
    // 演练场代码编辑内容
    codeEditorContents: {}
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
  getCodeEditorContent,
  setCodeEditorContent,
  getState,
  setState
}
