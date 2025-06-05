import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

let mainWindow = null
let settingWindow = null

/**
 * 创建主窗口
 */
export function createMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
        return mainWindow
    }

    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        title: '喵咕IDE',
        icon: icon,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url).then()
        return { action: 'deny' }
    })

    // 加载页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).then()
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html')).then()
    }

    return mainWindow
}

/**
 * 创建设置窗口
 */
export function createSettingWindow() {
    if (settingWindow && !settingWindow.isDestroyed()) {
        settingWindow.show()
        settingWindow.focus()
        return settingWindow
    }

    settingWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        title: '设置',
        icon: icon,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    settingWindow.on('ready-to-show', () => {
        settingWindow.show()
    })

    settingWindow.on('closed', () => {
        settingWindow = null
    })

    settingWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url).catch(console.error)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        settingWindow
            .loadURL(`${process.env['ELECTRON_RENDERER_URL']}/setting.html`)
            .catch(console.error)
    } else {
        settingWindow.loadFile(join(__dirname, '../renderer/setting.html')).catch(console.error)
    }

    return settingWindow
}
/**
 * 获取所有窗口
 */
export function getAllWindows() {
    return BrowserWindow.getAllWindows()
}

/**
 * 广播消息到所有窗口
 */
export function broadcastToAllWindows(channel, ...args) {
    getAllWindows().forEach((window) => {
        if (window && window.webContents && !window.isDestroyed()) {
            window.webContents.send(channel, ...args)
        }
    })
}
