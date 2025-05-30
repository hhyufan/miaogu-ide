/**
 * 文件黑名单配置
 * 用于过滤不能在Monaco编辑器中查看和编辑的文件
 */

const blacklistExtensions = [
  // 可执行文件和二进制文件
  'exe',
  'dll',
  'vch',
  'so',
  'dylib',
  'bin',
  'com',
  'msi',
  'app',
  'deb',
  'rpm',
  'pkg',
  'sys',
  'drv',
  'ko',
  'ocx',
  'scr',
  'cpl',
  'jar',
  'class',
  'wasm',
  'swf',
  'fla',
  'dat',
  'default',
  'crc',
  'pth', // 你原始列表特有的补充

  // 系统文件
  'lnk',
  'reg',
  'regtrans-ms',
  'blf',
  'mui',
  'cat',
  'diagcab',
  'diagpkg',
  'diagcfg',
  'hlp',
  'chm',
  'clr',
  'theme',
  'deskthemepack',
  'ics',
  'idx',
  'full',

  // 压缩和归档文件
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'bz2',
  'xz',
  'lz',
  'lzma',
  'z',
  'cab',
  'arj',
  'iso',
  'dmg',
  'img',
  'vhd',
  'vhdx',
  'wim',
  'swm',
  'esd',
  'zipx',

  // 文档和办公文件（二进制格式）
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'mdb',
  'accdb',
  'pub',
  'vsd',
  'vsdx',
  'indd',
  'qbb',
  'qbm',
  'qbw',

  // 多媒体文件
  // 图像
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'ico',
  'icns',
  'webp',
  'tiff',
  'tif',
  'psd',
  'ai',
  'eps',
  'raw',
  'cr2',
  'nef',
  'orf',
  'sr2',
  'xcf',
  'kra',

  // 音频
  'mp3',
  'wav',
  'ogg',
  'flac',
  'aac',
  'm4a',
  'wma',
  'aiff',
  'au',
  'mid',
  'midi',
  'opus',
  'ra',
  'amr',
  'ape',
  'cda',

  // 视频
  'mp4',
  'avi',
  'mov',
  'wmv',
  'mkv',
  'flv',
  'webm',
  'mpeg',
  'mpg',
  '3gp',
  'm4v',
  'vob',
  'ogv',
  'rm',
  'rmvb',
  'asf',
  'swf',
  'm2ts',
  'mxf',

  // 数据库文件
  'db',
  'pdb',
  'mdf',
  'ldf',
  'ndf',
  'sql',
  'sqlite',
  'sqlite3',
  'frm',
  'myd',
  'myi',
  'ibd',
  'dbf',
  'db3',
  'kdbx',
  'nsf',
  'pst',
  'ost',
  'accde',
  'mde',

  // 开发相关二进制文件
  'pch',
  'ilk',
  'exp',
  'lib',
  'a',
  'suo',
  'user',
  'ncb',
  'aps',
  'res',
  'resources',
  'manifest',
  'winmd',
  'pyc',
  'pyo',
  'elc',
  'hi',
  'o',
  'obj',
  'ko',
  'elf',

  // 虚拟化和容器文件
  'vdi',
  'vmdk',
  'vhd',
  'vhdx',
  'qcow2',
  'ova',
  'ovf',
  'vbox',
  'vmcx',
  'vmrs',
  'docker',
  'vmem',
  'nvram',

  // 游戏文件
  'pak',
  'assets',
  'ress',
  'resource',
  'bik',
  'unity3d',
  'asset',
  'bundle',
  'upk',
  'umap',
  'blend',
  'fbx',
  'dae',
  '3ds',
  'obj',
  'x',
  'mdl',
  'bsp',
  'wad',
  'pk3',
  'pk4',

  // 加密和安全文件
  'pfx',
  'p12',
  'cer',
  'crt',
  'der',
  'p7b',
  'p7c',
  'p7r',
  'spc',
  'pem',
  'gpg',
  'pgp',
  'asc',
  'sig',
  'key',
  'keystore',
  'jks',
  'kdb',
  'wallet',

  // 其他特殊格式
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'fon',
  'chm',
  'hlp',
  'lit',
  'mobi',
  'epub',
  'azw',
  'ibooks',
  'djvu',
  'xps',
  'oxps',
  'vsix',
  'crx',
  'xpi',
  'torrent',
  'recycle',
  'part',
  'crdownload',
  'tmp',
  'temp',
  'download',

  // 固件和硬件相关
  'bin',
  'hex',
  'rom',
  'bios',
  'efi',
  'uefi',
  'acm',
  'ax',
  'ime',
  'ime',
  'prm',
  'r0',
  'r1',
  'r2',
  'rs',
  'rx',
  'tsp',
  'vb',
  'vxd',
  'wpx',

  // 邮件和数据存储
  'pst',
  'ost',
  'eml',
  'msg',
  'mbx',
  'mbox',
  'dbx',
  'msf',
  'nsf',
  'olk',
  'edb',
  'ost',
  'wab',

  // 备份文件
  'bak',
  'bkp',
  'bkf',
  'old',
  'backup',
  'gho',
  'tib',
  'v2i',
  'sparseimage',
  'dmgpart',
  'ipsw',
  'itl',
  'itdb',
  'mdbackup',

  // 虚拟现实和3D
  'glb',
  'gltf',
  'fbx',
  'dae',
  '3mf',
  'stl',
  'obj',
  'blend',
  'ma',
  'mb',
  'lwo',
  'lws',
  'lxo',
  'abc',
  'ply',
  'pz3',
  'wrl',
  'x3d',
  'usd',
  'usda',

  // 科学数据格式
  'fits',
  'hdf5',
  'h5',
  'nc',
  'cdf',
  'sav',
  'mat',
  'ibw',
  'pxp',
  'spc',
  'spe',
  'wdf',
  'imzml',
  'raw',
  'mzml',
  'mzxml',

  // 易语言相关
  'e',
  'ec'
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
  return blacklistExtensions.includes(extension)
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
    }
    // 检查文件是否在黑名单中
    return !isFileBlacklisted(item.path)
  })
}
