import './TabBar.scss'

import { useCallback, useEffect, useMemo } from 'react'
import { useBackgroundManager } from '../hooks/useBackgroundManager'
import { useCurrentFile, useOpenedFiles, useFileActions } from '../hooks/useFileManager'
import { EditOutlined, FileAddOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
const TabBar = ({ fileManager }) => {
    const currentFile = useCurrentFile(fileManager)
    const openedFiles = useOpenedFiles(fileManager)
    const { switchFile, closeFile } = useFileActions(fileManager)
    const { hasBackground } = useBackgroundManager()

    const onChange = useCallback((activeKey) => {
        switchFile(activeKey)
    }, [switchFile])

    const onEdit = useCallback((targetKey, action) => {
        if (action === 'remove') {
            closeFile(targetKey)
        }
    }, [closeFile])

    const items = useMemo(() => openedFiles.map((file) => ({
        key: file.path,
        label: (
            <span>
                {file.name}
                {file.isModified && !file.isTemporary && (
                    <EditOutlined
                        style={{ marginLeft: '5px', fontSize: '12px', color: '#faad14' }}
                    />
                )}
                {file.isTemporary && (
                    <FileAddOutlined
                        style={{ marginLeft: '5px', fontSize: '12px', color: '#1890ff' }}
                    />
                )}
            </span>
        ),
        closable: true
    })), [openedFiles])

    // 使用useEffect设置或移除CSS变量
    useEffect(() => {
        if (openedFiles.length === 0) {
            document.documentElement.style.setProperty('--tab-bar-height', '0px')
        } else {
            document.documentElement.style.setProperty('--tab-bar-height', '40px')
        }

        // 组件卸载时清理
        return () => {
            document.documentElement.style.setProperty('--tab-bar-height', '0px')
        }
    }, [openedFiles.length])

    // 如果没有打开的文件，不渲染标签栏
    if (openedFiles.length === 0) {
        return null
    }

    return (
        <div className={`tab-bar ${hasBackground ? 'with-background' : ''}`}>
            <Tabs
                type="editable-card"
                onChange={onChange}
                activeKey={currentFile.path}
                onEdit={onEdit}
                items={items}
                hideAdd
            />
        </div>
    )
}

export default TabBar
