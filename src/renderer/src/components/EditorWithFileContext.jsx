import { useEffect, useMemo, useRef, useState } from 'react'
import { useFile } from '../contexts/FileContext'
import * as monaco from 'monaco-editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import { Spin } from 'antd'
import extensionToLanguage from '../contexts/file-extensions.json'

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
  const { currentFile, currentCode, updateCode } = useFile()
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [isShikiReady, setIsShikiReady] = useState(false)
  const isInternalChange = useRef(false)
  const prevCodeRef = useRef(currentCode)

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
      minimap: { enabled: false },
      fontSize: 14,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      overviewRulerBorder: false,
      wordWrap: 'on'
    })

    prevCodeRef.current = currentCode

    return () => {
      editorRef.current?.dispose()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShikiReady])

  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) return

    const editor = editorRef.current
    if (prevCodeRef.current !== currentCode) {
      editor.setValue(currentCode)
      prevCodeRef.current = currentCode
    }
  }, [currentCode])

  useEffect(() => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const disposeContentChange = editor.onDidChangeModelContent(() => {
      isInternalChange.current = true
      const newValue = editor.getValue()
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

  useEffect(() => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()

    if (model && model.getLanguageId() !== editorLanguage) {
      monaco.editor.setModelLanguage(model, editorLanguage)
    }

    monaco.editor.setTheme(isDarkMode ? 'one-dark-pro' : 'one-light')
  }, [editorLanguage, isDarkMode])

  if (!isShikiReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 200 }}>
        <Spin size="large" />
      </div>
    )
  }

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}

export default EditorWithFileContext
