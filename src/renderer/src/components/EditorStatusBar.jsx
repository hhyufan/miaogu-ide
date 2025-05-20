import { Divider, Dropdown, Button } from 'antd'
import { useFile } from '../contexts/FileContext'
import './EditorStatusBar.scss'
import { useRef } from 'react'
import ENCODING_CASE_MAP from './encoding-case.json'

function standardizeEncodingName(encoding) {
  // 转换为小写进行匹配
  const lowerKey = encoding.toLowerCase()

  // 先处理特殊映射
  const specialMap = {
    'iso-8859-1': 'WINDOWS-1252', // 之前的别名映射
    gb2312: 'GB18030',
    big5: 'BIG5-HKSCS'
  }

  // 优先处理特殊映射
  const mapped = specialMap[lowerKey] || ENCODING_CASE_MAP[lowerKey] || encoding

  // 返回标准化名称（如果映射表中不存在则返回原值的大写形式）
  return mapped.toUpperCase() === mapped ? mapped : mapped.toUpperCase()
}
const EditorStatusBar = () => {
  const { currentFile, updateFileLineEnding } = useFile()
  const encodingInputRef = useRef(null)
  const lineEndingInputRef = useRef(null)

  // Line ending options
  const lineEndingOptions = [
    { value: 'LF', label: 'LF' },
    { value: 'CRLF', label: 'CRLF' },
    { value: 'CR', label: 'CR' }
  ]

  // Get current line ending label
  const getCurrentLineEndingLabel = () => {
    // 确保currentFile.lineEnding是字符串
    const lineEnding = typeof currentFile.lineEnding === 'string' ? currentFile.lineEnding : 'LF'
    const option = lineEndingOptions.find((opt) => opt.value === lineEnding)
    return option ? option.label : 'LF (\\n)'
  }

  // 获取当前编码标签
  const getCurrentEncodingLabel = () => {
    const encoding = typeof currentFile.encoding === 'string' ? currentFile.encoding : 'UTF-8'
    return standardizeEncodingName(encoding)
  }

  // Handle line ending change
  const handleLineEndingChange = (value) => {
    // 确保不直接渲染函数返回值
    if (updateFileLineEnding) {
      updateFileLineEnding(value)
    }
  }
  return (
    <div className="editor-status-bar">
      <div className="status-item file-path">
        {typeof currentFile.path === 'string' ? currentFile.path : '未保存的文件'}
      </div>
      <div className="status-right">
        <div className="status-item" ref={encodingInputRef}>
          <Button
            className="encoding-button"
            size="small"
            disabled={!currentFile.path || currentFile.isTemporary}
          >
            {getCurrentEncodingLabel()}
          </Button>
        </div>
        <Divider type="vertical" />
        <div className="status-item" ref={lineEndingInputRef}>
          <Dropdown
            disabled={!currentFile.path || currentFile.isTemporary}
            menu={{
              items: lineEndingOptions.map((option) => ({
                key: option.value,
                label: option.label,
                onClick: () => handleLineEndingChange(option.value)
              }))
            }}
            trigger={['click']}
            placement="topLeft"
          >
            <Button
              className="line-ending-button"
              size="small"
              disabled={!currentFile.path || currentFile.isTemporary}
            >
              {getCurrentLineEndingLabel()}
            </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

export default EditorStatusBar
