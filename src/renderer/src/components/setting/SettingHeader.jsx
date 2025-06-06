import { Layout, Button } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import './SettingHeader.scss'

const { Header } = Layout
import {
    MinusOutlined,
    BorderOutlined,
    CloseOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons'

const SettingHeader = () => {
    const [isMaximized, setIsMaximized] = useState(false)

    const handleMinimize = useCallback(() => {
        window.ipcApi.minimizeSettingWindow()
    }, [])

    const handleMaximize = useCallback(() => {
        window.ipcApi.maximizeSettingWindow()
        setIsMaximized(!isMaximized)
    }, [isMaximized])

    const handleClose = useCallback(async () => {
        await window.ipcApi.closeSettingWindow()
    }, [])

    return (
        <Header className="setting-header">
            <div className="settingHead-title">设置</div>
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
        </Header>
    )
}

export default SettingHeader
