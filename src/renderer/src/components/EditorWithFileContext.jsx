import { Editor } from '@monaco-editor/react'
import { Spin } from 'antd'
import { monaco } from '../monaco/monaco-config'
import { useFile } from '../contexts/FileContext'
import { useEffect, useMemo, useRef } from 'react'

// eslint-disable-next-line react/prop-types
const EditorWithFileContext = ({ isDarkMode }) => {
  // 修改后的hook获取方式
  const { currentFile, currentCode, updateCode } = useFile()

  // 添加编辑器实例引用
  const editorRef = useRef(null)

  const editorLanguage = useMemo(() => {
    if (!currentFile?.name) return 'plaintext'
    const extension = currentFile.name.split('.').pop().toLowerCase()
    return extension === 'py' ? 'python' : extension === 'js' ? 'javascript' : 'plaintext'
  }, [currentFile?.name])

  // 添加文件路径变化的处理
  useEffect(() => {
    if (editorRef.current && currentFile) {
      // 强制设置编辑器内容
      editorRef.current.setValue(currentCode)
    }
  }, [currentFile.path, currentCode, currentFile])

  return (
    <Editor
      key={currentFile?.path || 'new-file'} // 关键！通过key强制重新渲染
      height="100%"
      language={editorLanguage}
      theme={monaco.getThemeName(isDarkMode)}
      value={currentCode} // 使用currentCode而不是code
      onChange={updateCode}
      loading={<Spin size="large" />}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        overviewRulerBorder: false,
        wordWrap: 'on'
      }}
    />
  )
}

export default EditorWithFileContext
