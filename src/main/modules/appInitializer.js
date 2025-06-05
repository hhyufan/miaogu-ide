import { app, globalShortcut, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import fs from 'fs'
import stateStore from '../store.js'
import { createMainWindow, broadcastToAllWindows } from './windowManager.js'
import { registerIpcHandlers } from './ipcHandlers.js'

// 通过打开方式打开的文件路径
let openWithFilePath = null

/**
 * 初始化应用
 */
export function initializeApp() {
    // 设置应用用户模型ID
    electronApp.setAppUserModelId('com.electron')
    app.commandLine.appendSwitch('disable-site-isolation-trials')

    // 注册全局快捷键
    registerGlobalShortcuts()

    // 注册IPC处理器
    registerIpcHandlers()

    // 处理窗口创建优化
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // 创建主窗口
    createMainWindow()

    // 处理通过"打开方式"打开的文件
    handleOpenWithFile()
}

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
    // Ctrl+R 运行代码
    globalShortcut.register('CommandOrControl+R', () => {
        const win = BrowserWindow.getFocusedWindow()
        if (win) {
            win.webContents.send('run-code')
        }
    })

    // Ctrl+T 切换主题
    globalShortcut.register('CommandOrControl+T', () => {
        const currentTheme = stateStore.getTheme()
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
        stateStore.setTheme(nextTheme)
        broadcastToAllWindows('toggle-theme', nextTheme)
    })
}

/**
 * 处理通过"打开方式"打开文件
 */
function handleOpenWithFile() {
    // 如果有通过"打开方式"打开的文件，发送给渲染进程
    if (openWithFilePath) {
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
            setTimeout(() => {
                windows[0].webContents.send('open-with-file', { filePath: openWithFilePath })
            }, 1000) // 延迟发送，确保渲染进程已准备好
        }
    }
}

/**
 * 处理单实例应用
 */
export function handleSingleInstance() {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        return false
    }

    // 监听第二个实例启动
    app.on('second-instance', (event, commandLine) => {
        // 有人试图运行第二个实例，聚焦到主窗口
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore()
            windows[0].focus()

            // 检查命令行参数中是否有文件路径
            if (process.platform === 'win32' && commandLine.length > 1) {
                const filePath = commandLine[commandLine.length - 1]
                // 检查路径是否存在且是文件而非目录
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    handleOpenWithFileInternal(filePath)
                }
            }
        }
    })

    return true
}

/**
 * 处理启动参数
 */
export function handleStartupArgs() {
    // 检查启动参数
    if (process.platform === 'win32' && process.argv.length > 1) {
        const filePath = process.argv[process.argv.length - 1]
        // 检查路径是否存在且是文件而非目录
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            openWithFilePath = filePath
        }
    }
}

/**
 * 内部处理打开文件
 * @param {string} filePath - 文件路径
 */
function handleOpenWithFileInternal(filePath) {
    if (!filePath) return
    openWithFilePath = filePath

    // 如果应用已经启动，则发送消息给渲染进程
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
        windows[0].webContents.send('open-with-file', { filePath })
    }
}
/**
 * 清理资源
 */
export function cleanup() {
    // 注销全局快捷键
    globalShortcut.unregisterAll()
}
