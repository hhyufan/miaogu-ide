import { contextBridge, ipcRenderer } from 'electron'

// 设置IPC事件最大监听器数量，防止内存泄漏警告
ipcRenderer.setMaxListeners(50)
// 创建API接口，用于替代原有的HTTP API
const ipcApi = {
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
    // 打开设置窗口
    openSettingsWindow: () => {
        ipcRenderer.send('open-settings-window')
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

    // 获取字体大小设置
    getFontSize: async () => {
        return ipcRenderer.invoke('get-state', 'fontSize')
    },

    // 设置字体大小
    setFontSize: async (fontSize) => {
        return ipcRenderer.invoke('set-font-size', fontSize)
    },

    // 监听字体大小变化
    onFontSizeChange: (callback) => {
        ipcRenderer.on('font-size-changed', callback)
    },

    // 移除字体大小变化监听
    removeFontSizeChange: (callback) => {
        ipcRenderer.removeListener('font-size-changed', callback)
    },

    // 字体设置
    setFontFamily: async (fontFamily) => {
        return ipcRenderer.invoke('set-font-family', fontFamily)
    },

    // 监听字体变化
    onFontFamilyChange: (callback) => {
        ipcRenderer.on('font-family-changed', callback)
    },

    // 移除字体变化监听
    removeFontFamilyChange: (callback) => {
        ipcRenderer.removeListener('font-family-changed', callback)
    },

    // 监听运行代码事件 (Ctrl+R)
    onRunCode: (callback) => {
        ipcRenderer.on('run-code', callback)
    },

    // 移除运行代码事件监听
    removeRunCode: (callback) => {
        ipcRenderer.removeListener('run-code', callback)
    },

    // 监听切换主题事件 (Ctrl+T)
    onToggleTheme: (callback) => {
        ipcRenderer.on('toggle-theme', callback)
    },

    // 移除切换主题事件监听
    removeToggleTheme: (callback) => {
        ipcRenderer.removeListener('toggle-theme', callback)
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

    // 设置打开文件（通过"打开方式"功能）
    setOpenFile: async (filePath) => {
        return ipcRenderer.invoke('set-open-file', { filePath })
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
    },

    // 创建临时文件
    createTempFile: async (filePath, content = '') => {
        return ipcRenderer.invoke('create-temp-file', { filePath, content })
    },

    // 检查文件是否存在
    checkFileExists: async (filePath) => {
        return ipcRenderer.invoke('checkFileExists', filePath)
    },

    // 删除文件
    deleteFile: async (filePath) => {
        return ipcRenderer.invoke('deleteFile', filePath)
    },

    // 开始监听文件变化
    watchFile: async (filePath) => {
        return ipcRenderer.invoke('watch-file', { filePath })
    },

    // 停止监听文件变化
    stopWatchingFile: async () => {
        return ipcRenderer.invoke('stop-watching-file')
    },

    // 获取目录内容
    getDirectoryContents: async (dirPath) => {
        return ipcRenderer.invoke('get-directory-contents', dirPath)
    },

    // 获取文件内容
    getFileContent: async (filePath) => {
        return ipcRenderer.invoke('get-file-content', filePath)
    },

    // 监听文件外部变化事件（包含编码和行尾序列信息）
    onFileChangedExternally: (callback) => {
        ipcRenderer.on('file-changed-externally', (event, data) => callback(data))
    },

    // 监听文件外部删除事件
    onFileDeletedExternally: (callback) => {
        ipcRenderer.on('file-deleted-externally', (event, data) => callback(data))
    },

    // 获取文件编码（仅在初始加载时使用，文件变化时会通过onFileChangedExternally获取）
    getFileEncoding: async (filePath) => {
        return ipcRenderer.invoke('get-file-encoding', filePath)
    },

    // 获取文件行尾序列（仅在初始加载时使用，文件变化时会通过onFileChangedExternally获取）
    getFileLineEnding: async (filePath) => {
        return ipcRenderer.invoke('get-file-line-ending', filePath)
    },

    // 设置文件行尾序列
    setFileLineEnding: async (filePath, encoding, lineEnding) => {
        return ipcRenderer.invoke('set-file-line-ending', { filePath, encoding, lineEnding })
    },

    openExternal: (url) => {
        return ipcRenderer.invoke('open-external', url)
    },

    getSettings: async () => {
        return ipcRenderer.invoke('get-settings')
    },

    setSettings: async (settings) => {
        return ipcRenderer.invoke('set-settings', settings)
    },

    selectBgImage: async () => {
        return ipcRenderer.invoke('select-bg-image')
    },

    setBgImage: async (bgImage) => {
        return ipcRenderer.invoke('set-bg-image', bgImage)
    },

    getBgImage: async () => {
        return ipcRenderer.invoke('get-bg-image')
    },
    // 监听背景图片变化
    onBgImageChange: (callback) => {
        ipcRenderer.on('bg-image-changed', callback)
    },

    // 移除背景图片变化监听
    removeBgImageChange: (callback) => {
        ipcRenderer.removeListener('bg-image-changed', callback)
    },
    // 设置背景透明度
    setBgTransparency: async (theme, transparency) => {
        return ipcRenderer.invoke('set-bg-transparency', theme, transparency)
    },
    // 获取背景透明度
    getBgTransparency: async () => {
        return ipcRenderer.invoke('get-bg-transparency')
    },
    // 监听背景透明度变化
    onBgTransparencyChange: (callback) => {
        ipcRenderer.on('bg-transparency-changed', callback)
    },

    // 移除背景透明度变化监听
    removeBgTransparencyChange: (callback) => {
        ipcRenderer.removeListener('bg-transparency-changed', callback)
    },

    getSavedImage: async () => {
        return ipcRenderer.invoke('get-saved-image')
    },

    setSavedImage: async (savedImage) => {
        return ipcRenderer.invoke('set-saved-image', savedImage)
    },

    // 运行HTML文件
    runHtmlFile: async (filePath, content) => {
        return ipcRenderer.invoke('run-html-file', { filePath, content })
    },

    // 更新临时HTML文件内容
    updateTempHtmlFile: async (tempFilePath, content) => {
        return ipcRenderer.invoke('update-temp-html-file', { tempFilePath, content })
    }
}

// 暴露IPC API到渲染进程
export function setupIpcApi() {
    if (process.contextIsolated) {
        try {
            contextBridge.exposeInMainWorld('ipcApi', ipcApi)

            // 注册通过"打开方式"打开文件的事件监听
            contextBridge.exposeInMainWorld('electronAPI', {
                onOpenWithFile: (callback) => {
                    ipcRenderer.on('open-with-file', (_, data) => callback(data))
                }
            })
        } catch (error) {
            console.error('IPC API暴露失败:', error)
        }
    } else {
        window.ipcApi = ipcApi
        window.electronAPI = {
            onOpenWithFile: (callback) => {
                ipcRenderer.on('open-with-file', (_, data) => callback(data))
            }
        }
    }
}
