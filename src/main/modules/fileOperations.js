import { dialog, app } from 'electron'
import fs from 'fs'
import { join } from 'path'
import { TextDecoder } from 'text-encoding'
import { detectFileEncoding } from '../utils/encodingUtils.js'

/**
 * 打开文件对话框
 */
export async function openFileDialog(window) {
    try {
        if (!window) return { canceled: true }

        return await dialog.showOpenDialog(window, {
            title: '打开文件',
            filters: [{ name: '所有文件', extensions: ['*'] }],
            properties: ['openFile']
        })
    } catch (error) {
        console.error('打开文件对话框失败:', error)
        return { canceled: true, error: error.message }
    }
}

/**
 * 设置打开文件
 */
export async function setOpenFile(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 检查是否为目录
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
            return { success: false, message: '无法打开目录，请选择一个文件' }
        }

        // 读取文件内容
        const fileName = filePath.split(/[\\/]/).pop()

        // 检测文件编码
        const buffer = fs.readFileSync(filePath)
        const encoding = detectFileEncoding(buffer)
        const content = new TextDecoder(encoding).decode(buffer)

        // 检测行尾序列
        let lineEnding = 'LF'
        if (content.includes('\r\n')) {
            lineEnding = 'CRLF'
        } else if (content.includes('\r') && !content.includes('\n')) {
            lineEnding = 'CR'
        }

        return {
            success: true,
            filePath,
            fileName,
            content,
            encoding,
            lineEnding,
            isTemporary: false
        }
    } catch (error) {
        console.error('设置打开文件失败:', error)
        return { success: false, message: `设置打开文件失败: ${error.message}` }
    }
}

/**
 * 保存文件对话框
 */
export async function saveFileDialog(window, options) {
    try {
        if (!window) return { canceled: true }

        return await dialog.showSaveDialog(window, {
            title: options.title || '保存文件',
            defaultPath: options.defaultPath,
            filters: options.filters || [{ name: '所有文件', extensions: ['*'] }],
            properties: options.properties || []
        })
    } catch (error) {
        console.error('保存文件对话框失败:', error)
        return { canceled: true, error: error.message }
    }
}

/**
 * 保存文件
 */
export async function saveFile(filePath, content) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查是否为临时文件
        const tempDir = join(app.getPath('userData'), 'temp')
        const isTemp = filePath.startsWith(tempDir)
        let wasTemp = isTemp

        if (isTemp) {
            // 如果是临时文件，调用另存为对话框
            const { canceled, filePath: newPath } = await dialog.showSaveDialog({
                title: '另存为',
                defaultPath: filePath.substring(filePath.lastIndexOf('\\') + 1),
                filters: [{ name: '所有文件', extensions: ['*'] }]
            })

            if (canceled || !newPath) {
                return { success: false, message: '用户取消了保存操作' }
            }

            filePath = newPath
        }

        // 确保目录存在
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'))
        if (dirPath && !fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }

        // 写入文件
        fs.writeFileSync(filePath, content, 'utf8')

        // 返回文件状态信息
        const fileName = filePath.split(/[\\/]/).pop()
        return {
            success: true,
            message: '文件保存成功',
            filePath,
            fileName,
            wasTemp,
            isTemporary: false
        }
    } catch (error) {
        console.error('保存文件失败:', error)
        return { success: false, message: `保存文件失败: ${error.message}` }
    }
}

/**
 * 确保临时目录存在
 */
export async function ensureTempDir() {
    try {
        const tempDir = join(app.getPath('userData'), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        return { success: true, tempDir }
    } catch (error) {
        console.error('创建临时目录失败:', error)
        return { success: false, message: `创建临时目录失败: ${error.message}` }
    }
}

/**
 * 创建临时文件
 */
export async function createTempFile(filePath, content = '') {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 确保目录存在
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'))
        if (dirPath && !fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }

        // 直接写入文件
        fs.writeFileSync(filePath, content, 'utf8')

        return {
            success: true,
            filePath,
            message: '临时文件创建成功'
        }
    } catch (error) {
        console.error('创建临时文件失败:', error)
        return { success: false, message: error.message }
    }
}

/**
 * 从本地文件导入代码
 */
