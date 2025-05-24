import { app, BrowserWindow, dialog, ipcMain, shell, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import stateStore from './store'
import chokidar from 'chokidar'
import { TextDecoder } from 'text-encoding'
import jschardet from 'jschardet'
function detectFileEncoding(buffer) {
  // 优先检查BOM标记
  if (buffer.length >= 4) {
    // UTF-8 BOM（EF BB BF）
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return 'UTF-8'
    }
    // UTF-16 Little Endian（FF FE）
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'UTF-16LE'
    }
    // UTF-16 Big Endian（FE FF）
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      return 'UTF-16BE'
    }
  }

  // 无BOM时使用自动检测
  const detected = jschardet.detect(buffer)
  let encoding = 'UTF-8' // 默认值

  if (detected && detected.encoding) {
    // 修复ASCII误判为UTF-8的问题
    if (detected.encoding.toLowerCase() === 'ascii') {
      // ASCII是UTF-8的子集，直接使用UTF-8
      return 'UTF-8'
    }

    encoding = detected.encoding.toLowerCase()

    // 处理常见编码别名
    const encodingMap = {
      'iso-8859-1': 'windows-1252',
      gb2312: 'gb18030',
      big5: 'big5-hkscs'
    }
    encoding = encodingMap[encoding] || encoding

    // 低置信度二次验证（<85%）
    if (detected.confidence < 0.85) {
      // 检查是否可能是UTF-8
      const isValidUtf8 = isValidUTF8(buffer)
      if (isValidUtf8) {
        return 'UTF-8'
      }

      try {
        // 尝试解码前1024字节验证
        new TextDecoder(encoding).decode(buffer.slice(0, 1024))
      } catch {
        encoding = 'UTF-8' // 回退到UTF-8
      }
    }
  }

  // 特殊处理日文编码
  if (encoding === 'shift_jis') {
    try {
      // 验证是否为合法Shift_JIS
      new TextDecoder('shift_jis').decode(buffer.slice(0, 1024))
    } catch {
      encoding = 'cp932' // 回退到CP932
    }
  }

  return encoding
}

// 检查是否是有效的UTF-8编码
function isValidUTF8(buffer) {
  let i = 0
  while (i < buffer.length) {
    if (buffer[i] < 0x80) {
      // ASCII范围
      i++
      continue
    }

    // 检查多字节UTF-8序列
    if ((buffer[i] & 0xe0) === 0xc0) {
      // 2字节序列
      if (i + 1 >= buffer.length || (buffer[i + 1] & 0xc0) !== 0x80) {
        return false
      }
      i += 2
    } else if ((buffer[i] & 0xf0) === 0xe0) {
      // 3字节序列
      if (
        i + 2 >= buffer.length ||
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80
      ) {
        return false
      }
      i += 3
    } else if ((buffer[i] & 0xf8) === 0xf0) {
      // 4字节序列
      if (
        i + 3 >= buffer.length ||
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80 ||
        (buffer[i + 3] & 0xc0) !== 0x80
      ) {
        return false
      }
      i += 4
    } else {
      return false
    }
  }
  return true
}

// 文件监听器实例
let fileWatcher = null
// 当前打开的文件路径
let currentOpenFilePath = null
// 文件最后修改时间
let lastModifiedTime = null
// 通过打开方式打开的文件路径
let openWithFilePath = null
// 设置IPC事件最大监听器数量
const MAX_LISTENERS = 20 // 增加监听器上限

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false, // 移除默认窗口标题栏
    ...(process.platform === 'linux' ? { icon } : {}),
    title: '喵咕IDE',
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 启动Python IPC服务器
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // 如果有通过"打开方式"打开的文件，发送给渲染进程
    if (openWithFilePath) {
      setTimeout(() => {
        mainWindow.webContents.send('open-with-file', { filePath: openWithFilePath })
      }, 1000) // 延迟发送，确保渲染进程已准备好
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url).then()
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).then()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).then()
  }
}

// 处理通过"打开方式"打开文件
const handleOpenWithFile = (filePath) => {
  if (!filePath) return
  openWithFilePath = filePath

  // 如果应用已经启动，则发送消息给渲染进程
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0) {
    windows[0].webContents.send('open-with-file', { filePath })
  }
}

