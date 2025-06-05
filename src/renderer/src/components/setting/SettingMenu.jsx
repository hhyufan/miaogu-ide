import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, message, Menu } from 'antd'
import './SettingMenu.scss'
import TextEditor from './TextEditor'
import BackgroundSetting from './BackgroundSetting'

// 使用 useMemo 优化菜单项
const items = [
    {
        key: 'textEditor',
        label: '通用',
    },
    {
        key: 'background',
        label: '外观',
    }
]

const SettingMenu = () => {
    const [activeKey, setActiveKey] = useState('textEditor')
    const contentRef = useRef(null)
    const [localSetting, setLocalSetting] = useState({})
    const [fontSize, setFontSize] = useState(14)
    const [lineHeight, setLineHeight] = useState(1.2)
    const [fontFamily, setFontFamily] = useState('')
    const [highLight, setHighLight] = useState('One')

    // 使用 useMemo 优化内容渲染
    const renderContent = useCallback(() => {
        switch (activeKey) {
            case 'textEditor':
                return (
                    <TextEditor
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        setLineHeight={setLineHeight}
                        setFontSize={setFontSize}
                        fontFamily={fontFamily}
                        setFontFamily={setFontFamily}
                        highLight = {highLight}
                        setHighLight = {setHighLight}
                    />
                )
            case 'background':
                return <BackgroundSetting />
            default:
                return null
        }
    }, [activeKey, fontSize, lineHeight, fontFamily, highLight])

    const handleFontSizeChange = useCallback((event, newFontSize) => {
        setFontSize(newFontSize)
    }, [])
    
    const handleLineHeightChange = useCallback((event, newLineHeight) => {
        setLineHeight(newLineHeight)
    }, [])

    useEffect(() => {
        const loadSetting = async () => {
            try {
                const savedSetting = await window.ipcApi.getSetting()
                if (savedSetting) {
                    setLocalSetting(savedSetting)
                    setLineHeight(savedSetting.lineHeight)
                    setFontSize(savedSetting.fontSize)
                    setFontFamily(savedSetting.fontFamily)
                    setHighLight(savedSetting.highLight)
                }
            } catch (error) {
                console.error('加载设置失败:', error)
            }
        }

        loadSetting().catch(console.error)

        window.ipcApi.onFontSizeChange(handleFontSizeChange)
        window.ipcApi.onLineHeightChange(handleLineHeightChange)

        return () => {
            window.ipcApi.removeFontSizeChange(handleFontSizeChange)
            window.ipcApi.removeLineHeightChange(handleLineHeightChange)
        }
    }, [handleFontSizeChange, handleLineHeightChange])

    const saveSetting = useCallback(async () => {
        const updatedSetting = {
            ...localSetting,
            fontSize,
            lineHeight,
            fontFamily,
            highLight
        }

        try {
            await window.ipcApi.setFontSize(fontSize)
            await window.ipcApi.setLineHeight(lineHeight)
            await window.ipcApi.setFontFamily(fontFamily)
            await window.ipcApi.setHighLight(highLight)
            await window.ipcApi.setSetting(updatedSetting)
            setLocalSetting(updatedSetting)
            message.success('设置保存成功')
        } catch (error) {
            message.error('设置保存失败')
            console.error('设置保存失败:', error)
        }
    }, [localSetting, fontSize, lineHeight, fontFamily, highLight])

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Menu
                mode="inline"
                className="custom-setting-menu"
                selectedKeys={[activeKey]}
                items={items}
                style={{ width: 180, height: '100%', overflow: 'auto' }}
                onClick={({ key }) => setActiveKey(key)}
            />

            <div
                ref={contentRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 36
                }}
            >
                {renderContent()}
            </div>

            {activeKey !== 'background' && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 1000
                    }}
                >
                    <Button type="primary" onClick={saveSetting}>
                        保存
                    </Button>
                </div>
            )}
        </div>
    )
}

export default SettingMenu
