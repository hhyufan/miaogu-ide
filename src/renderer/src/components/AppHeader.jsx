import { Layout, Button, Dropdown, Modal, Input, Typography, Checkbox } from 'antd'
import {
  MinusOutlined,
  BorderOutlined,
  CloseOutlined,
  FullscreenExitOutlined,
  PlusSquareOutlined,
  FileOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  SaveFilled,
  SettingOutlined,
  FileAddOutlined
} from '@ant-design/icons'
import { isFileBlacklisted } from '../configs/file-blacklist'
import './AppHeader.scss'
import { useState, useEffect, useRef } from 'react'
import { useFile } from '../contexts/FileContext'
const { Header } = Layout
const { Title, Text } = Typography

const AppHeader = () => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [unsavedModalVisible, setUnsavedModalVisible] = useState(false)
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const [editedFileName, setEditedFileName] = useState('')
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [originalFileName, setOriginalFileName] = useState('')
  const fileNameInputRef = useRef(null)
  const selectedFilesRef = useRef(selectedFiles)
  // 使用文件上下文
  const {
    currentFile,
    openFile,
    createFile,
    saveFile,
    exportFile,
    getUnsavedFiles,
    updateDefaultFileName,
    saveFiles,
    renameFile
  } = useFile()
  // 窗口控制函数
  const handleMinimize = () => {
    window.ipcApi.minimizeWindow()
  }

  // 添加键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+N: 新建文件
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault() // 阻止浏览器默认的打开行为
        setIsModalVisible(true) // 新建文件
      }

      // Ctrl+O: 打开文件
      if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
        e.preventDefault() // 阻止浏览器默认的打开行为
        openFile() // 打开文件
      }

      // Ctrl+S: 保存文件
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault() // 阻止浏览器默认的保存行为
        saveFile(false) // 保存文件
      }

      // Ctrl+Shift+S: 另存为
      if (e.ctrlKey && e.key === 'S' && e.shiftKey) {
        e.preventDefault()
        saveFile(true) // 另存为
      }
    }

    // 添加事件监听
    window.addEventListener('keydown', handleKeyDown)

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [openFile, saveFile])
  const handleMaximize = () => {
    window.ipcApi.maximizeWindow()
    setIsMaximized(!isMaximized) // 切换状态
  }
  const handleFileNameEdit = (e) => {
    const newName = e.target.value
    setEditedFileName(newName)

    // If no file is open, update the defaultFileName immediately
    if (!currentFile.path) {
      updateDefaultFileName(newName)
    }
  }
  // 处理单个文件选择
  const handleSelectFile = (e, file) => {
    const checked = e.target.checked
    setSelectedFiles((prev) => (checked ? [...prev, file] : prev.filter((path) => path !== file)))
  }
  const saveSelectedFiles = async (filesToSave) => {
    setUnsavedModalVisible(false)
    await saveFiles(filesToSave)
    window.ipcApi.closeWindow()
  }

  // 同步selectedFiles到ref
  useEffect(() => {
    selectedFilesRef.current = selectedFiles
  }, [selectedFiles])

  const handleClose = async () => {
    const unsavedFiles = getUnsavedFiles()
    if (unsavedFiles.length > 0) {
      setUnsavedModalVisible(true)
    } else {
      window.ipcApi.closeWindow()
    }
  }

  // 文件操作函数
  const handleOpenFile = () => {
    openFile()
  }

  const handleCreateFile = () => {
    setIsModalVisible(true)
  }

  const handleModalOk = () => {
    if (newFileName.trim()) {
      // 检查文件名是否在黑名单中
      if (isFileBlacklisted(newFileName)) {
        Modal.warning({ title: '不支持的文件类型', content: '该文件类型不支持在编辑器中创建。' })
        return
      }

      // 使用文件上下文的创建文件方法
      createFile(newFileName)
      setIsModalVisible(false)
      setNewFileName('')
    }
  }

  // 保存文件
  const handleSaveFile = () => {
    // 如果当前没有打开的文件，但有默认文件名，使用该文件名保存
    saveFile()
  }
  const handleExportFile = () => {
    exportFile()
  }
  const handleModalCancel = () => {
    setIsModalVisible(false)
    setNewFileName('')
  }

  // 文件菜单项
  const fileMenuItems = [
    {
      key: 'open',
      label: '打开',
      icon: <FolderOpenOutlined />,
      onClick: handleOpenFile,
      extra: 'Ctrl + O'
    },
    {
      key: 'save',
      label: '保存',
      icon: <SaveOutlined />,
      onClick: handleSaveFile,
      extra: 'Ctrl + S'
    },
    {
      key: 'export',
      label: '另存为',
      icon: <SaveFilled />,
      onClick: handleExportFile,
      extra: 'Ctrl + Shift + S'
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      onClick: () => console.log('打开设置')
    }
  ]

  return (
    <Header className="app-header">
      <div className="left-container">
        <Dropdown menu={{ items: fileMenuItems }} trigger={['click']}>
          <Button type="text" className="file-menu-btn">
            <FileOutlined /> 文件
          </Button>
        </Dropdown>
        <Button
          type="text"
          icon={<PlusSquareOutlined />}
          onClick={handleCreateFile}
          className="create-file-btn"
        />
      </div>

      <div className="file-info-container">
        {isEditingFileName ? (
          <input
            spellCheck={false}
            ref={fileNameInputRef}
            type="text"
            className="file-title-edit"
            value={editedFileName}
            onChange={(e) => handleFileNameEdit(e)}
            onBlur={() => {
              if (editedFileName.trim() && editedFileName !== currentFile.name) {
                // 临时文件或无标签页状态下直接重命名，不显示确认弹窗
                if (currentFile.isTemporary) {
                  renameFile(editedFileName)
                  setIsEditingFileName(false)
                } else {
                  // 对于普通文件，显示确认弹窗
                  setOriginalFileName(currentFile.name)
                  setRenameModalVisible(true)
                }
              } else {
                setIsEditingFileName(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editedFileName.trim() && editedFileName !== currentFile.name) {
                  // 临时文件或无标签页状态下直接重命名，不显示确认弹窗
                  if (currentFile.isTemporary) {
                    renameFile(editedFileName)
                    setIsEditingFileName(false)
                  } else {
                    // 对于普通文件，显示确认弹窗
                    setOriginalFileName(currentFile.name)
                    setRenameModalVisible(true)
                  }
                } else {
                  setIsEditingFileName(false)
                }
              } else if (e.key === 'Escape') {
                setIsEditingFileName(false)
                setEditedFileName(currentFile.name)
              }
            }}
          />
        ) : (
          <Title
            level={4}
            className="file-title"
            onClick={() => {
              // 无论是否有打开的文件，都允许编辑文件名
              setEditedFileName(currentFile.name)
              setOriginalFileName(currentFile.name)
              setIsEditingFileName(true)
              setTimeout(() => fileNameInputRef.current?.focus(), 0)
            }}
            style={{ cursor: 'pointer' }}
          >
            {currentFile.name}
          </Title>
        )}
        {currentFile.path && !currentFile.isTemporary && (
          <Text type="secondary" className="file-path">
            {currentFile.path}
          </Text>
        )}
      </div>

      <div className="window-controls">
        <Button
          type="text"
          icon={<MinusOutlined />}
          onClick={handleMinimize}
          className="window-control-btn"
        />
        <Button
          type="text"
          icon={isMaximized ? <FullscreenExitOutlined /> : <BorderOutlined />}
          onClick={handleMaximize}
          className="window-control-btn"
        />
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          className="window-control-btn close-btn"
        />
      </div>

      <Modal
        className="header-modal"
        title="创建新文件"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={350}
      >
        <Input
          placeholder="请输入文件名"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onPressEnter={handleModalOk}
          style={{ width: '100%' }} // Input宽度继承Modal内容区宽度
        />
      </Modal>
      <Modal
        className="header-modal"
        title="未保存的文件"
        open={unsavedModalVisible}
        onCancel={() => setUnsavedModalVisible(false)}
        maskClosable={false}
        width={400}
        footer={[
          <Button
            className="custom-button-warning"
            key="cancel"
            onClick={() => window.ipcApi.closeWindow()}
          >
            不保存
          </Button>,
          <Button
            key="save"
            className="custom-button-success"
            disabled={selectedFiles.length === 0}
            onClick={() => saveSelectedFiles(selectedFilesRef.current)}
          >
            保存选中文件({selectedFiles.length})
          </Button>
        ]}
      >
        <div className="unsaved-files-modal">
          <p>以下文件有未保存的更改，请选择要保存的文件：</p>
          <div className="file-checkbox-list">
            {getUnsavedFiles().map((file) => (
              <div key={file.path} className="file-checkbox-item">
                <Checkbox
                  onChange={(e) => handleSelectFile(e, file)}
                  checked={selectedFiles.map((file) => file.path).includes(file.path)}
                >
                  {file.name}{' '}
                  {file.isTemporary && (
                    <FileAddOutlined
                      style={{ marginLeft: '5px', fontSize: '12px', color: '#1890ff' }}
                    />
                  )}
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 重命名确认弹窗 */}
      <Modal
        className="header-modal"
        title="确认重命名"
        open={renameModalVisible}
        onOk={async () => {
          const result = await renameFile(editedFileName)
          if (result && !result.success && result.conflict) {
            // 如果有文件名冲突，显示确认覆盖对话框
            Modal.confirm({
              title: '文件已存在',
              content: `文件 "${editedFileName}" 已存在，是否覆盖？`,
              okText: '覆盖',
              okType: 'danger',
              cancelText: '取消',
              onOk: async () => {
                // 确认覆盖，再次调用重命名函数并传入覆盖参数
                await renameFile(editedFileName, true)
                setRenameModalVisible(false)
                setIsEditingFileName(false)
              },
              onCancel: () => {
                // 用户取消覆盖，保持编辑状态
                setRenameModalVisible(false)
              }
            })
          } else {
            // 重命名成功或没有冲突
            setRenameModalVisible(false)
            setIsEditingFileName(false)
          }
        }}
        onCancel={() => {
          setRenameModalVisible(false)
          setIsEditingFileName(false)
          setEditedFileName(originalFileName)
        }}
        width={350}
      >
        <p>
          是否将文件 &#34;{originalFileName}&#34; 重命名为 &#34;{editedFileName}&#34;？
        </p>
      </Modal>
    </Header>
  )
}

export default AppHeader
