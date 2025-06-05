/**
 * 文件名处理工具
 * 优化文件名相关的字符串处理算法
 */

// 文件扩展名缓存
const extensionCache = new Map()
const MAX_EXTENSION_CACHE_SIZE = 500
/**
 * 文件扩展名检测
 * 使用缓存和优化算法
 * @param {string} fileName - 文件名
 * @returns {string} 文件扩展名（小写）
 */
export const getFileExtensionOptimized = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return ''

    // 检查缓存
    if (extensionCache.has(fileName)) {
        return extensionCache.get(fileName)
    }

    // 清理缓存
    if (extensionCache.size >= MAX_EXTENSION_CACHE_SIZE) {
        const firstKey = extensionCache.keys().next().value
        extensionCache.delete(firstKey)
    }

    let extension = ''
    let lastDotIndex = -1

    // 从后往前查找最后一个点
    for (let i = fileName.length - 1; i >= 0; i--) {
        if (fileName[i] === '.') {
            lastDotIndex = i
            break
        }
    }

    if (lastDotIndex !== -1 && lastDotIndex < fileName.length - 1) {
        extension = fileName.substring(lastDotIndex + 1).toLowerCase()
    }

    // 缓存结果
    extensionCache.set(fileName, extension)
    return extension
}

/**
 * 高性能文件类型检测
 * 使用预定义的扩展名集合进行快速查找
 * @param {string} fileName - 文件名
 * @param {Set} extensionSet - 扩展名集合
 * @returns {boolean} 是否匹配
 */
export const isFileTypeOptimized = (fileName, extensionSet) => {
    if (!fileName || !extensionSet) return false

    const extension = getFileExtensionOptimized(fileName)
    return extensionSet.has(extension)
}

// 预定义的文件类型集合
export const FILE_TYPE_SETS = {
    javascript: new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs']),
    html: new Set(['html', 'htm', 'xhtml']),
    css: new Set(['css', 'scss', 'sass', 'less']),
    image: new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']),
    document: new Set(['txt', 'md', 'pdf', 'doc', 'docx']),
    archive: new Set(['zip', 'rar', '7z', 'tar', 'gz'])
}

/**
 * 快速JavaScript文件检测
 * @param {string} fileName - 文件名
 * @returns {boolean} 是否为JavaScript文件
 */
export const isJavaScriptFileOptimized = (fileName) => {
    return isFileTypeOptimized(fileName, FILE_TYPE_SETS.javascript)
}

/**
 * 快速HTML文件检测
 * @param {string} fileName - 文件名
 * @returns {boolean} 是否为HTML文件
 */
export const isHTMLFileOptimized = (fileName) => {
    return isFileTypeOptimized(fileName, FILE_TYPE_SETS.html)
}
