import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import stateStore from './store'
import chokidar from 'chokidar'
// 文件监听器实例
let fileWatcher = null
// 当前打开的文件路径
let currentOpenFilePath = null
// 文件最后修改时间
let lastModifiedTime = null


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

let settingsWindow = null; 

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
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
  });

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings.html`);
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/settings.html'));
  }
}

ipcMain.on('open-settings-window', () => {
  createSettingsWindow()
})

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
      const code = fs.readFileSync(filePath, 'utf8')
      return { success: true, message: '文件导入成功', code, filePath: filePath }
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
      default:
        // 对于其他键（如aiSettings），使用通用的getState方法
        return stateStore.getState(key)
    }
  })

  ipcMain.handle('set-theme', (event, theme) => {
    stateStore.setTheme(theme)
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
      const content = fs.readFileSync(filePath, 'utf8')
      return { success: true, content }
    } catch (error) {
      console.error('读取文件内容失败:', error)
      return { success: false, message: `读取文件内容失败: ${error.message}` }
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

        // 读取文件内容
        const content = fs.readFileSync(path, 'utf8')

        // 通知渲染进程文件已被外部修改
        window.webContents.send('file-changed-externally', {
          filePath: path,
          content
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
    fileWatcher.close()
    fileWatcher = null
    currentOpenFilePath = null
    lastModifiedTime = null
  }
}


ipcMain.on('open-settings-window', () => {
  createSettingsWindow();
});