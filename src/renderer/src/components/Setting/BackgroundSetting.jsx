import { Button, Checkbox, Col, Input, InputNumber, Row, Slider, ConfigProvider } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useBackgroundManager } from '../../hooks/useBackgroundManager'

const BackgroundSetting = () => {
    const { backgroundState, selectBackgroundImage, toggleBackground, setBackgroundTransparency } = useBackgroundManager()
    const [localBgImage, setLocalBgImage] = useState('')

    const handleSelectBgImage = async () => {
        const filePath = await selectBackgroundImage()
        if (filePath) {
            setLocalBgImage(filePath)
        }
    }

    const handleToggleBackground = async (enabled) => {
        await toggleBackground(enabled)
    }

    const handleBgTransparency = (theme, value) => {
        setBackgroundTransparency(theme, value).catch(console.error)
    }

    // 同步背景状态
    useEffect(() => {
        setLocalBgImage(backgroundState.imagePath)
    }, [backgroundState])
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div id="background">
                <h2 style={{ fontWeight: 500, color: 'var(--text-secondary-color)' }}>外观</h2>
                <div
                    style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        marginTop: 32,
                        marginBottom: 32
                    }}
                >
                    <Checkbox
                        style={{ color: 'inherit' }}
                        checked={backgroundState.isEnabled}
                        onChange={(e) => {
                            handleToggleBackground(e.target.checked).catch(console.error)
                        }}
                    >
                        <span>开启背景</span>
                    </Checkbox>
                </div>
                {backgroundState.isEnabled && (
                    <div id="bgImage" style={{ marginBottom: 48, color: 'inherit' }}>
                        <div
                            style={{
                                display: 'flex',
                                gap: 16,
                                alignItems: 'flex-start',
                                marginTop: 32,
                                marginBottom: 32
                            }}
                        >
                            <Input value={localBgImage || backgroundState.imagePath} readOnly />
                            <Button icon={<UploadOutlined />} onClick={() => handleSelectBgImage()}>
                                浏览
                            </Button>
                        </div>
                        <h3 style={{ marginTop: 32, marginBottom: 24, fontSize: '16px', fontWeight: 600 }}>背景透明度</h3>

                        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <label style={{ minWidth: '50px', textAlign: 'left' }}>深色:</label>
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Slider: {
                                            trackBg: '#1677ff',
                                            handleColor: '#1677ff',
                                            handleActiveColor: '#1677ff',
                                            dotActiveBorderColor: '#1677ff'
                                        }
                                    }
                                }}
                            >
                                <Slider
                                    value={backgroundState.transparency.dark}
                                    min={0}
                                    max={100}
                                    step={1}
                                    style={{ width: '200px' }}
                                    onChange={(value) => handleBgTransparency('dark', value)}
                                />
                            </ConfigProvider>
                            <InputNumber
                                min={0}
                                max={100}
                                step={1}
                                value={backgroundState.transparency.dark}
                                onChange={(value) => handleBgTransparency('dark', value)}
                                addonAfter="%"
                                style={{ width: 92 }}
                            />
                        </div>

                        <div style={{ marginBottom: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <label style={{ minWidth: '50px', textAlign: 'left' }}>浅色:</label>
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Slider: {
                                            trackBg: '#1677ff',
                                            handleColor: '#1677ff',
                                            handleActiveColor: '#1677ff',
                                            dotActiveBorderColor: '#1677ff'
                                        }
                                    }
                                }}
                            >
                                <Slider
                                    value={backgroundState.transparency.light}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onChange={(value) => handleBgTransparency('light', value)}
                                    style={{ width: '200px' }}
                                />
                            </ConfigProvider>
                            <InputNumber
                                min={0}
                                max={100}
                                step={1}
                                value={backgroundState.transparency.light}
                                onChange={(value) => handleBgTransparency('light', value)}
                                addonAfter="%"
                                style={{ width: 92 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BackgroundSetting
