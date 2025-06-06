import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useCurrentFile, useFileActions } from '../hooks/useFileManager'
import { getFileExtensionOptimized } from '../utils/fileNameUtils'
import * as monaco from 'monaco-editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import { Spin, Alert } from 'antd'
import { isFileBlacklisted } from '../configs/file-blacklist'
import allHighLight from '../configs/themes.json'
import extensionToLanguage from '../configs/file-extensions.json'
import '../monaco-setup'

let highlighterPromise = null
const initializeHighlighter = async () => {
    const allHighlight = await window.ipcApi.getState('allTheme')
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: Object.values(allHighlight).flat(),
            langs: [...new Set(Object.values(extensionToLanguage))]
        }).then((hl) => {
            shikiToMonaco(hl, monaco)
            return hl
        })
    }
    return highlighterPromise
}

// eslint-disable-next-line react/prop-types
const EditorWithFileContext = ({ isDarkMode, fileManager }) => {
    const currentFile = useCurrentFile(fileManager)
    const { currentCode, updateCode, refreshFileContent } = useFileActions(fileManager)
    const containerRef = useRef(null)
    const editorRef = useRef(null)
    const [isShikiReady, setIsShikiReady] = useState(false)
    const isInternalChange = useRef(false)
    const prevCodeRef = useRef(currentCode)
    const prevEncodingRef = useRef(currentFile.encoding)
    const [fontSize, setFontSize] = useState(14)
    const [lineHeight, setLineHeight] = useState(1.2)
    const [fontFamily, setFontFamily] = useState('JetBrains Mono')
    const [highLight, setHighLight] = useState('One')

    useEffect(() => {
        let mounted = true
        initializeHighlighter()
            .then(() => mounted && setIsShikiReady(true))
            .catch(console.error)

        return () => {
            mounted = false
        }
    }, [])

    const editorLanguage = useMemo(() => {
        if (!currentFile?.name) return 'plaintext'
        const filename = currentFile.name.toLowerCase()
        if (filename === 'dockerfile') return 'dockerfile'
        const extension = getFileExtensionOptimized(currentFile.name)
        return extensionToLanguage[extension] || 'plaintext'
    }, [currentFile?.name])

    // 监听字体大小变化事件
    const handleFontSizeChange = useCallback((event, newFontSize) => {
        setFontSize(newFontSize)
    }, [])

    // 监听行高变化事件
    const handleLineHeightChange = useCallback((event, newLineHeight) => {
        setLineHeight(newLineHeight)
    }, [])

    //监听字体变化
    const handleFontFamilyChange = useCallback((event, newFontFamily) => {
        setFontFamily(newFontFamily)
    }, [])

    const handleHighLightChange = useCallback((event, newHighLight) => {
        setHighLight(newHighLight)
    }, [])

    // 获取保存的设置并监听变化
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSetting = await window.ipcApi.getState('setting')
                if (savedSetting.fontSize) {
                    setFontSize(savedSetting.fontSize)
                }
                if (savedSetting.lineHeight) {
                    setLineHeight(savedSetting.lineHeight)
                }
                if (savedSetting.fontFamily) {
                    setFontFamily(savedSetting.fontFamily)
                }
                if (savedSetting.highLight) {
                    setHighLight(savedSetting.highLight)
                }
            } catch (error) {
                console.error('加载设置失败:', error)
            }
        }

        // 初始加载设置
        loadSettings().catch(console.error)

        // 添加事件监听器
        window.ipcApi.onFontSizeChange(handleFontSizeChange)
        window.ipcApi.onLineHeightChange(handleLineHeightChange)
        window.ipcApi.onFontFamilyChange(handleFontFamilyChange)
        window.ipcApi.onHighLightChange(handleHighLightChange)

        // 清理事件监听器
        return () => {
            window.ipcApi.removeFontSizeChange(handleFontSizeChange)
            window.ipcApi.removeLineHeightChange(handleLineHeightChange)
            window.ipcApi.removeFontFamilyChange(handleFontFamilyChange)
            window.ipcApi.removeHighLightChange(handleHighLightChange)
        }
    }, [handleFontSizeChange, handleLineHeightChange, handleFontFamilyChange, handleHighLightChange])

    useEffect(() => {
        if (!containerRef.current || !isShikiReady || editorRef.current) return
        editorRef.current = monaco.editor.create(containerRef.current, {
            value: currentCode,
            language: editorLanguage,
            theme: isDarkMode ? allHighLight[highLight][0] : allHighLight[highLight][1],
            minimap: { enabled: false },
            fontSize: fontSize,
            lineHeight: lineHeight,
            fontFamily: `"${fontFamily}", monospace`,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            overviewRulerBorder: false,
            wordWrap: 'on',
            lineEnding: currentFile.lineEnding === 'CRLF' ? '\r\n' : '\n'
        })
        // 初始化更新一次，以同步更改
        updateCode(currentCode)

        prevCodeRef.current = currentCode
        prevEncodingRef.current = currentFile.encoding

        return () => {
            editorRef.current?.dispose()
            editorRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShikiReady, highLight])

    // 监听currentCode和编码变化，更新编辑器内容
    useEffect(() => {
        if (!editorRef.current || isInternalChange.current) return
        const editor = editorRef.current

        // 始终设置编辑器的值，确保空文件不会继承之前的内容
        const codeToSet = currentCode || ''
        editor.setValue(codeToSet)
        prevCodeRef.current = currentCode

        // 更新编码引用
        prevEncodingRef.current = currentFile.encoding
    }, [
        currentCode,
        currentFile.encoding,
        currentFile.path,
        currentFile.isTemporary,
        refreshFileContent
    ])

    useEffect(() => {
        if (!editorRef.current) return

        const editor = editorRef.current
        const disposeContentChange = editor.onDidChangeModelContent(() => {
            isInternalChange.current = true
            const newValue = editor.getValue()
            // 根据当前文件编码对内容进行编码
            updateCode(newValue)
            prevCodeRef.current = newValue
            setTimeout(() => {
                isInternalChange.current = false
            }, 0)
        })

        return () => {
            disposeContentChange.dispose()
        }
    }, [updateCode])

    // 监听编辑器语言、主题、编码和换行符变化
    useEffect(() => {
        if (!editorRef.current) return

        const editor = editorRef.current
        const model = editor.getModel()

        if (model && model.getLanguageId() !== editorLanguage) {
            monaco.editor.setModelLanguage(model, editorLanguage)
        }

        // 更新编码和换行符配置
        if (model) {
            // 设置行尾符号
            model.setEOL(
                currentFile.lineEnding === 'CRLF'
                    ? monaco.editor.EndOfLineSequence.CRLF
                    : monaco.editor.EndOfLineSequence.LF
            )
        }

        monaco.editor.setTheme(isDarkMode ? allHighLight?.[highLight][0] : allHighLight?.[highLight][1])

    }, [editorLanguage, isDarkMode, highLight, currentFile.encoding, currentFile.lineEnding])

    // 监听字体大小、行高和字体变化并更新编辑器
    useEffect(() => {
        if (!editorRef.current) return

        editorRef.current.updateOptions({
            fontSize: fontSize,
            lineHeight: lineHeight,
            fontFamily: `"${fontFamily}", monospace`
        })
    }, [fontSize, lineHeight, fontFamily])

    // 检查当前文件是否在黑名单中
    const isCurrentFileBlacklisted = useMemo(() => {
        return currentFile?.path && !currentFile.isTemporary && isFileBlacklisted(currentFile.path)
    }, [currentFile?.path, currentFile?.isTemporary])

    if (isCurrentFileBlacklisted) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column'
                }}
            >
                <Alert
                    message="不支持的文件类型"
                    description="该文件类型不支持在编辑器中查看和编辑。"
                    type="warning"
                    showIcon
                    style={{ maxWidth: '80%' }}
                />
            </div>
        )
    }

    if (!isShikiReady) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 200 }}>
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <div ref={containerRef} style={{ height: 'calc(100% - 24px)', width: '100%' }} />
        </div>
    )
}

export default EditorWithFileContext
