import { ipcMain, BrowserWindow, shell, dialog } from 'electron'
import stateStore from '../store.js'
import * as fileOps from './fileOperations.js'
import * as fileWatcher from './fileWatcher.js'
import * as htmlRunner from './htmlRunner.js'
import { broadcastToAllWindows, createSettingWindow } from './windowManager.js'

/**
 * 注册所有IPC处理器
 */
export function registerIpcHandlers() {
    // 窗口控制
    registerWindowControlHandlers()
    
    // 文件操作
    registerFileOperationHandlers()
    
    // 文件监听
    registerFileWatcherHandlers()
    
    // HTML运行
    registerHtmlRunnerHandlers()
    
    // 状态管理
    registerStateHandlers()
    
    // 设置相关
    registerSettingHandlers()
    
    // 外部链接
    registerExternalHandlers()
}

/**
 * 注册窗口控制处理器
 */
function registerWindowControlHandlers() {
    ipcMain.on('window-control', (event, command) => {
        const window = BrowserWindow.getFocusedWindow()
        if (window) {
            switch (command) {
                case 'minimize':
                    window.minimize()
                    break
                case 'maximize':
                    if (window.isMaximized()) {
                        window.unmaximize()
                    } else {
                        window.maximize()
                    }
                    break
                case 'close':
                    window.close()
                    break
            }
        }
    })

    // 设置窗口控制
    ipcMain.on('setting-window-control', (event, command) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (window) {
            switch (command) {
                case 'minimize':
                    window.minimize()
                    break
                case 'maximize':
                    if (window.isMaximized()) {
                        window.unmaximize()
                    } else {
                        window.maximize()
                    }
                    break
                case 'close':
                    window.close()
                    break
            }
        }
    })

    ipcMain.handle('setting-window-control', (event, command) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (window) {
            switch (command) {
                case 'close':
                    window.close()
                    return true
                default:
                    return false
            }
        }
        return false
    })
}

/**
 * 注册文件操作处理器
 */
function registerFileOperationHandlers() {
    // 打开文件对话框
    ipcMain.handle('open-file', async () => {
        const win = BrowserWindow.getFocusedWindow()
        return await fileOps.openFileDialog(win)
    })

    // 设置打开文件
    ipcMain.handle('set-open-file', async (event, { filePath }) => {
        return await fileOps.setOpenFile(filePath)
    })

    // 保存文件对话框
    ipcMain.handle('save-file-dialog', async (event, options) => {
        const win = BrowserWindow.getFocusedWindow()
        return await fileOps.saveFileDialog(win, options)
    })

    // 保存文件
    ipcMain.handle('save-file', async (event, { filePath, content }) => {
        return await fileOps.saveFile(filePath, content)
    })

    // 确保临时目录存在
    ipcMain.handle('ensure-temp-dir', async () => {
        return await fileOps.ensureTempDir()
    })

    // 创建临时文件
    ipcMain.handle('create-temp-file', async (event, { filePath, content }) => {
        return await fileOps.createTempFile(filePath, content)
    })

    // 从本地文件导入代码
    ipcMain.handle('import-code-from-file', async (event, filePath) => {
        const win = BrowserWindow.getFocusedWindow()
        return await fileOps.importCodeFromFile(win, filePath)
    })

    // 检查文件是否存在
    ipcMain.handle('checkFileExists', async (event, filePath) => {
        return await fileOps.checkFileExists(filePath)
    })

    // 删除文件
    ipcMain.handle('deleteFile', async (event, filePath) => {
        // 如果删除的是当前监听的文件，停止监听
        if (filePath === fileWatcher.getCurrentWatchedFile()) {
            await fileWatcher.stopWatching()
        }
        return await fileOps.deleteFile(filePath)
    })

    // 获取文件内容
    ipcMain.handle('get-file-content', async (event, filePath) => {
        return await fileOps.getFileContent(filePath)
    })

    // 获取文件编码
    ipcMain.handle('get-file-encoding', async (event, filePath) => {
        const result = await fileOps.getFileLineEnding(filePath)
        return result.success ? result.encoding : { success: false, message: result.message }
    })

    // 获取目录内容
    ipcMain.handle('get-directory-contents', async (event, dirPath) => {
        return await fileOps.getDirectoryContents(dirPath)
    })

    // 获取文件行尾序列
    ipcMain.handle('get-file-line-ending', async (event, filePath) => {
        return await fileOps.getFileLineEnding(filePath)
    })

    // 设置文件行尾序列
    ipcMain.handle('set-file-line-ending', async (event, { filePath, lineEnding }) => {
        return await fileOps.setFileLineEnding(filePath, lineEnding)
    })
}

/**
 * 注册文件监听处理器
 */
