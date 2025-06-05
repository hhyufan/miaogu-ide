/**
 * 高性能路径处理工具
 * 优化字符串处理算法，减少时间复杂度
 */

// 缓存路径分割结果，避免重复计算
const pathCache = new Map()
const MAX_CACHE_SIZE = 1000

/**
 * 高性能路径分割函数
 * 时间复杂度：O(n) -> O(1) (缓存命中时)
 * @param {string} path - 文件路径
 * @returns {Array} 路径段数组
 */
export const splitPath = (path) => {
    if (!path || typeof path !== 'string') return []

    // 检查缓存
    if (pathCache.has(path)) {
        return pathCache.get(path)
    }

    // 清理缓存大小
    if (pathCache.size >= MAX_CACHE_SIZE) {
        const firstKey = pathCache.keys().next().value
        pathCache.delete(firstKey)
    }

    const segments = []
    let current = ''
    let i = 0

    // 处理Windows盘符
    if (path.length >= 2 && path[1] === ':') {
        segments.push(path.substring(0, 2) + '\\')
        i = 3 // 跳过 "C:\\"
    }

    // 单次遍历分割路径
    for (; i < path.length; i++) {
        const char = path[i]
        if (char === '\\' || char === '/') {
            if (current) {
                segments.push(current)
                current = ''
            }
        } else {
            current += char
        }
    }

    // 添加最后一个段
    if (current) {
        segments.push(current)
    }

    // 缓存结果
    pathCache.set(path, segments)
    return segments
}

/**
 * 高性能文件名提取
 * 时间复杂度：O(n) -> O(1) (对于短路径)
 * @param {string} path - 文件路径
 * @returns {string} 文件名
 */
export const getFileName = (path) => {
    if (!path || typeof path !== 'string') return ''

    // 从后往前查找最后一个分隔符
    let lastSeparator = -1
    for (let i = path.length - 1; i >= 0; i--) {
        if (path[i] === '\\' || path[i] === '/') {
            lastSeparator = i
            break
        }
    }

    return lastSeparator === -1 ? path : path.substring(lastSeparator + 1)
}

/**
 * 高性能文件扩展名提取
 * 时间复杂度：O(n) -> O(1) (对于短文件名)
 * @param {string} fileName - 文件名
 * @returns {string} 文件扩展名（小写）
 */
export const getFileExtension = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return ''

    // 从后往前查找最后一个点
    let lastDot = -1
    for (let i = fileName.length - 1; i >= 0; i--) {
        if (fileName[i] === '.') {
            lastDot = i
            break
        }
        // 如果遇到路径分隔符，说明没有扩展名
        if (fileName[i] === '\\' || fileName[i] === '/') {
            break
        }
    }

    if (lastDot === -1 || lastDot === fileName.length - 1) return ''

    const ext = fileName.substring(lastDot + 1)
    return ext.toLowerCase()
}
