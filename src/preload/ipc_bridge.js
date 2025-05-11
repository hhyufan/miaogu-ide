import { contextBridge, ipcRenderer } from 'electron'
// 创建API接口，用于替代原有的HTTP API
const ipcApi = {
  // 获取所有教程
  test: async (data) => {
    return ipcRenderer.invoke('python-ipc', {
      command: 'test',
      payload: data
    })
  },

  // 窗口控制 - 最小化
  minimizeWindow: () => {
    ipcRenderer.send('window-control', 'minimize')
  },
  // 窗口控制 - 最大化/还原
  maximizeWindow: () => {
    ipcRenderer.send('window-control', 'maximize')
  },
  // 窗口控制 - 关闭
  closeWindow: () => {
    ipcRenderer.send('window-control', 'close')
  },

  // 状态持久化相关API

  // 获取主题设置
  getTheme: async () => {
    return ipcRenderer.invoke('get-state', 'theme')
  },

  // 设置主题
  setTheme: async (theme) => {
    return ipcRenderer.invoke('set-theme', theme)
  },

  // 获取通用状态（包括AI设置）
  getState: async (key) => {
    return ipcRenderer.invoke('get-state', key)
  },

  // 设置通用状态（包括AI设置）
  setState: async (key, value) => {
    return ipcRenderer.invoke('set-state', key, value)
  },

  // 获取代码编辑内容
  getCodeEditorContent: async () => {
    return ipcRenderer.invoke('get-code-editor-content', {})
  },

  // 设置代码编辑内容
  setCodeEditorContent: async (content) => {
    return ipcRenderer.invoke('set-code-editor-content', {
      content
    })
  },

  // 从本地文件导入代码
  importCodeFromFile: async (filePath) => {
    return ipcRenderer.invoke('import-code-from-file', filePath)
  },

  // 打开文件对话框
  openFile: async () => {
    return ipcRenderer.invoke('open-file')
  },

  // 保存文件对话框
  saveFileDialog: async (options) => {
    return ipcRenderer.invoke('save-file-dialog', options)
  },

  // 保存文件
  saveFile: async (filePath, content) => {
    return ipcRenderer.invoke('save-file', { filePath, content })
  },

  // 确保临时目录存在
  ensureTempDir: async () => {
    return ipcRenderer.invoke('ensure-temp-dir')
  }
}

// 暴露IPC API到渲染进程
export function setupIpcApi() {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('ipcApi', ipcApi)
    } catch (error) {
      console.error('IPC API暴露失败:', error)
    }
  } else {
    window.ipcApi = ipcApi
  }
}
