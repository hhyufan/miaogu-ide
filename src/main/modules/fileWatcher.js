import chokidar from 'chokidar'
import fs from 'fs'
import { TextDecoder } from 'text-encoding'
import { detectFileEncoding, detectLineEnding } from '../utils/encodingUtils.js'

// 文件监听器实例
let fileWatcher = null
// 当前打开的文件路径
let currentOpenFilePath = null
// 文件最后修改时间
let lastModifiedTime = null
// 设置IPC事件最大监听器数量
const MAX_LISTENERS = 20

/**
 * 开始监听文件变化
 * @param {string} filePath - 要监听的文件路径
 * @param {BrowserWindow} window - 主窗口实例
 */
export function startWatchingFile(filePath, window) {
    if (!window) return

    // 在创建新的监听器之前，确保先停止之前的监听
    stopWatchingFile()

    // 设置IPC事件最大监听器数量
    if (window.webContents) {
        window.webContents.setMaxListeners(MAX_LISTENERS)
    }

    // 使用chokidar监听文件变化
    fileWatcher = chokidar.watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    })

    // 监听文件变化事件
    fileWatcher.on('change', (path) => {
        try {
            // 获取文件的最新修改时间
            const stats = fs.statSync(path)
            const currentModifiedTime = stats.mtimeMs

            // 如果修改时间不同，说明文件被外部修改了
            if (currentModifiedTime !== lastModifiedTime) {
                // 更新最后修改时间
                lastModifiedTime = currentModifiedTime

                // 读取文件内容为Buffer
                const buffer = fs.readFileSync(path)

                // 检测文件编码
                const encoding = detectFileEncoding(buffer)

                // 使用检测到的编码解码内容
                let content
                try {
                    content = new TextDecoder(encoding).decode(buffer)
                } catch (decodeError) {
                    console.error(`使用编码 ${encoding} 解码失败:`, decodeError)
                    // 回退到UTF-8
                    content = new TextDecoder('utf-8').decode(buffer)
                }

                // 检测行尾序列
                const lineEnding = detectLineEnding(content)

                // 通知渲染进程文件已被外部修改
                window.webContents.send('file-changed-externally', {
                    filePath: path,
                    content,
                    encoding,
                    lineEnding
                })
            }
        } catch (error) {
            console.error('处理文件变化事件失败:', error)
        }
    })

    // 监听文件删除事件
    fileWatcher.on('unlink', (path) => {
        try {
            // 通知渲染进程文件已被删除
            window.webContents.send('file-deleted-externally', {
                filePath: path
            })

            // 停止监听
            stopWatchingFile()
        } catch (error) {
            console.error('处理文件删除事件失败:', error)
        }
    })

    // 设置当前监听的文件路径
    currentOpenFilePath = filePath
}

/**
 * 停止监听文件变化
 */
export function stopWatchingFile() {
    if (fileWatcher) {
        // 移除所有事件监听器
        fileWatcher.removeAllListeners('change')
        fileWatcher.removeAllListeners('unlink')
        // 关闭文件监听器
        fileWatcher.close()
        fileWatcher = null
        currentOpenFilePath = null
        lastModifiedTime = null
    }
}

/**
 * 开始监听文件
 * @param {string} filePath - 文件路径
 * @param {BrowserWindow} window - 窗口实例
 * @returns {Promise<Object>} - 操作结果
 */
export async function watchFile(filePath, window) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 获取文件的最后修改时间
        const stats = fs.statSync(filePath)
        lastModifiedTime = stats.mtimeMs

        // 如果已经在监听其他文件，先停止监听
        if (fileWatcher) {
            stopWatchingFile()
        }

        // 开始监听文件变化
        startWatchingFile(filePath, window)

        return { success: true, message: '开始监听文件变化' }
    } catch (error) {
        console.error('监听文件变化失败:', error)
        return { success: false, message: `监听文件变化失败: ${error.message}` }
    }
}

/**
 * 停止监听文件
 * @returns {Promise<Object>} - 操作结果
 */
export async function stopWatching() {
    try {
        stopWatchingFile()
        return { success: true, message: '停止监听文件变化' }
    } catch (error) {
        console.error('停止监听文件变化失败:', error)
        return { success: false, message: `停止监听文件变化失败: ${error.message}` }
    }
}

/**
 * 获取当前监听的文件路径
 * @returns {string|null} - 当前监听的文件路径
 */
export function getCurrentWatchedFile() {
    return currentOpenFilePath
}
