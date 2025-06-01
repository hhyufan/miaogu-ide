import { Breadcrumb, Button, Divider, Dropdown, Tooltip } from 'antd'
import { useFile } from '../contexts/FileContext'
import './EditorStatusBar.scss'
import { useEffect, useRef, useState } from 'react'
import ENCODING_CASE_MAP from './encoding-case.json'
import { FileOutlined, FolderOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { filterDirectoryContents, isFileBlacklisted } from '../configs/file-blacklist'

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
  const breadcrumbRef = useRef(null)
  const filePathRef = useRef(null)
  const [pathSegments, setPathSegments] = useState([])
  const [directoryContents, setDirectoryContents] = useState({})
  const [fontSize, setFontSize] = useState(14)
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0)
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

  // 加载字体大小设置
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const savedSettings = await window.ipcApi.getSettings()
        if (savedSettings.fontSize) {
          setFontSize(savedSettings.fontSize)
        }
      } catch (error) {
        console.error('加载字体大小设置失败:', error)
      }
    }

    // 初始加载字体大小
    loadFontSize()

    // 监听字体大小变化事件
    const handleFontSizeChange = (event, newFontSize) => {
      setFontSize(newFontSize)
    }

    // 添加事件监听器
    window.ipcApi.onFontSizeChange(handleFontSizeChange)

    // 清理事件监听器
    return () => {
      window.ipcApi.removeFontSizeChange(handleFontSizeChange)
    }
  }, [])

  // 处理字体大小变化
  const handleFontSizeChange = async (newSize) => {
    console.log('newSize', newSize)
    // 限制字体大小范围在8-32之间
    const size = Math.max(8, Math.min(32, newSize))
    setFontSize(size)

    try {
      // 保存到持久化存储
      await window.ipcApi.setFontSize(size)
    } catch (error) {
      console.error('保存字体大小设置失败:', error)
    }
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

  // 检查滚动状态和更新滚动条
  const updateScrollState = () => {
    if (breadcrumbRef.current && filePathRef.current) {
      const breadcrumb = breadcrumbRef.current
      const container = filePathRef.current

      const scrollWidth = breadcrumb.scrollWidth
      const clientWidth = breadcrumb.clientWidth
      const scrollLeft = breadcrumb.scrollLeft
      const canScroll = scrollWidth > clientWidth

      setScrollState({
        canScroll,
        scrollLeft,
        scrollWidth,
        clientWidth
      })

      // 更新溢出状态的CSS类 - 只在有文件时显示省略号
      // 检查是否滚动到结尾（允许1px的误差）
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1
      const hasFile = currentFile.path && !currentFile.isTemporary

      if (hasFile && canScroll && !isAtEnd) {
        container.classList.add('has-overflow')
      } else {
        container.classList.remove('has-overflow')
      }

      // 更新滚动条位置和宽度
      const thumbElement = container.querySelector('.scroll-thumb')
      if (thumbElement) {
        if (canScroll) {
          const scrollPercentage = scrollLeft / (scrollWidth - clientWidth)
          const thumbWidth = Math.max(20, (clientWidth / scrollWidth) * 100)
          const thumbLeft = scrollPercentage * (100 - thumbWidth)

          thumbElement.style.width = `${thumbWidth}%`
          thumbElement.style.left = `${thumbLeft}%`
        } else {
          // 当不需要滚动时，重置滑块样式
          thumbElement.style.width = '20%'
          thumbElement.style.left = '0%'
        }
      }
    }
  }

  // 监听面包屑内容变化和窗口大小变化
  useEffect(() => {
    const timer = setTimeout(updateScrollState, 100)
    return () => clearTimeout(timer)
  }, [pathSegments])

  // 组件挂载时立即更新滚动状态
  useEffect(() => {
    updateScrollState()
  }, [])

  useEffect(() => {
    const handleResize = () => updateScrollState()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 处理滚动条点击
  const handleScrollBarClick = (e) => {
    if (!breadcrumbRef.current || !scrollState.canScroll || isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const maxScroll = scrollState.scrollWidth - scrollState.clientWidth
    breadcrumbRef.current.scrollLeft = percentage * maxScroll
    updateScrollState()
  }

  // 处理滚动条拖拽开始
  const handleThumbMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!breadcrumbRef.current || !scrollState.canScroll) return

    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScrollLeft(breadcrumbRef.current.scrollLeft)

    // 添加拖拽状态的CSS类
    if (filePathRef.current) {
      filePathRef.current.classList.add('dragging')
    }
  }

  // 处理鼠标移动（拖拽）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMouseMove = (e) => {
    if (!isDragging || !breadcrumbRef.current || !filePathRef.current) return

    const deltaX = e.clientX - dragStartX
    const containerRect = filePathRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const maxScroll = scrollState.scrollWidth - scrollState.clientWidth

    // 计算拖拽距离对应的滚动距离，设置灵敏度倍数
    const sensitivity = 2.0 // 灵敏度倍数
    const scrollDelta = (deltaX / containerWidth) * maxScroll * sensitivity
    const newScrollLeft = Math.max(0, Math.min(maxScroll, dragStartScrollLeft + scrollDelta))

    breadcrumbRef.current.scrollLeft = newScrollLeft
    updateScrollState()
  }

  // 处理鼠标释放（拖拽结束）
  const handleMouseUp = () => {
    setIsDragging(false)

    // 移除拖拽状态的CSS类
    if (filePathRef.current) {
      filePathRef.current.classList.remove('dragging')
    }
  }

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStartX, dragStartScrollLeft, handleMouseMove])

  // 处理面包屑滚动
  const handleBreadcrumbScroll = () => {
    updateScrollState()
  }

  // 获取目录内容
  const getDirectoryContents = async (path) => {
    if (!window.ipcApi?.getDirectoryContents) return []

    try {
      const result = await window.ipcApi.getDirectoryContents(path)
      if (result.success) {
        // 应用黑名单过滤
        return filterDirectoryContents(result.contents)
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
    // 如果是文件，检查是否在黑名单中，不在黑名单中才打开
    if (!isDirectory) {
      if (!isFileBlacklisted(filePath)) {
        await setOpenFile(filePath)
      } else {
        console.warn('该文件类型不支持在编辑器中打开:', filePath)
      }
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

    // 确保应用黑名单过滤，防止黑名单中的文件和目录显示在下拉菜单中
    const filteredContents = filterDirectoryContents(contents)

    // 对内容进行排序，目录排在前面，文件排在后面
    const sortedContents = [...filteredContents].sort((a, b) => {
      // 如果a是目录而b不是，a排在前面
      if (a.isDirectory && !b.isDirectory) return -1
      // 如果b是目录而a不是，b排在前面
      if (!a.isDirectory && b.isDirectory) return 1
      // 如果都是目录或都是文件，按名称字母顺序排序
      return a.name.localeCompare(b.name)
    })

    return sortedContents.map((item) => ({
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
            maxHeight: '265px',
            overflow: 'auto'
          }}
          onOpenChange={(open) => {
            if (open) handleBreadcrumbClick(index).catch(console.error)
          }}
        >
          <span style={{ cursor: 'pointer' }}>
            {/^[A-Z]:\\$/i.test(segment) ? segment.substring(0, 2) : segment}
          </span>
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
      <div className="status-item file-path" ref={filePathRef}>
        {/* 自定义滚动条轨道 - 只在有文件且需要滚动时显示 */}
        {currentFile.path && !currentFile.isTemporary && scrollState.canScroll && (
          <>
            <div className="scroll-track" onClick={handleScrollBarClick}></div>
            <div
              className={`scroll-thumb ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleThumbMouseDown}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            ></div>
          </>
        )}
        {pathSegments.length > 0 ? (
          <div
            ref={breadcrumbRef}
            onScroll={handleBreadcrumbScroll}
            className="breadcrumb-container"
          >
            <Breadcrumb
              separator={
                <svg
                  className="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  style={{ transform: 'translateY(3px)' }}
                >
                  <path
                    d="M704 514.368a52.864 52.864 0 0 1-15.808 37.888L415.872 819.2a55.296 55.296 0 0 1-73.984-2.752 52.608 52.608 0 0 1-2.816-72.512l233.6-228.928-233.6-228.992a52.736 52.736 0 0 1-17.536-53.056 53.952 53.952 0 0 1 40.192-39.424c19.904-4.672 40.832 1.92 54.144 17.216l272.32 266.88c9.92 9.792 15.616 23.04 15.808 36.8z"
                    fill="#1296db"
                    fillOpacity=".88"
                  ></path>
                </svg>
              }
            >
              {pathSegments.map(renderBreadcrumbItem)}
            </Breadcrumb>
          </div>
        ) : (
          '未保存的文件'
        )}
      </div>
      <div className="status-right">
        {/* 字体大小控制 */}
        <Tooltip title="减小字体">
          <Button
            type="text"
            size="small"
            className="status-item"
            onClick={() => handleFontSizeChange(+fontSize - 1)}
            icon={<ZoomOutOutlined />}
          />
        </Tooltip>

        <Tooltip title="字体大小">
          <Button type="text" size="small" className="status-item font-size-control">
            {fontSize}px
          </Button>
        </Tooltip>

        <Tooltip title="增大字体">
          <Button
            type="text"
            size="small"
            className="status-item"
            onClick={() => handleFontSizeChange(+fontSize + 1)}
            icon={<ZoomInOutlined />}
          />
        </Tooltip>

        <Divider type="vertical" />

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