export async function importCodeFromFile(window, filePath) {
    try {
        if (!window) return { success: false, message: '无法获取当前窗口' }

        // 如果没有提供文件路径，则显示文件选择对话框
        if (!filePath) {
            const { canceled, filePaths } = await dialog.showOpenDialog(window, {
                title: '导入文件',
                filters: [{ name: '所有文件', extensions: ['*'] }],
                properties: ['openFile']
            })

            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, message: '用户取消了导入操作' }
            }

            filePath = filePaths[0]
        }

        // 读取文件
        const buffer = fs.readFileSync(filePath)
        const encoding = detectFileEncoding(buffer)
        const content = new TextDecoder(encoding).decode(buffer)
        return { success: true, message: '文件导入成功', content, filePath: filePath }
    } catch (error) {
        console.error('导入文件失败:', error)
        return { success: false, message: `导入文件失败: ${error.message}` }
    }
}

/**
 * 检查文件是否存在
 */
export async function checkFileExists(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { exists: false, message: '未提供有效的文件路径' }
        }
        const exists = fs.existsSync(filePath)
        return { exists, message: exists ? '文件存在' : '文件不存在' }
    } catch (error) {
        console.error('检查文件是否存在失败:', error)
        return { exists: false, message: `检查文件是否存在失败: ${error.message}` }
    }
}

/**
 * 删除文件
 */
export async function deleteFile(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 删除文件
        fs.unlinkSync(filePath)
        return { success: true, message: '文件删除成功' }
    } catch (error) {
        console.error('删除文件失败:', error)
        return { success: false, message: `删除文件失败: ${error.message}` }
    }
}

/**
 * 获取文件内容
 */
export async function getFileContent(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 读取文件内容
        const buffer = fs.readFileSync(filePath)
        const encoding = detectFileEncoding(buffer)
        const content = new TextDecoder(encoding).decode(buffer)
        return { success: true, content }
    } catch (error) {
        console.error('读取文件内容失败:', error)
        return { success: false, message: `读取文件内容失败: ${error.message}` }
    }
}

/**
 * 获取目录内容
 */
export async function getDirectoryContents(dirPath) {
    try {
        if (!dirPath || typeof dirPath !== 'string') {
            return { success: false, message: '未提供有效的目录路径' }
        }

        // 检查目录是否存在
        if (!fs.existsSync(dirPath)) {
            return { success: false, message: '目录不存在' }
        }

        // 检查是否为目录
        const stats = fs.statSync(dirPath)
        if (!stats.isDirectory()) {
            return { success: false, message: '提供的路径不是目录' }
        }

        // 读取目录内容
        const files = fs.readdirSync(dirPath, { withFileTypes: true })
        const contents = files.map((file) => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: join(dirPath, file.name)
        }))

        return { success: true, contents }
    } catch (error) {
        console.error('获取目录内容失败:', error)
        return { success: false, message: `获取目录内容失败: ${error.message}` }
    }
}

/**
 * 获取文件行尾序列
 */
export async function getFileLineEnding(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 读取文件内容为Buffer
        const buffer = fs.readFileSync(filePath)

        // 检测文件编码
        const encoding = detectFileEncoding(buffer)

        // 使用检测到的编码解码内容
        const content = new TextDecoder(encoding).decode(buffer)

        // 检测行尾序列
        let lineEnding = 'LF'
        if (content.includes('\r\n')) {
            lineEnding = 'CRLF'
        } else if (content.includes('\r') && !content.includes('\n')) {
            lineEnding = 'CR'
        }

        return {
            success: true,
            lineEnding,
            encoding
        }
    } catch (error) {
        console.error('检测文件行尾序列失败:', error)
        return { success: false, message: `检测文件行尾序列失败: ${error.message}` }
    }
}

/**
 * 设置文件行尾序列
 */
export async function setFileLineEnding(filePath, lineEnding) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, message: '未提供有效的文件路径' }
        }

        if (!lineEnding || typeof lineEnding !== 'string') {
            return { success: false, message: '未提供有效的行尾序列' }
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return { success: false, message: '文件不存在' }
        }

        // 读取文件内容
        const buffer = fs.readFileSync(filePath)
        const encoding = detectFileEncoding(buffer)
        let content = new TextDecoder(encoding).decode(buffer)

        // 标准化所有行尾为LF
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        // 根据指定的行尾序列重新格式化
        if (lineEnding === 'CRLF') {
            content = content.replace(/\n/g, '\r\n')
        } else if (lineEnding === 'CR') {
            content = content.replace(/\n/g, '\r')
        }

        fs.writeFileSync(filePath, content, 'utf8')

        return { success: true, message: '文件行尾序列已更新' }
    } catch (error) {
        console.error('设置文件行尾序列失败:', error)
        return { success: false, message: `设置文件行尾序列失败: ${error.message}` }
    }
}
