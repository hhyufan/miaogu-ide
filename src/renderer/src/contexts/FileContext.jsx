import { createContext, useContext, useState } from 'react'
import { Modal } from 'antd'

const FileContext = createContext(undefined)

// 文件上下文提供者组件
// eslint-disable-next-line react/prop-types
export const FileProvider = ({ children }) => {
  const [currentFilePath, setCurrentFilePath] = useState('')
  const [openedFiles, setOpenedFiles] = useState([]) // 结构：{ path: string, name: string, isTemporary: boolean, isModified: boolean, content: string }[]
  const [editorCode, setEditorCode] = useState('')

  // 获取当前文件对象
  const currentFile = openedFiles.find((f) => f.path === currentFilePath) || {
    path: '',
    name: '未命名',
    isTemporary: true,
    isModified: false,
    content: ''
  }

  // 获取当前文件内容
  const currentCode = currentFile.content

  // 打开文件
  const openFile = async () => {
    if (!window.ipcApi?.openFile) return

    try {
      const result = await window.ipcApi.openFile()
      if (result?.canceled || !result.filePaths[0]) return

      const filePath = result.filePaths[0]
      const existing = openedFiles.find((f) => f.path === filePath)

      if (existing) {
        setCurrentFilePath(filePath)
        return
      }

      const fileContent = await window.ipcApi.importCodeFromFile(filePath)
      const newFile = {
        path: filePath,
        name: filePath.split(/[\\/]/).pop(),
        isTemporary: false,
        isModified: false,
        content: fileContent?.code || ''
      }

      setOpenedFiles((prev) => [...prev, newFile])
      setCurrentFilePath(filePath)

      if (window.codeBlockManager) {
        window.codeBlockManager.setCurrentBlock(newFile.content)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  // 创建新文件
  const createFile = (fileName) => {
    if (!fileName.trim()) return

    const newFile = {
      path: `temp://${Date.now()}_${fileName}`,
      name: fileName,
      isTemporary: true,
      isModified: false,
      content: ''
    }

    setOpenedFiles((prev) => [...prev, newFile])
    setCurrentFilePath(newFile.path)

    if (window.codeBlockManager) {
      window.codeBlockManager.setCurrentBlock('')
    }
  }

  // 更新代码内容
  const updateCode = (newCode) => {
    setEditorCode(newCode)
    setOpenedFiles((prev) =>
      prev.map((file) =>
        file.path === currentFilePath ? { ...file, content: newCode, isModified: true } : file
      )
    )
    if (window.codeBlockManager) {
      window.codeBlockManager.setCurrentBlock(newCode)
    }

    if (window.ipcApi?.setCodeEditorContent) {
      window.ipcApi.setCodeEditorContent(newCode).catch(console.error)
    }
  }

  // 保存文件
  const saveFile = async (saveAs = false) => {
    if (!window.ipcApi) return

    try {
      let targetPath = currentFilePath
      const isTemp = currentFile.isTemporary

      if (saveAs || isTemp) {
        const result = await window.ipcApi.saveFileDialog({
          title: '保存文件',
          defaultPath: currentFile.name,
          filters: [{ name: 'All Files', extensions: ['*'] }]
        })

        if (result.canceled) return
        targetPath = result.filePath
      }

      const saveResult = await window.ipcApi.saveFile(targetPath, currentCode)
      if (!saveResult.success) console.error(saveResult.message)

      // 获取文件名
      const fileName = targetPath.split(/[\\/]/).pop()

      if (currentFilePath && openedFiles.some((file) => file.path === currentFilePath)) {
        // 如果当前有打开的文件，更新它
        setOpenedFiles((prev) =>
          prev.map((file) =>
            file.path === currentFilePath
              ? {
                  ...file,
                  path: targetPath,
                  name: fileName,
                  isTemporary: false,
                  isModified: false
                }
              : file
          )
        )
      } else {
        // 如果没有打开的文件，创建一个新的文件标签
        const newFile = {
          path: targetPath,
          name: fileName,
          isTemporary: false,
          isModified: false,
          content: editorCode
        }
        setOpenedFiles((prev) => [...prev, newFile])
      }

      // 更新当前文件路径
      setCurrentFilePath(targetPath)
    } catch (error) {
      Modal.error({ title: '保存失败', content: error.message })
    }
  }

  // 保存指定的文件对象数组
  const saveFiles = async (files) => {
    if (!window.ipcApi) return

    try {
      for (let file of files) {
        let targetPath = file.path
        const isTemp = file.isTemporary
        if (isTemp) {
          const result = await window.ipcApi.saveFileDialog({
            title: '保存文件',
            defaultPath: file.name,
            filters: [{ name: 'All Files', extensions: ['*'] }]
          })

          if (result.canceled) return
          targetPath = result.filePath
        }

        const saveResult = await window.ipcApi.saveFile(targetPath, file.content)
        if (!saveResult.success) console.error(saveResult.message)

        setOpenedFiles((prev) =>
          prev.map((f) =>
            f.path === file.path
              ? {
                  ...f,
                  path: targetPath,
                  name: targetPath.split(/[\\/]/).pop(),
                  isTemporary: false,
                  isModified: false
                }
              : f
          )
        )

        if (targetPath !== currentFilePath) {
          setCurrentFilePath(targetPath)
        }
      }
    } catch (error) {
      Modal.error({ title: '保存失败', content: error.message })
    }
  }

  // 切换文件
  const switchFile = (path) => {
    const target = openedFiles.find((f) => f.path === path)
    if (!target) return

    setCurrentFilePath(path)

    // 确保更新编辑器内容
    if (window.codeBlockManager) {
      window.codeBlockManager.setCurrentBlock(target.content)
    }

    // 同步到持久化存储
    if (window.ipcApi?.setCodeEditorContent) {
      window.ipcApi.setCodeEditorContent(target.content).catch(console.error)
    }
  }

  // 关闭文件
  const closeFile = (path) => {
    setOpenedFiles((prev) => prev.filter((f) => f.path !== path))
    if (path === currentFilePath) {
      const remaining = openedFiles.filter((f) => f.path !== path)
      setCurrentFilePath(remaining[0]?.path || '')
    }
  }

  // 检查未保存的临时文件和已修改文件
  const getUnsavedFiles = () => {
    return openedFiles.filter((file) => file.isTemporary || file.isModified)
  }

  // 检查当前文件是否有未保存的修改
  const hasUnsavedChanges = () => {
    return currentFile && (currentFile.isTemporary || currentFile.isModified)
  }

  // 另存为文件
  const exportFile = async () => {
    await saveFile(true)
  }

  // 提供的上下文值
  const contextValue = {
    currentFile,
    currentCode,
    openedFiles,
    openFile,
    createFile,
    saveFile,
    exportFile,
    updateCode,
    switchFile,
    getUnsavedFiles,
    hasUnsavedChanges,
    closeFile,
    saveFiles
  }
  return <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
}

// 自定义钩子，用于访问文件上下文
// eslint-disable-next-line react-refresh/only-export-components
export const useFile = () => {
  const context = useContext(FileContext)
  if (!context) throw new Error('useFile必须在FileProvider内使用')
  return context
}
