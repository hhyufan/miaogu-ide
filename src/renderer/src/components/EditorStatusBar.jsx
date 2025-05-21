import { Divider, Dropdown, Button, Breadcrumb } from 'antd'
import { useFile } from '../contexts/FileContext'
import './EditorStatusBar.scss'
import { useRef, useState, useEffect } from 'react'
import ENCODING_CASE_MAP from './encoding-case.json'
import { FolderOutlined, FileOutlined } from '@ant-design/icons'

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
  const { currentFile, updateFileLineEnding, setOpenFile } = useFile()
  const encodingInputRef = useRef(null)
  const lineEndingInputRef = useRef(null)
  const [pathSegments, setPathSegments] = useState([])
  const [directoryContents, setDirectoryContents] = useState({})

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

  // 处理路径分段 - 当文件路径或临时状态变化时更新面包屑
  useEffect(() => {
    if (typeof currentFile.path === 'string' && currentFile.path && !currentFile.isTemporary) {
      // 分割路径为段落
      const segments = currentFile.path.split(/[\\/]/).filter(Boolean)

      // 如果是Windows路径，添加盘符作为第一个元素
      if (currentFile.path.match(/^[A-Za-z]:/)) {
        const driveLetter = segments.shift() + '\\'
        setPathSegments([driveLetter, ...segments])
      } else {
        setPathSegments(segments)
      }

      // 清除之前的目录内容缓存，确保切换文件后显示正确的目录内容
      setDirectoryContents({})
    } else {
      setPathSegments([])
    }
  }, [currentFile.path, currentFile.isTemporary])

  // 获取目录内容
  const getDirectoryContents = async (path) => {
    if (!window.ipcApi?.getDirectoryContents) return []

    try {
      const result = await window.ipcApi.getDirectoryContents(path)
      if (result.success) {
        return result.contents
      }
      return []
    } catch (error) {
      console.error('获取目录内容失败:', error)
      return []
    }
  }

  // 构建完整路径
  const buildFullPath = (index) => {
    if (index < 0 || !pathSegments.length) return ''

    // 对于Windows路径，特殊处理盘符
    if (pathSegments[0].endsWith('\\')) {
      const segments = [pathSegments[0], ...pathSegments.slice(1, index + 1)]
      return segments.join('\\')
    } else {
      return '/' + pathSegments.slice(0, index + 1).join('/')
    }
  }

  // 处理面包屑项点击
  const handleBreadcrumbClick = async (index) => {
    const dirPath = buildFullPath(index)
    if (!dirPath) return

    // 获取该目录下的内容
    const contents = await getDirectoryContents(dirPath)
    setDirectoryContents({ [index]: contents })
  }

  // 处理文件或目录点击
  const handleFileClick = async (filePath, isDirectory) => {
    if (!filePath) return
    // 如果是文件，才调用setOpenFile打开文件
    if (!isDirectory) {
      await setOpenFile(filePath)
    }
    // 文件打开后，更新路径分段
    if (filePath) {
      const segments = filePath.split(/[\\/]/).filter(Boolean)

      // 如果是Windows路径，添加盘符作为第一个元素
      if (filePath.match(/^[A-Za-z]:/)) {
        const driveLetter = segments.shift() + '\\'
        setPathSegments([driveLetter, ...segments])
      } else {
        setPathSegments(segments)
      }

      // 清除之前的目录内容缓存，确保切换文件后显示正确的目录内容
      setDirectoryContents({})
    }
  }

  // 生成面包屑下拉菜单项
  const getDropdownItems = (index) => {
    const contents = directoryContents[index] || []

    return contents.map((item) => ({
      key: item.path,
      label: item.name,
      icon: item.isDirectory ? <FolderOutlined /> : <FileOutlined />,
      onClick: () => handleFileClick(item.path, item.isDirectory)
    }))
  }
  // 渲染面包屑项
  const renderBreadcrumbItem = (segment, index) => {
    // 如果是目录，显示下拉菜单
    return (
      <Breadcrumb.Item key={index}>
        <Dropdown
          menu={{ items: getDropdownItems(index) }}
          trigger={['click']}
          placement="topLeft"
          overlayStyle={{
            maxHeight: '300px',
            overflow: 'auto'
          }}
          onOpenChange={(open) => {
            if (open) handleBreadcrumbClick(index)
          }}
        >
          <span style={{ cursor: 'pointer' }}>{segment}</span>
        </Dropdown>
      </Breadcrumb.Item>
    )
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
        {pathSegments.length > 0 ? (
          <Breadcrumb>{pathSegments.map(renderBreadcrumbItem)}</Breadcrumb>
        ) : (
          '未保存的文件'
        )}
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
