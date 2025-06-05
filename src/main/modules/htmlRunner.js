import { shell, app } from 'electron'
import fs from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { TextDecoder } from 'text-encoding'
import { detectFileEncoding } from '../utils/encodingUtils.js'

/**
 * 运行HTML文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {Promise<Object>} - 操作结果
 */
export async function runHtmlFile(filePath, content) {
    try {
        if (!filePath && !content) {
            return { success: false, message: '未提供文件路径或内容' }
        }

        let htmlContent = content
        let targetFilePath = filePath

        // 如果没有提供内容，从文件读取
        if (!htmlContent && filePath) {
            // 验证文件路径
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, message: '文件路径无效' }
            }

            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                return { success: false, message: `文件不存在: ${filePath}` }
            }

            try {
                const buffer = fs.readFileSync(filePath)
                const encoding = detectFileEncoding(buffer)
                htmlContent = new TextDecoder(encoding).decode(buffer)
                targetFilePath = filePath
            } catch (readError) {
                return { success: false, message: `读取文件失败: ${readError.message}` }
            }
        }

        // 如果是临时内容，创建临时文件
        if (!filePath && content) {
            try {
                const tempDir = join(app.getPath('userData'), 'temp')
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true })
                }
                const tempFileName = `temp_${Date.now()}.html`
                targetFilePath = join(tempDir, tempFileName)
                fs.writeFileSync(targetFilePath, htmlContent, 'utf8')
            } catch (tempError) {
                return { success: false, message: `创建临时文件失败: ${tempError.message}` }
            }
        }

        // 最终验证目标文件是否存在
        if (!fs.existsSync(targetFilePath)) {
            return { success: false, message: `目标文件不存在: ${targetFilePath}` }
        }

        const fileUrl = targetFilePath
        try {
            if (process.platform === 'win32') {
                await shell.openExternal(fileUrl).catch(() => {
                    exec(`start "" "${fileUrl}"`, (error) => {
                        if (error) {
                            console.error('HTML文件已在浏览器中打开失败:', error)
                        }
                    })
                })
                return {
                    success: true,
                    message: 'HTML文件已在浏览器中打开',
                    filePath: targetFilePath,
                    fileUrl: fileUrl
                }
            }
        } catch (error) {
            console.error('运行HTML文件失败:', error)
            return { success: false, message: `运行HTML文件失败: ${error.message}` }
        }
    } catch (error) {
        console.error('运行HTML文件失败:', error)
        return { success: false, message: `运行HTML文件失败: ${error.message}` }
    }
}

/**
 * 更新临时HTML文件内容
 * @param {string} tempFilePath - 临时文件路径
 * @param {string} content - 新内容
 * @returns {Promise<Object>} - 操作结果
 */
export async function updateTempHtmlFile(tempFilePath, content) {
    try {
        if (!tempFilePath || !content) {
            return { success: false, message: '未提供临时文件路径或内容' }
        }

        // 检查临时文件是否存在
        if (!fs.existsSync(tempFilePath)) {
            return { success: false, message: `临时文件不存在: ${tempFilePath}` }
        }

        // 更新临时文件内容
        fs.writeFileSync(tempFilePath, content, 'utf8')

        return {
            success: true,
            message: '临时HTML文件已更新',
            filePath: tempFilePath
        }
    } catch (error) {
        console.error('更新临时HTML文件失败:', error)
        return { success: false, message: `更新临时HTML文件失败: ${error.message}` }
    }
}

/**
 * 创建临时HTML文件
 * @param {string} content - HTML内容
 * @param {string} fileName - 文件名（可选）
 * @returns {Promise<Object>} - 操作结果
 */
export async function createTempHtmlFile(content, fileName) {
    try {
        if (!content) {
            return { success: false, message: '未提供HTML内容' }
        }

        const tempDir = join(app.getPath('userData'), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const tempFileName = fileName || `temp_${Date.now()}.html`
        const tempFilePath = join(tempDir, tempFileName)
        
        fs.writeFileSync(tempFilePath, content, 'utf8')

        return {
            success: true,
            message: '临时HTML文件创建成功',
            filePath: tempFilePath
        }
    } catch (error) {
        console.error('创建临时HTML文件失败:', error)
        return { success: false, message: `创建临时HTML文件失败: ${error.message}` }
    }
}

/**
 * 清理临时HTML文件
 * @param {string} tempFilePath - 临时文件路径
 * @returns {Promise<Object>} - 操作结果
 */
export async function cleanupTempHtmlFile(tempFilePath) {
    try {
        if (!tempFilePath) {
            return { success: false, message: '未提供临时文件路径' }
        }

        // 检查文件是否存在
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath)
            return { success: true, message: '临时HTML文件已清理' }
        }

        return { success: true, message: '临时文件不存在，无需清理' }
    } catch (error) {
        console.error('清理临时HTML文件失败:', error)
        return { success: false, message: `清理临时HTML文件失败: ${error.message}` }
    }
}