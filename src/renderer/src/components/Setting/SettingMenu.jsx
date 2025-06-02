import { useState, useRef, useEffect } from 'react'
import { Button, message } from 'antd'
import { Menu } from 'antd'
import './SettingMenu.scss'
import TextEditor from './TextEditor'
import BackgroundSetting from './BackgroundSetting'

const settingMenuList = [
    {
        key: 'textEditor',
        label: '文本',
        children: [
            { key: 'fontSize', label: '字体大小' },
            { key: 'fontFamily', label: '字体' }
        ]
    },
    {
        key: 'background',
        label: '背景',
        children: []
    }
]

const SettingMenu = () => {
    const [activeKey, setActiveKey] = useState('')
    const contentRef = useRef(null)
    const [localSetting, setLocalSetting] = useState({})
    const [fontSize, setFontSize] = useState(14)
    const [fontFamily, setFontFamily] = useState('')
    const [currentSection, setCurrentSection] = useState('textEditor')
    const renderContent = () => {
        switch (currentSection) {
            case 'textEditor':
                return (
                    <TextEditor
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        fontFamily={fontFamily}
                        setFontFamily={setFontFamily}
                    />
                )
            case 'background':
                return <BackgroundSetting/>
            default:
                return null
        }
    }

    useEffect(() => {
        const LoadSetting = async () => {
            try {
                const savedSetting = await window.ipcApi.getSetting()
                if (savedSetting) {
                    setLocalSetting(savedSetting)
                    setFontSize(savedSetting.fontSize)
                    setFontFamily(savedSetting.fontFamily)
                }
            } catch (error) {
                console.error('加载字体大小设置失败:', error)
            }
        }

        // 初始加载字体大小
        LoadSetting().catch(console.error)

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

    const saveSetting = async () => {
        localSetting.fontSize = fontSize
        localSetting.fontFamily = fontFamily
        try {
            await window.ipcApi.setFontSize(fontSize)
            await window.ipcApi.setFontFamily(fontFamily)
            await window.ipcApi.setSetting(localSetting)
            message.success('设置保存成功')
        } catch (error) {
            message.error('设置保存失败')
            console.error('设置保存失败:', error)
        }
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ display: 'flow-root' }}>
                <Menu
                    mode="inline"
                    className="custom-setting-menu"
                    selectedKeys={[activeKey]}
                    style={{ width: 180, height: '100%', overflow: 'auto' }}
                >
                    {settingMenuList.map((group) => (
                        <Menu.SubMenu
                            key={group.key}
                            title={group.label}
                            onTitleClick={() => {
                                setCurrentSection(group.key)
                                setActiveKey(group.key)
                            }}
                        >
                            {group.children.map((item) => (
                                <Menu.Item
                                    key={item.key}
                                    onClick={() => {
                                        setCurrentSection(group.key)
                                        setActiveKey(item.key)
                                    }}
                                >
                                    {item.label}
                                </Menu.Item>
                            ))}
                        </Menu.SubMenu>
                    ))}
                </Menu>
            </div>
            <div
                ref={contentRef}
                style={{
                    flex: 1,
                    display: 'flow-root',
                    overflow: 'auto',
                    padding: 36
                }}
            >
                {renderContent()}
            </div>
            <div
                id="save"
                style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000 // 确保按钮在最上层
                }}
            >
                <Button type="primary" onClick={() => saveSetting()}>
                    保存
                </Button>
            </div>
        </div>
    )
}

export default SettingMenu
