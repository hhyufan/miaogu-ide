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
        // 演练场代码编辑内容
        codeEditorContents: {},
        setting: {
            // 字体大小
            fontSize: 14,
            // 字体
            fontFamily: 'JetBrains Mono',
            // 背景图片
            bgImage: ''
        },
        savedImage: '',
        // 透明度
        transparency: {
            light: 50,
            dark: 50
        },
        randomBackground: false
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
    const setting = store.get('setting')
    return setting.fontSize || 14
}

/**
 * 设置字体大小
 * @param {number} fontSize 字体大小
 */
function setFontSize(fontSize) {
    const setting = store.get('setting')
    setting.fontSize = fontSize
    store.set('setting', setting)
}

/**
 * 设置字体
 * @param {string} fontFamily 字体名称
 */

function setFontFamily(fontFamily) {
    const setting = store.get('setting')
    setting.fontFamily = fontFamily
    store.set('setting', setting)
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

/**
 * 获取设置
 * @returns {Object} 存储的设置值
 */
function getSetting() {
    return store.get('setting')
}

/**
 * 设置设置
 * @param {Object} setting 要存储的设置值
 * @returns {boolean} 操作是否成功
 */
function setSetting(setting) {
    try {
        store.set('setting', setting)
        return true
    } catch (error) {
        console.error(`设置失败:`, error)
        return false
    }
}

/**
 * 获取背景图片路径
 * @returns {string} 背景图片路径
 */
function getBgImage() {
    const setting = store.get('setting')
    return setting.bgImage || ''
}

/**
 * 设置背景图片路径
 * @param {string} bgImage 背景图片路径
 */
function setBgImage(bgImage) {
    const setting = store.get('setting')
    setting.bgImage = bgImage
    store.set('setting', setting)
}

/**
 * 获取保存的图片路径
 * @returns {string} 保存的图片路径
 */
function getSavedImage() {
    return store.get('savedImage')
}

/**
 * 设置保存的图片路径
 * @param {string} savedImage 保存的图片路径
 */
function setSavedImage(savedImage) {
    store.set('savedImage', savedImage)
}

function setTransparency(theme, value) {
    const transparency = store.get('transparency') || {}
    transparency[theme] = value
    store.set('transparency', transparency)
}

function getTransparency() {
    return store.get('transparency')
}

export default {
    getTheme,
    setTheme,
    getFontSize,
    setFontSize,
    getCodeEditorContent,
    setCodeEditorContent,
    getState,
    setState,
    getSetting,
    setSetting,
    getBgImage,
    setBgImage,
    getSavedImage,
    setSavedImage,
    getTransparency,
    setTransparency,
    setFontFamily
}
