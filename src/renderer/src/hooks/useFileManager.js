import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Modal } from 'antd'
import extensionToLanguage from '../configs/file-extensions.json'
import { isFileBlacklisted } from '../configs/file-blacklist'
import { getFileName } from '../utils/pathUtils'
import { getFileExtensionOptimized } from '../utils/fileNameUtils'

// 高性能工具函数
const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

const throttle = (func, limit) => {
    let inThrottle
    return function () {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

// 文件缓存管理器
class FileCache {
    constructor(maxSize = 100) {
        this.cache = new Map()
        this.maxSize = maxSize
        this.accessOrder = new Set()
    }

    get(key) {
        if (this.cache.has(key)) {
            this.accessOrder.delete(key)
            this.accessOrder.add(key)
            return this.cache.get(key)
        }
        return null
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const firstKey = this.accessOrder.values().next().value
            this.accessOrder.delete(firstKey)
            this.cache.delete(firstKey)
        }

        this.cache.set(key, value)
        this.accessOrder.delete(key)
        this.accessOrder.add(key)
    }

    delete(key) {
        this.cache.delete(key)
        this.accessOrder.delete(key)
    }

    clear() {
        this.cache.clear()
        this.accessOrder.clear()
    }
}

// 全局文件缓存实例
const fileCache = new FileCache(50)

// 生成保存文件过滤器
const getSaveFilters = (currentFileName = '') => {
    const ext = getFileExtensionOptimized(currentFileName)
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

// 通用错误处理函数
const handleError = (title, error) => {
    const errorMessage = error?.message || error || '未知错误'
    console.error(title, errorMessage)
    Modal.error({ title, content: errorMessage })
}

/**
 * 文件管理 Hook
 * 提供完整的文件操作功能，包括打开、保存、创建、关闭等
 */
export const useFileManager = () => {
    const [currentFilePath, setCurrentFilePath] = useState('')
    const [openedFiles, setOpenedFiles] = useState([]) // 结构：{ path: string, name: string, isTemporary: boolean, isModified: boolean, content: string, originalContent: string }[]
    const [editorCode, setEditorCode] = useState('')
    const [defaultFileName, setDefaultFileName] = useState('未命名')
    const defaultFileNameRef = useRef(defaultFileName)

    // 性能优化：使用 Map 来快速查找文件
    const openedFilesMap = useMemo(() => {
        const map = new Map()
        openedFiles.forEach(file => map.set(file.path, file))
        return map
    }, [openedFiles])

    // 防抖的文件保存函数
    const debouncedAutoSave = useMemo(
        () => debounce(async (filePath, content) => {
            if (window.ipcApi?.createTempFile) {
                try {
                    await window.ipcApi.createTempFile(filePath, content)
                } catch (error) {
                    console.error('自动保存失败:', error)
                }
            }
        }, 500),
        []
    )

    // 节流的编辑器内容更新函数
    const throttledEditorUpdate = useMemo(
        () => throttle((content) => {
            if (window.ipcApi?.setCodeEditorContent) {
                window.ipcApi.setCodeEditorContent(content).catch(console.error)
            }
        }, 100),
        []
    )

    useEffect(() => {
        defaultFileNameRef.current = defaultFileName
    }, [defaultFileName])

    // 监听通过"打开方式"打开文件的事件
    useEffect(() => {
        if (window.electronAPI?.onOpenWithFile) {
            window.electronAPI.onOpenWithFile(async (data) => {
                if (data?.filePath) {
                    await setOpenFile(data.filePath)
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 获取当前文件对象 - 优化缓存逻辑
    const currentFile = useMemo(() => {
        return openedFilesMap.get(currentFilePath) || {
            path: '',
            name: defaultFileName,
            isTemporary: true,
            isModified: false,
            content: editorCode,
            originalContent: '', // 临时文件的原始内容为空
            encoding: 'UTF-8',
            lineEnding: 'LF'
        }
    }, [openedFilesMap, currentFilePath, defaultFileName, editorCode])

    // 获取当前文件内容
    const currentCode = useMemo(() => currentFile.content, [currentFile.content])

    // 检查并处理文件路径冲突
    const handlePathConflict = useCallback((filePath) => {
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
    }, [openedFiles])

    // 通过"打开方式"打开文件
    const setOpenFile = useCallback(async (filePath) => {
        if (!window.ipcApi?.setOpenFile || !filePath) return

        // 检查文件是否在黑名单中
        if (isFileBlacklisted(filePath)) {
            Modal.warning({
                title: '不支持的文件类型',
                content: '该文件类型不支持在编辑器中打开。'
            })
            return
        }

        try {
            const result = await window.ipcApi.setOpenFile(filePath)

            if (!result?.success) {
                console.error('打开文件失败', result?.message)
                return
            }

            const existing = openedFilesMap.get(filePath)
            if (existing) {
                // 如果文件已经打开，切换到该文件
                setCurrentFilePath(filePath)
                return
            }

            // 获取文件的编码和行尾符号信息
            const fileEncoding = result.encoding || 'UTF-8'
            const fileLineEnding = result.lineEnding || 'LF'

            const newFile = {
                path: filePath,
                name: result.fileName,
                isTemporary: false,
                isModified: false,
                content: result.content || '',
                originalContent: result.content || '', // 保存原始内容用于比较
                encoding: fileEncoding,
                lineEnding: fileLineEnding
            }

            setOpenedFiles((prev) => [...prev, newFile])
            setCurrentFilePath(filePath)

            // 检查并处理可能的路径冲突
            handlePathConflict(filePath)
        } catch (error) {
            handleError('打开文件失败', error)
        }
    }, [openedFilesMap, handlePathConflict])

    // 打开文件
    const openFile = useCallback(async () => {
        if (!window.ipcApi?.openFile) return

        try {
            const result = await window.ipcApi.openFile()
            if (result?.canceled || !result.filePaths[0]) return

            const filePath = result.filePaths[0]

            // 检查文件是否在黑名单中
            if (isFileBlacklisted(filePath)) {
                Modal.warning({
                    title: '不支持的文件类型',
                    content: '该文件类型不支持在编辑器中打开。'
                })
                return
            }

            await setOpenFile(filePath)
        } catch (error) {
            handleError('打开文件失败', error)
        }
    }, [setOpenFile])

    // 创建新文件
    const createFile = useCallback(async (fileName) => {
        if (!fileName.trim()) return

        // 检查文件名是否在黑名单中
        if (isFileBlacklisted(fileName)) {
            Modal.warning({
                title: '不支持的文件类型',
                content: '该文件类型不支持在编辑器中创建。'
            })
            return
        }

        try {
            // 获取temp目录路径
            const tempDirResult = await window.ipcApi?.ensureTempDir()
            if (!tempDirResult?.success) {
                Modal.error({ title: '创建临时文件失败', content: '无法创建临时目录' })
                return
            }

            // 获取系统默认编码和行尾符号
            const isWindows = navigator.platform.indexOf('Win') > -1
            const defaultLineEnding = isWindows ? 'CRLF' : 'LF'

            // 使用实际的temp目录路径
            const tempFileName = `temp_${Date.now()}_${fileName}`
            const tempFilePath = `${tempDirResult.tempDir}\\${tempFileName}`

            const newFile = {
                path: tempFilePath,
                name: fileName,
                isTemporary: true,
                isModified: false,
                content: '',
                encoding: 'UTF-8',
                lineEnding: defaultLineEnding
            }

            // 创建实际的物理文件
            const createResult = await window.ipcApi?.createTempFile(tempFilePath, '')
            if (!createResult?.success) {
                Modal.error({
                    title: '创建临时文件失败',
                    content: createResult?.message || '无法创建物理文件'
                })
                return
            }

            setOpenedFiles((prev) => [...prev, newFile])
            setCurrentFilePath(newFile.path)
        } catch (error) {
            handleError('创建临时文件失败', error)
        }
    }, [])

    // 更新代码内容 - 高性能优化版本
    const updateCode = useCallback((newCode) => {
        // 避免不必要的状态更新
        if (editorCode === newCode) return

        setEditorCode(newCode)

        // 批量更新文件状态，减少重新渲染
        setOpenedFiles((prev) => {
            const targetIndex = prev.findIndex(file => file.path === currentFilePath)
            if (targetIndex === -1) return prev

            const targetFile = prev[targetIndex]
            const isModified = targetFile.originalContent !== undefined
                ? targetFile.originalContent !== newCode
                : targetFile.content !== newCode

            // 如果状态没有变化，直接返回原数组
            if (targetFile.content === newCode && targetFile.isModified === isModified) {
                return prev
            }

            // 使用浅拷贝优化性能
            const newFiles = [...prev]
            newFiles[targetIndex] = {
                ...targetFile,
                content: newCode,
                isModified
            }

            return newFiles
        })

        // 使用防抖的自动保存
        if (currentFile && currentFile.isTemporary && currentFilePath) {
            debouncedAutoSave(currentFilePath, newCode)
        }

        // 使用节流的编辑器内容更新
        throttledEditorUpdate(newCode)
    }, [editorCode, currentFilePath, currentFile, debouncedAutoSave, throttledEditorUpdate])

    // 更新默认文件名
    const updateDefaultFileName = useCallback((newName) => {
        if (!newName.trim()) return false
        setDefaultFileName(newName)
        return true
    }, [])

    // 关闭文件
    const closeFile = useCallback((path) => {
        // 清除相关缓存
        fileCache.delete(`file_${path}`)

        setOpenedFiles((prev) => {
            const newFiles = prev.filter((f) => f.path !== path)

            if (path === currentFilePath) {
                const newCurrentPath = newFiles[0]?.path || ''
                setCurrentFilePath(newCurrentPath)

                // 如果关闭后没有剩余文件，重置默认文件名为"未命名"
                if (newFiles.length === 0) {
                    updateDefaultFileName('未命名')
                    setEditorCode('')
                }
            }

            return newFiles
        })
    }, [currentFilePath, updateDefaultFileName])

    // 保存文件
    const saveFile = useCallback(async (saveAs = false) => {
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
            const fileName = getFileName(targetPath)

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
                                encoding: 'UTF-8', // 存储始终为UTF-8
                                isModified: false,
                                originalContent: contentToSave // 更新原始内容
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
                    content: contentToSave,
                    originalContent: contentToSave, // 保存原始内容
                    encoding: 'UTF-8',
                    lineEnding: 'LF'
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
            handleError('保存失败', error)
            return { success: false, error: error.message || '未知错误' }
        }
    }, [currentFilePath, openedFiles, currentCode, currentFile, closeFile, handlePathConflict, editorCode])

    // 保存指定的文件对象数组
    const saveFiles = useCallback(async (files) => {
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
                                originalContent: file.content, // 更新原始内容
                                path: targetPath,
                                name: getFileName(targetPath),
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
            handleError('保存失败', error)
            return [{ success: false, error: error.message || '未知错误' }]
        }
    }, [currentFile, currentFilePath, openedFiles, closeFile, handlePathConflict])

    // 切换文件
    const switchFile = useCallback((path) => {
        const target = openedFilesMap.get(path)
        if (!target) return

        setCurrentFilePath(path)

        // 使用节流的编辑器内容更新
        const contentToSet = target.content || ''
        throttledEditorUpdate(contentToSet)
    }, [openedFilesMap, throttledEditorUpdate])

    // 检查未保存的临时文件和已修改文件
    const getUnsavedFiles = useCallback(() => {
        return openedFiles.filter((file) => file.isTemporary || file.isModified)
    }, [openedFiles])

    // 检查当前文件是否有未保存的修改
    const hasUnsavedChanges = useMemo(() => {
        return currentFile && (currentFile.isTemporary || currentFile.isModified)
    }, [currentFile])

    // 另存为文件
    const exportFile = useCallback(async () => {
        await saveFile(true)
    }, [saveFile])

    // 重命名文件
    const renameFile = useCallback(async (oldPath, newName) => {
        if (!window.ipcApi?.renameFile || !oldPath || !newName.trim()) return

        try {
            const result = await window.ipcApi.renameFile(oldPath, newName)
            if (!result.success) {
                handleError('重命名失败', result.message)
                return { success: false, message: result.message }
            }

            const newPath = result.newPath

            // 更新打开的文件列表
            setOpenedFiles((prev) =>
                prev.map((file) =>
                    file.path === oldPath
                        ? {
                            ...file,
                            path: newPath,
                            name: newName
                        }
                        : file
                )
            )

            // 如果重命名的是当前文件，更新当前文件路径
            if (currentFilePath === oldPath) {
                setCurrentFilePath(newPath)
            }

            return { success: true, newPath }
        } catch (error) {
            handleError('重命名失败', error)
            return { success: false, error: error.message || '未知错误' }
        }
    }, [currentFilePath])

    // 刷新文件内容
    const refreshFileContent = useCallback(async (filePath) => {
        if (!window.ipcApi?.readFile || !filePath) return

        try {
            const result = await window.ipcApi.readFile(filePath)
            if (!result.success) {
                console.error('刷新文件内容失败', result.message)
                return
            }

            const fileContent = result.content || ''
            const fileEncoding = result.encoding || 'UTF-8'
            const fileLineEnding = result.lineEnding || 'LF'

            setOpenedFiles((prev) =>
                prev.map((file) =>
                    file.path === filePath
                        ? {
                            ...file,
                            content: fileContent,
                            originalContent: fileContent,
                            encoding: fileEncoding,
                            lineEnding: fileLineEnding,
                            isModified: false
                        }
                        : file
                )
            )

            // 如果刷新的是当前文件，更新编辑器内容
            if (currentFilePath === filePath) {
                setEditorCode(fileContent)
                throttledEditorUpdate(fileContent)
            }
        } catch (error) {
            handleError('刷新文件内容失败', error)
        }
    }, [currentFilePath, throttledEditorUpdate])

    // 更新文件内容（用于外部文件变化监听）
    const updateFileContent = useCallback((filePath, newContent, encoding, lineEnding) => {
        setOpenedFiles((prev) =>
            prev.map((file) =>
                file.path === filePath
                    ? {
                        ...file,
                        content: newContent,
                        originalContent: newContent,
                        encoding: encoding || file.encoding,
                        lineEnding: lineEnding || file.lineEnding,
                        isModified: false
                    }
                    : file
            )
        )

        // 如果更新的是当前文件，同步编辑器内容
        if (currentFilePath === filePath) {
            setEditorCode(newContent)
            throttledEditorUpdate(newContent)
        }
    }, [currentFilePath, throttledEditorUpdate])

    // 更新文件行尾符号
    const updateFileLineEnding = useCallback(async (filePath, lineEnding) => {
        try {
            // 调用后端API保存行尾序列设置
            const result = await window.ipcApi.setFileLineEnding(filePath, null, lineEnding)
            if (result.success) {
                // 更新前端状态
                setOpenedFiles((prev) =>
                    prev.map((file) =>
                        file.path === filePath
                            ? { ...file, lineEnding }
                            : file
                    )
                )
            } else {
                console.error('设置文件行尾序列失败:', result.message)
            }
        } catch (error) {
            console.error('设置文件行尾序列时发生错误:', error)
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

        let handleFileChanged = null
        let handleFileDeleted = null

        // 设置文件变化的回调函数
        if (window.ipcApi?.onFileChangedExternally) {
            handleFileChanged = (data) => {
                if (data && data.filePath) {
                    // 检查是否包含完整的文件信息（内容、编码和行尾序列）
                    if (data.content !== undefined && data.encoding && data.lineEnding) {
                        // 直接使用main进程提供的信息更新文件，无需再次读取文件
                        const filePath = data.filePath
                        const newContent = data.content
                        const fileEncoding = data.encoding
                        const fileLineEnding = data.lineEnding

                        // 使用内联函数更新文件内容
                        updateFileContent(filePath, newContent, fileEncoding, fileLineEnding)
                    } else {
                        // 如果没有完整信息，则回退到原来的方式读取文件
                        refreshFileContent(data.filePath).catch(console.error)
                    }
                }
            }

            window.ipcApi.onFileChangedExternally(handleFileChanged)
        }

        // 设置文件删除的回调函数
        if (window.ipcApi?.onFileDeletedExternally) {
            handleFileDeleted = (data) => {
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
    }, [openedFiles, updateFileContent, refreshFileContent, closeFile]) // 当打开的文件列表变化时重新设置监听

    return {
        // 状态
        currentFile,
        currentCode,
        openedFiles,
        currentFilePath,
        editorCode,
        defaultFileName,
        hasUnsavedChanges,

        // 操作函数
        openFile,
        createFile,
        saveFile,
        closeFile,
        switchFile,
        updateCode,
        getUnsavedFiles,
        exportFile,
        saveFiles,
        renameFile,
        refreshFileContent,
        updateDefaultFileName,
        updateFileLineEnding,
        setOpenFile,
        updateFileContent
    }
}

// 高性能文件选择器 hooks
export const useFileSelector = (selector, fileManager) => {
    if (!fileManager) throw new Error('useFileSelector必须传入fileManager对象')

    return useMemo(() => selector(fileManager), [fileManager, selector])
}

// 专门用于获取当前文件的hook
export const useCurrentFile = (fileManager) => {
    return useFileSelector(useCallback(state => state.currentFile, []), fileManager)
}

// 专门用于获取打开文件列表的hook
export const useOpenedFiles = (fileManager) => {
    return useFileSelector(useCallback(state => state.openedFiles, []), fileManager)
}

// 专门用于获取文件操作函数的hook
export const useFileActions = (fileManager) => {
    return useFileSelector(useCallback(state => ({
        currentCode: state.currentCode,
        openFile: state.openFile,
        createFile: state.createFile,
        saveFile: state.saveFile,
        closeFile: state.closeFile,
        switchFile: state.switchFile,
        updateCode: state.updateCode,
        getUnsavedFiles: state.getUnsavedFiles,
        exportFile: state.exportFile,
        saveFiles: state.saveFiles,
        renameFile: state.renameFile,
        refreshFileContent: state.refreshFileContent,
        updateDefaultFileName: state.updateDefaultFileName,
        updateFileLineEnding: state.updateFileLineEnding,
        setOpenFile: state.setOpenFile
    }), []), fileManager)
}