function registerFileWatcherHandlers() {
    // 开始监听文件变化
    ipcMain.handle('watch-file', async (event, { filePath }) => {
        const win = BrowserWindow.getFocusedWindow()
        return await fileWatcher.watchFile(filePath, win)
    })

    // 停止监听文件变化
    ipcMain.handle('stop-watching-file', async () => {
        return await fileWatcher.stopWatching()
    })
}

/**
 * 注册HTML运行处理器
 */
function registerHtmlRunnerHandlers() {
    // 运行HTML文件
    ipcMain.handle('run-html-file', async (event, { filePath, content }) => {
        return await htmlRunner.runHtmlFile(filePath, content)
    })

    // 更新临时HTML文件内容
    ipcMain.handle('update-temp-html-file', async (event, { tempFilePath, content }) => {
        return await htmlRunner.updateTempHtmlFile(tempFilePath, content)
    })
}

/**
 * 注册状态管理处理器
 */
function registerStateHandlers() {
    // 获取状态
    ipcMain.handle('get-state', (event, key) => {
        switch (key) {
            case 'theme':
                return stateStore.getTheme()
            case 'fontSize':
                return stateStore.getFontSize()
            default:
                return stateStore.getState(key)
        }
    })

    // 设置主题
    ipcMain.handle('set-theme', (event, theme) => {
        stateStore.setTheme(theme)
        broadcastToAllWindows('toggle-theme', theme)
        return true
    })

    // 设置字体大小
    ipcMain.handle('set-font-size', (event, fontSize) => {
        stateStore.setFontSize(fontSize)
        broadcastToAllWindows('font-size-changed', fontSize)
        return true
    })

    // 设置行高
    ipcMain.handle('set-line-height', (event, lineHeight) => {
        stateStore.setLineHeight(lineHeight)
        broadcastToAllWindows('line-height-changed', lineHeight)
        return true
    })

    // 设置通用状态
    ipcMain.handle('set-state', (event, key, value) => {
        return stateStore.setState(key, value)
    })

    // 代码编辑器内容持久化
    ipcMain.handle('get-code-editor-content', () => {
        return stateStore.getCodeEditorContent()
    })

    ipcMain.handle('set-code-editor-content', (event, { content }) => {
        stateStore.setCodeEditorContent(content)
        return true
    })
}

/**
 * 注册设置相关处理器
 */
function registerSettingHandlers() {
    // 背景图片相关
    ipcMain.handle('set-bg-image', (_, bgImage) => {
        stateStore.setBgImage(bgImage)
        broadcastToAllWindows('bg-image-changed', bgImage)
        return true
    })

    ipcMain.handle('set-bg-transparency', (_, theme, transparency) => {
        stateStore.setTransparency(theme, transparency)
        broadcastToAllWindows('bg-transparency-changed', theme, transparency)
        return true
    })

    ipcMain.handle('set-font-family', (_, fontFamily) => {
        stateStore.setFontFamily(fontFamily)
        broadcastToAllWindows('font-family-changed', fontFamily)
        return true
    })

    ipcMain.handle('select-bg-image', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif'] }]
        })
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0]
            stateStore.setBgImage(filePath)
            broadcastToAllWindows('bg-image-changed', { filePath })
            return filePath
        }
        return null
    })

    // 设置窗口相关
    ipcMain.on('open-setting-window', () => {
        createSettingWindow()
    })

    ipcMain.handle('get-setting', () => {
        return stateStore.getSetting()
    })

    ipcMain.handle('set-setting', (event, setting) => {
        return stateStore.setSetting(setting)
    })

    // 背景相关getter/setter
    ipcMain.handle('get-bg-image', () => {
        return stateStore.getBgImage()
    })

    ipcMain.handle('get-bg-enabled', () => {
        return stateStore.getBgEnabled()
    })

    ipcMain.handle('set-bg-enabled', (event, enabled) => {
        stateStore.setBgEnabled(enabled)
        const bgImage = stateStore.getBgImage()
        broadcastToAllWindows('bg-image-changed', enabled ? bgImage : '')
        return true
    })

    ipcMain.handle('get-bg-transparency', () => {
        return stateStore.getTransparency()
    })

    // 高亮相关
    ipcMain.handle('get-highLight', () => {
        return stateStore.getHighLight()
    })

    ipcMain.handle('set-highLight', (event, highLight) => {
        stateStore.setHighLight(highLight)
        broadcastToAllWindows('highLight-changed', highLight)
        return true
    })
}

/**
 * 注册外部链接处理器
 */
function registerExternalHandlers() {
    // 在外部浏览器中打开链接
    ipcMain.handle('open-external', async (event, url) => {
        try {
            if (!url || typeof url !== 'string') {
                return { success: false, message: '未提供有效的URL' }
            }
            await shell.openExternal(url)
            return { success: true }
        } catch (error) {
            console.error('打开外部链接失败:', error)
            return { success: false, message: `打开外部链接失败: ${error.message}` }
        }
    })
}