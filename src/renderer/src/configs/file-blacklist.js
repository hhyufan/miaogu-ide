/**
 * 文件黑名单配置
 * 用于过滤不能在Monaco编辑器中查看和编辑的文件
 */

// 黑名单文件扩展名
const blacklistExtensions = [
  // 二进制文件
  'exe',
  'dll',
  'so',
  'lnk', // Windows快捷方式
  'dylib',
  'bin',
  'obj',
  'blf',
  // 图像文件
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'ico',
  'webp',
  'tiff',
  'regtrans-ms',
  // 音频文件
  'mp3',
  'wav',
  'ogg',
  'flac',
  'aac',
  'm4a',
  // 视频文件
  'mp4',
  'avi',
  'mov',
  'wmv',
  'mkv',
  'flv',
  'webm',
  // 压缩文件
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'bz2',
  'xz',
  // 数据库文件
  'db',
  'sqlite',
  'sqlite3',
  'mdb',
  // 其他二进制文件
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx'
]

// 黑名单目录名称（不区分大小写）
const blacklistDirectories = [
  // 常见隐藏目录
  '.git',
  '.svn',
  '.hg',
  '.vscode',
  'node_modules',
  '__pycache__',
  // 其他不需要编辑的目录
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj'
]

// 黑名单文件名称（不区分大小写）
const blacklistFileNames = [
  // 常见隐藏文件
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  'desktop.ini',
  /^~\$\$.*/, // 匹配以 ~$$ 开头的临时文件

  /^~\$.*/, // 匹配以 ~$ 开头的临时文件（如Office临时文件）
  '.gitattributes'
]

/**
 * 检查文件是否在黑名单中
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 如果文件在黑名单中返回true，否则返回false
 */
export const isFileBlacklisted = (filePath) => {
  if (!filePath) return false

  const fileName = filePath.split(/[\\/]/).pop()
  if (!fileName) return false

  // 检查文件名是否在黑名单中（支持正则表达式）
  if (
    blacklistFileNames.some((name) => {
      if (typeof name === 'string') {
        return fileName.toLowerCase() === name.toLowerCase()
      } else if (name instanceof RegExp) {
        return name.test(fileName)
      }
      return false
    })
  ) {
    return true
  }
  // 检查扩展名是否在黑名单中
  const extension = fileName.split('.').pop().toLowerCase()
  if (blacklistExtensions.includes(extension)) {
    return true
  }

  // 检查文件是否在黑名单目录中
  const pathParts = filePath.split(/[\\/]/)
  for (const dir of blacklistDirectories) {
    if (pathParts.some((part) => part.toLowerCase() === dir.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * 过滤目录内容，移除黑名单中的文件和目录
 * @param {Array} contents - 目录内容数组
 * @returns {Array} - 过滤后的目录内容
 */
export const filterDirectoryContents = (contents) => {
  if (!Array.isArray(contents)) return []
  return contents.filter((item) => {
    // 检查目录名是否在黑名单中
    if (item.isDirectory) {
      const dirName = item.name.toLowerCase()
      // 1. 过滤所有 . 开头的目录
      if (dirName.startsWith('.')) {
        return false
      }
      // 2. 过滤其他黑名单目录
      const lowerDirName = dirName.toLowerCase()
      return !blacklistDirectories.some((dir) => dir.toLowerCase() === lowerDirName)
    }
    // 检查文件是否在黑名单中
    return !isFileBlacklisted(item.path)
  })
}
