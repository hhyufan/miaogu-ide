import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Modal } from 'antd'
import extensionToLanguage from './file-extensions.json'

const FileContext = createContext(undefined)

// 生成保存文件过滤器
const getSaveFilters = (currentFileName = '') => {
  const ext = currentFileName.split('.').pop().toLowerCase()
  const language = extensionToLanguage[ext] || 'plaintext'

  // 根据当前文件类型生成推荐过滤器
  const recommendedFilter = {
    name: `${language.toUpperCase()} 文件`,
    extensions: Object.entries(extensionToLanguage)
      .filter(([, lang]) => lang === language)
      .map(([ext]) => ext)
  }
  // 默认过滤器列表
  return [recommendedFilter, { name: 'All Files', extensions: ['*'] }]
}

// eslint-disable-next-line react/prop-types
export const FileProvider = ({ children }) => {
  const [currentFilePath, setCurrentFilePath] = useState('')
  const [openedFiles, setOpenedFiles] = useState([]) // 结构：{ path: string, name: string, isTemporary: boolean, isModified: boolean, content: string }[]
  const [editorCode, setEditorCode] = useState('')
  const [defaultFileName, setDefaultFileName] = useState('未命名')
  const defaultFileNameRef = useRef(defaultFileName)

  useEffect(() => {
    defaultFileNameRef.current = defaultFileName
  }, [defaultFileName])

  // 获取当前文件对象
  const currentFile = openedFiles.find((f) => f.path === currentFilePath) || {
    path: '',
    name: defaultFileName,
    isTemporary: true,
    isModified: false,
    content: editorCode
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
        // 如果文件已经打开，切换到该文件并刷新内容
        setCurrentFilePath(filePath)
        await refreshFileContent(filePath)
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

      // 检查并处理可能的路径冲突
      handlePathConflict(filePath)
    } catch (error) {
      console.error('打开文件失败:', error)
      Modal.error({ title: '打开文件失败', content: error.message })
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
  }

  // 更新代码内容
  const updateCode = (newCode) => {
    setEditorCode(newCode)
    setOpenedFiles((prev) =>
      prev.map((file) =>
        file.path === currentFilePath ? { ...file, content: newCode, isModified: true } : file
      )
    )

    if (window.ipcApi?.setCodeEditorContent) {
      window.ipcApi.setCodeEditorContent(newCode).catch(console.error)
    }
  }

  // 更新默认文件名
  const updateDefaultFileName = (newName) => {
    if (!newName.trim()) return false
    setDefaultFileName(newName)
    return true
  }

  // 保存文件
  const saveFile = async (saveAs = false) => {
    if (!window.ipcApi) return

    try {
      let targetPath = currentFilePath
      const isTemp = currentFile.isTemporary
      const hasNoOpenFile = !currentFilePath

      // 获取当前显示的文件名（确保使用最新的defaultFileName）
      const currentDisplayName = hasNoOpenFile ? defaultFileNameRef.current : currentFile.name

      // 如果没有打开的文件或需要另存为，或是临时文件，则打开保存对话框
      if (saveAs || isTemp || hasNoOpenFile) {
        const result = await window.ipcApi.saveFileDialog({
          title: '保存文件',
          defaultPath: currentDisplayName,
          filters: getSaveFilters(currentDisplayName)
        })

        if (result.canceled) return
        targetPath = result.filePath

        // 检查是否与已打开的文件路径重复（不包括当前文件）
        const duplicateOpenedFile = openedFiles.find(
          (f) => f.path !== currentFilePath && f.path === targetPath
        )

        if (duplicateOpenedFile) {
          // 选择覆盖，且关闭已打开的重复文件
          closeFile(duplicateOpenedFile.path)
        }
      }

      // 获取要保存的内容
      const contentToSave = hasNoOpenFile ? editorCode : currentCode

      const saveResult = await window.ipcApi.saveFile(targetPath, contentToSave)
      if (!saveResult.success) {
        console.error('保存文件失败', saveResult.message)
        return { success: false, conflict: true, targetPath }
      }

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
          content: contentToSave
        }
        setOpenedFiles((prev) => [...prev, newFile])
      }

      // 更新当前文件路径
      setCurrentFilePath(targetPath)

      // 如果成功保存了默认文件名的文件，立即重置为"未命名"
      if (hasNoOpenFile) {
        // 立即更新状态，避免UI延迟
        setDefaultFileName('未命名')
        setEditorCode('')
      }

      // 检查并处理可能的路径冲突
      handlePathConflict(targetPath)

      return { success: true, path: targetPath }
    } catch (error) {
      Modal.error({ title: '保存失败', content: error.message })
      return { success: false, error: error.message }
    }
  }

  // 保存指定的文件对象数组
  const saveFiles = async (files) => {
    if (!window.ipcApi) return

    try {
      const results = []

      for (let file of files) {
        let targetPath = file.path
        const isTemp = file.isTemporary
        if (isTemp) {
          const result = await window.ipcApi.saveFileDialog({
            title: '保存文件',
            defaultPath: file.name,
            filters: getSaveFilters(currentFile.name)
          })

          if (result.canceled) continue // 跳过取消的文件，继续保存其他文件
          targetPath = result.filePath

          // 检查是否与已打开的文件路径重复（不包括当前文件）
          const duplicateOpenedFile = openedFiles.find(
            (f) => f.path !== file.path && f.path === targetPath
          )

          if (duplicateOpenedFile) {
            // 选择覆盖，关闭已打开的重复文件
            closeFile(duplicateOpenedFile.path)
          }
        }

        const saveResult = await window.ipcApi.saveFile(targetPath, file.content)
        if (!saveResult.success) {
          console.error(saveResult.message)
          results.push({ path: file.path, success: false, message: saveResult.message })
          continue // 保存失败时继续处理其他文件
        }

        results.push({ path: file.path, success: true, newPath: targetPath })

        setOpenedFiles((prev) =>
          prev.map((f) =>
            f.path === file.path
              ? {
                  ...f,
                  content: file.content,
                  path: targetPath,
                  name: targetPath.split(/[\\/]/).pop(),
                  isTemporary: false,
                  isModified: false
                }
              : f
          )
        )

        // 检查并处理可能的路径冲突
        handlePathConflict(targetPath)

        // 如果保存的是当前文件，更新当前文件路径
        if (file.path === currentFilePath) {
          setCurrentFilePath(targetPath)
        }
      }

      // 显示保存结果摘要
      const failedCount = results.filter((r) => !r.success).length
      if (failedCount > 0) {
        Modal.warning({
          title: '部分文件保存失败',
          content: `共有 ${failedCount} 个文件保存失败，请检查权限或磁盘空间。`
        })
      }

      return results
    } catch (error) {
      Modal.error({ title: '保存失败', content: error.message })
      return [{ success: false, error: error.message }]
    }
  }

  // 切换文件
  const switchFile = (path) => {
    const target = openedFiles.find((f) => f.path === path)
    if (!target) return

    setCurrentFilePath(path)

    // 同步到持久化存储
    if (window.ipcApi?.setCodeEditorContent) {
      // 确保即使是空内容也会正确设置，避免继承之前编辑器的内容
      const contentToSet = target.content || ''
      window.ipcApi.setCodeEditorContent(contentToSet).catch(console.error)
    }
  }

  // 关闭文件
  const closeFile = (path) => {
    setOpenedFiles((prev) => prev.filter((f) => f.path !== path))
    if (path === currentFilePath) {
      const remaining = openedFiles.filter((f) => f.path !== path)
      setCurrentFilePath(remaining[0]?.path || '')

      // 如果关闭后没有剩余文件，重置默认文件名为"未命名"
      if (remaining.length === 0) {
        updateDefaultFileName('未命名')
        setEditorCode('')
      }
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

  // 检查文件是否存在
  const checkFileExists = async (filePath) => {
    if (!window.ipcApi?.checkFileExists) return false
    try {
      const result = await window.ipcApi.checkFileExists(filePath)
      return result.exists
    } catch (error) {
      console.error('检查文件是否存在失败:', error)
      return false
    }
  }
  // 重命名文件
  const renameFile = async (newName, overwrite = false) => {
    if (!newName.trim()) return

    // 如果没有打开的文件，只更新默认文件名
    if (!currentFilePath) {
      const success = updateDefaultFileName(newName)
      // 确保编辑器内容被重置为空
      setEditorCode('')
      if (window.ipcApi?.setCodeEditorContent) {
        window.ipcApi.setCodeEditorContent('').catch(console.error)
      }
      return { success }
    }

    // 如果是临时文件，直接更新路径以保持一致性
    if (currentFile.isTemporary) {
      // 更新openedFiles中的文件名和修改状态
      const newPath = `temp://${Date.now()}_${newName}`

      // 检查是否已存在同名临时文件
      const duplicateFile = openedFiles.find(
        (f) => f.path !== currentFilePath && f.name === newName && f.isTemporary
      )

      if (duplicateFile) {
        // 如果已存在同名临时文件，选择覆盖
        closeFile(duplicateFile.path)
        return { success: false, conflict: true }
      }

      setOpenedFiles((prev) =>
        prev.map((file) =>
          file.path === currentFilePath
            ? { ...file, name: newName, path: newPath, isModified: true }
            : file
        )
      )
      setCurrentFilePath(newPath)
      return { success: true }
    } else {
      // 处理本地文件的重命名
      try {
        if (window.ipcApi) {
          // 获取原始文件路径和目录
          const originalPath = currentFilePath
          const pathParts = originalPath.split(/[\\/]/)

          // 替换最后一个部分（文件名）
          pathParts.pop()
          // 使用系统原生的路径分隔符，确保在Windows上正确工作
          const newPath = [...pathParts, newName].join(originalPath.includes('\\') ? '\\' : '/')

          // 检查是否与已打开的文件路径重复（不包括当前文件）
          const duplicateOpenedFile = openedFiles.find(
            (f) => f.path !== currentFilePath && f.path === newPath
          )

          if (duplicateOpenedFile) {
            // 如果已打开的文件列表中有相同路径的文件
            if (overwrite) {
              // 如果选择覆盖，则关闭已打开的重复文件
              closeFile(duplicateOpenedFile.path)
            } else {
              // 如果不覆盖，返回冲突信息
              return { success: false, conflict: true, newPath }
            }
          }

          // 检查文件系统中是否已存在该文件

          if (!overwrite) {
            const fileExists = await checkFileExists(newPath).catch(console.error)
            if (fileExists) {
              // 如果文件已存在且不覆盖，返回冲突信息
              return { success: false, conflict: true, newPath }
            }
          }

          // 保存新文件
          const saveResult = await window.ipcApi.saveFile(newPath, currentCode)
          if (!saveResult.success) {
            console.error('保存新文件失败', saveResult.message)
            return { success: false, conflict: true, newPath }
          }

          // 如果不是同名覆盖，则删除原始文件
          if (originalPath !== newPath) {
            const deleteResult = await window.ipcApi.deleteFile(originalPath)
            if (!deleteResult.success) {
              console.error('删除原始文件失败:', deleteResult.message)
              // 即使删除失败，我们仍然更新UI以反映新文件
            }
          }

          // 更新文件路径
          setOpenedFiles((prev) =>
            prev.map((file) =>
              file.path === currentFilePath
                ? { ...file, path: newPath, name: newName, isModified: false }
                : file
            )
          )
          setCurrentFilePath(newPath)
          return { success: true }
        }
      } catch (error) {
        Modal.error({ title: '重命名文件失败', content: error.message })
        return { success: false, error: error.message }
      }
    }
    return { success: false }
  }

  // 监听文件变化并更新内容
  const refreshFileContent = async (filePath) => {
    if (!window.ipcApi?.importCodeFromFile || !filePath || filePath.startsWith('temp://')) return

    try {
      // 获取文件最新内容
      const fileContent = await window.ipcApi.importCodeFromFile(filePath)
      const newContent = fileContent?.code || ''

      // 查找对应的文件
      const targetFile = openedFiles.find((file) => file.path === filePath)
      if (!targetFile) return
      setOpenedFiles((prev) =>
        prev.map((file) => {
          if (file.path === filePath) {
            return { ...file, content: newContent, isModified: false }
          }
          return file
        })
      )
    } catch (error) {
      console.error('刷新文件内容失败:', error)
    }
  }

  // 检查并处理文件路径冲突
  const handlePathConflict = (filePath) => {
    // 查找是否有重复路径的文件
    const duplicates = openedFiles.filter((f) => f.path === filePath)

    if (duplicates.length > 1) {
      // 保留第一个文件，关闭其他重复的文件
      const [first, ...rest] = duplicates
      rest.forEach((f) => closeFile(f.path))

      // 刷新保留的文件内容
      refreshFileContent(first.path).catch(console.error)

      return true
    }
    return false
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
    saveFiles,
    renameFile,
    refreshFileContent,
    handlePathConflict,
    updateDefaultFileName,
    defaultFileName
  }

  // 从持久化存储加载默认文件名
  useEffect(() => {
    if (window.ipcApi?.getState) {
      window.ipcApi
        .getState('defaultFileName')
        .then((savedName) => {
          if (savedName) {
            setDefaultFileName(savedName)
          }
        })
        .catch(console.error)
    }
  }, [])

  // 在编辑器启动时重置默认文件名为"未命名"
  useEffect(() => {
    // 当编辑器初始化时，如果没有打开的文件，重置默认文件名
    if (openedFiles.length === 0) {
      updateDefaultFileName('未命名')
      setEditorCode('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组确保只在组件挂载时执行一次

  // 使用useEffect监听文件外部变化
  useEffect(() => {
    // 监听所有非临时文件
    const filesToWatch = openedFiles.filter((file) => !file.path.startsWith('temp://'))

    // 为每个文件设置监听
    filesToWatch.forEach(async (file) => {
      if (window.ipcApi?.watchFile) {
        try {
          await window.ipcApi.watchFile(file.path)
        } catch (error) {
          console.error(`监听文件 ${file.path} 失败:`, error)
        }
      }
    })

    // 设置文件变化的回调函数
    if (window.ipcApi?.onFileChangedExternally) {
      const handleFileChanged = (data) => {
        if (data && data.filePath) {
          refreshFileContent(data.filePath).catch(console.error)
        }
      }

      window.ipcApi.onFileChangedExternally(handleFileChanged)
    }

    // 设置文件删除的回调函数
    if (window.ipcApi?.onFileDeletedExternally) {
      const handleFileDeleted = (data) => {
        if (data && data.filePath) {
          closeFile(data.filePath)
        }
      }

      window.ipcApi.onFileDeletedExternally(handleFileDeleted)
    }

    // 清理函数
    return () => {
      if (window.ipcApi?.stopWatchingFile) {
        window.ipcApi.stopWatchingFile().catch(console.error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedFiles]) // 当打开的文件列表变化时重新设置监听
  return <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
}
// 自定义钩子，用于访问文件上下文
// eslint-disable-next-line react-refresh/only-export-components
export const useFile = () => {
  const context = useContext(FileContext)
  if (!context) throw new Error('useFile必须在FileProvider内使用')
  return context
}
