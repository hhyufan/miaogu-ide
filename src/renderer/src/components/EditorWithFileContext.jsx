import { useEffect, useMemo, useRef, useState } from 'react'
import { useFile } from '../contexts/FileContext'
import * as monaco from 'monaco-editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import { Spin } from 'antd'
import extensionToLanguage from '../contexts/file-extensions.json'
import EditorStatusBar from './EditorStatusBar'
import '../monaco-setup'
let highlighterPromise = null
const initializeHighlighter = async () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-dark-pro', 'one-light', 'andromeeda', 'aurora-x'],
      langs: [...new Set(Object.values(extensionToLanguage))]
    }).then((hl) => {
      shikiToMonaco(hl, monaco)
      return hl
    })
  }
  return highlighterPromise
}

// eslint-disable-next-line react/prop-types
const EditorWithFileContext = ({ isDarkMode }) => {
  const { currentFile, currentCode, updateCode, refreshFileContent } = useFile()
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [isShikiReady, setIsShikiReady] = useState(false)
  const isInternalChange = useRef(false)
  const prevCodeRef = useRef(currentCode)
  const prevEncodingRef = useRef(currentFile.encoding)

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
    const extension = filename.split('.').pop()
    return extensionToLanguage[extension] || 'plaintext'
  }, [currentFile?.name])

  useEffect(() => {
    if (!containerRef.current || !isShikiReady || editorRef.current) return
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: currentCode,
      language: editorLanguage,
      theme: isDarkMode ? 'one-dark-pro' : 'one-light',
      minimap: { enabled: true },
      fontSize: 14,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      overviewRulerBorder: false,
      wordWrap: 'on',
      lineEnding: currentFile.lineEnding === 'CRLF' ? '\r\n' : '\n'
    })

    prevCodeRef.current = currentCode
    prevEncodingRef.current = currentFile.encoding

    return () => {
      editorRef.current?.dispose()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShikiReady])

  // 监听currentCode和编码变化，更新编辑器内容
  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) return
    const editor = editorRef.current

    // 始终设置编辑器的值，确保空文件不会继承之前的内容
    editor.setValue(currentCode)
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

    monaco.editor.setTheme(isDarkMode ? 'one-dark-pro' : 'one-light')
  }, [editorLanguage, isDarkMode, currentFile.encoding, currentFile.lineEnding])

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
      <EditorStatusBar />
    </div>
  )
}

export default EditorWithFileContext