// 处理命令行参数
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  // 监听第二个实例启动
  app.on('second-instance', (event, commandLine) => {
    // 有人试图运行第二个实例，我们应该聚焦到我们的窗口
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore()
      windows[0].focus()

      // 检查命令行参数中是否有文件路径
      if (process.platform === 'win32' && commandLine.length > 1) {
        const filePath = commandLine[commandLine.length - 1]
        // 检查路径是否存在且是文件而非目录
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          handleOpenWithFile(filePath)
        }
      }
    }
  })

  // 检查启动参数
  if (process.platform === 'win32' && process.argv.length > 1) {
    const filePath = process.argv[process.argv.length - 1]
    // 检查路径是否存在且是文件而非目录
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      openWithFilePath = filePath
    }
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  app.commandLine.appendSwitch('disable-site-isolation-trials')
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册全局快捷键
  // Ctrl+R 运行代码
  globalShortcut.register('CommandOrControl+R', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.send('run-code')
    }
  })

  // Ctrl+T 切换主题
  globalShortcut.register('CommandOrControl+T', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.send('toggle-theme')
    }
  })

  // 处理窗口控制
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
  // 打开文件对话框
  ipcMain.handle('open-file', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { canceled: true }

      return await dialog.showOpenDialog(win, {
        title: '打开文件',
        filters: [{ name: '所有文件', extensions: ['*'] }],
        properties: ['openFile']
      })
    } catch (error) {
      console.error('打开文件对话框失败:', error)
      return { canceled: true, error: error.message }
    }
  })

  // 设置打开文件的处理函数
  ipcMain.handle('set-open-file', async (event, { filePath }) => {
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
  })
  // 保存文件对话框
  ipcMain.handle('save-file-dialog', async (event, options) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { canceled: true }

      return await dialog.showSaveDialog(win, {
        title: options.title || '保存文件',
        defaultPath: options.defaultPath,
        filters: options.filters || [{ name: '所有文件', extensions: ['*'] }],
        properties: options.properties || []
      })
    } catch (error) {
      console.error('保存文件对话框失败:', error)
      return { canceled: true, error: error.message }
    }
  })

  // 保存文件
  ipcMain.handle('save-file', async (event, { filePath, content }) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: '未提供有效的文件路径' }
      }

      // 检查是否为临时文件
      const tempDir = join(app.getPath('userData'), 'temp')
      const isTemp = filePath.startsWith(tempDir)
      let wasTemp = isTemp // 记录文件原始状态

      if (isTemp) {
        // 如果是临时文件，调用另存为对话框
        const win = BrowserWindow.getFocusedWindow()
        if (!win) return { success: false, message: '无法获取当前窗口' }

        const { canceled, filePath: newPath } = await dialog.showSaveDialog(win, {
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

      // 返回文件状态信息，包括是否曾经是临时文件
      const fileName = filePath.split(/[\\/]/).pop() // 提取文件名
      return {
        success: true,
        message: '文件保存成功',
        filePath,
        fileName,
        wasTemp, // 标记文件是否曾经是临时文件
        isTemporary: false // 保存后文件不再是临时文件
      }
    } catch (error) {
      console.error('保存文件失败:', error)
      return { success: false, message: `保存文件失败: ${error.message}` }
    }
  })

  // 确保临时目录存在
  ipcMain.handle('ensure-temp-dir', async () => {
    try {
      const tempDir = join(app.getPath('userData'), 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      return { success: true }
    } catch (error) {
      console.error('创建临时目录失败:', error)
      return { success: false, message: `创建临时目录失败: ${error.message}` }
    }
  })

  // 从本地文件导入Python代码
  ipcMain.handle('import-code-from-file', async (event, filePath) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { success: false, message: '无法获取当前窗口' }

      // 如果没有提供文件路径，则显示文件选择对话框
      if (!filePath) {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
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
  })

  // 处理状态持久化相关的IPC请求
  ipcMain.handle('get-state', (event, key) => {
    switch (key) {
      case 'theme':
        return stateStore.getTheme()
      case 'fontSize':
        return stateStore.getFontSize()
      default:
        // 对于其他键（如aiSettings），使用通用的getState方法
        return stateStore.getState(key)
    }
  })

  ipcMain.handle('set-theme', (event, theme) => {
    stateStore.setTheme(theme)
    return true
  })

  ipcMain.handle('set-font-size', (event, fontSize) => {
    stateStore.setFontSize(fontSize)
    // 广播字体大小变化事件到所有窗口
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font-size-changed', fontSize)
    })
    return true
  })

  // 处理通用状态设置（包括AI设置）
  ipcMain.handle('set-state', (event, key, value) => {
    return stateStore.setState(key, value)
  })

  // 处理代码编辑内容的持久化
  ipcMain.handle('get-code-editor-content', () => {
    return stateStore.getCodeEditorContent()
  })

  ipcMain.handle('set-code-editor-content', (event, { content }) => {
    stateStore.setCodeEditorContent(content)
    return true
  })

  // 检查文件是否存在
  ipcMain.handle('checkFileExists', async (event, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { exists: false, message: '未提供有效的文件路径' }
      }
      // 检查文件是否存在
      const exists = fs.existsSync(filePath)
      return { exists, message: exists ? '文件存在' : '文件不存在' }
    } catch (error) {
      console.error('检查文件是否存在失败:', error)
      return { exists: false, message: `检查文件是否存在失败: ${error.message}` }
    }
  })

  // 删除文件
  ipcMain.handle('deleteFile', async (event, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: '未提供有效的文件路径' }
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, message: '文件不存在' }
      }

      // 如果删除的是当前监听的文件，停止监听
      if (filePath === currentOpenFilePath) {
        stopWatchingFile()
      }

      // 删除文件
      fs.unlinkSync(filePath)
      return { success: true, message: '文件删除成功' }
    } catch (error) {
      console.error('删除文件失败:', error)
      return { success: false, message: `删除文件失败: ${error.message}` }
    }
  })

  // 开始监听文件变化
  ipcMain.handle('watch-file', async (event, { filePath }) => {
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

      // 设置当前打开的文件路径
      currentOpenFilePath = filePath

      // 开始监听文件变化
      startWatchingFile(filePath, BrowserWindow.getFocusedWindow())

      return { success: true, message: '开始监听文件变化' }
    } catch (error) {
      console.error('监听文件变化失败:', error)
      return { success: false, message: `监听文件变化失败: ${error.message}` }
    }
  })

  // 停止监听文件变化
  ipcMain.handle('stop-watching-file', async () => {
    try {
      stopWatchingFile()
      return { success: true, message: '停止监听文件变化' }
    } catch (error) {
      console.error('停止监听文件变化失败:', error)
      return { success: false, message: `停止监听文件变化失败: ${error.message}` }
    }
  })

  // 获取文件内容
  ipcMain.handle('get-file-content', async (event, filePath) => {
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
  })

  // 检测文件编码
  ipcMain.handle('get-file-encoding', async (event, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: '未提供有效的文件路径' }
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, message: '文件不存在' }
      }

      // 读取文件的前几个字节来检测编码
      // 这里使用简化的检测方法，实际项目中可能需要更复杂的编码检测库
      const buffer = fs.readFileSync(filePath)
      return detectFileEncoding(buffer)
    } catch (error) {
      console.error('检测文件编码失败:', error)
      return { success: false, message: `检测文件编码失败: ${error.message}` }
    }
  })

  // 获取目录内容
  ipcMain.handle('get-directory-contents', async (event, dirPath) => {
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
  })

  // 检测文件行尾序列
  ipcMain.handle('get-file-line-ending', async (event, filePath) => {
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
  })

  // 设置文件行尾序列
  ipcMain.handle('set-file-line-ending', async (event, { filePath, lineEnding }) => {
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
  })

  createWindow()

  app.on('activate', function () {
    // On macOS, it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 开始监听文件变化
function startWatchingFile(filePath, window) {
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

        // 使用检测到的编码解码内容 - 确保使用正确的编码
        let content = ''
        try {
          // 使用TextDecoder解码，确保编码名称格式正确
          content = new TextDecoder(encoding).decode(buffer)
        } catch (decodeError) {
          console.error(`使用编码 ${encoding} 解码失败:`, decodeError)
          // 回退到UTF-8
          content = new TextDecoder('utf-8').decode(buffer)
        }

        // 检测行尾序列
        let lineEnding = 'LF'
        if (content.includes('\r\n')) {
          lineEnding = 'CRLF'
        } else if (content.includes('\r') && !content.includes('\n')) {
          lineEnding = 'CR'
        }

        // 通知渲染进程文件已被外部修改，同时提供编码和行尾序列信息
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
}

// 停止监听文件变化
function stopWatchingFile() {
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
