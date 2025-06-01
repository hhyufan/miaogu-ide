import { Layout, Button } from 'antd'
import { useState } from 'react'
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

    const handleMinimize = () => {
        window.ipcApi.minimizeWindow()
    }

    const handleMaximize = () => {
        window.ipcApi.maximizeWindow()
        setIsMaximized(!isMaximized) // 切换状态
    }

    const handleClose = async () => {
        window.ipcApi.closeWindow()
    }

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
