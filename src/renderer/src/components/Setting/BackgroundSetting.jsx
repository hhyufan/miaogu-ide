import { Button, Checkbox, Input, Slider } from 'antd'
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
                <h2>背景设置</h2>
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
                        <div style={{ display: 'flex', marginTop: 32, marginBottom: 50 }}>
                            <label style={{ marginRight: 16 }}>深色背景透明度</label>
                            <Slider
                                style={{ marginLeft: 16, width: 200 }}
                                value={backgroundState.transparency.dark}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(value) => handleBgTransparency('dark', value)}
                            />
                        </div>
                        <div style={{ display: 'flex', marginTop: 32, marginBottom: 50 }}>
                            <label style={{ marginRight: 16 }}>浅色背景透明度</label>
                            <Slider
                                style={{ marginLeft: 16, width: 200 }}
                                value={backgroundState.transparency.light}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(value) => handleBgTransparency('light', value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BackgroundSetting
