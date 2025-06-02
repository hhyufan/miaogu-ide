import { useState, useEffect, useCallback } from 'react'

/**
 * 背景管理 Hook
 * 统一管理背景图片和背景开关状态
 * 合并了原 useBackgroundStatus 的功能
 */
export const useBackgroundManager = () => {
    const [backgroundState, setBackgroundState] = useState({
        imagePath: '',
        isEnabled: false,
        transparency: { light: 50, dark: 50 }
    })

    // 计算是否有背景（合并自 useBackgroundStatus）
    const hasBackground = backgroundState.isEnabled && backgroundState.imagePath && backgroundState.imagePath !== ''

    // 初始化背景状态
    useEffect(() => {
        const initBackgroundState = async () => {
            try {
                const [bgImage, bgEnabled, transparency] = await Promise.all([
                    window.ipcApi.getBgImage(),
                    window.ipcApi.getBgEnabled(),
                    window.ipcApi.getBgTransparency()
                ])

                setBackgroundState({
                    imagePath: bgImage || '',
                    isEnabled: bgEnabled || false,
                    transparency: transparency || { light: 50, dark: 50 }
                })
            } catch (error) {
                console.error('初始化背景状态失败:', error)
            }
        }

        initBackgroundState().catch(console.error)

        // 监听背景图片变化（合并自 useBackgroundStatus）
        const handleBgImageChange = async (event, filePath) => {
            try {
                const bgEnabled = await window.ipcApi.getBgEnabled()
                setBackgroundState(prev => ({
                    ...prev,
                    imagePath: filePath || '',
                    isEnabled: bgEnabled || false
                }))
            } catch (error) {
                console.error('处理背景图片变化失败:', error)
            }
        }

        window.ipcApi.onBgImageChange(handleBgImageChange)
        return () => window.ipcApi.removeBgImageChange(handleBgImageChange)
    }, [])

    // 选择背景图片
    const selectBackgroundImage = useCallback(async () => {
        try {
            const filePath = await window.ipcApi.selectBgImage()
            if (filePath) {
                await window.ipcApi.setBgImage(filePath)
                setBackgroundState(prev => ({
                    ...prev,
                    imagePath: filePath
                }))
            }
            return filePath
        } catch (error) {
            console.error('选择背景图片失败:', error)
            return null
        }
    }, [])

    // 切换背景开关
    const toggleBackground = useCallback(async (enabled) => {
        try {
            await window.ipcApi.setBgEnabled(enabled)
            setBackgroundState(prev => ({
              ...prev,
              isEnabled: enabled
            }))
            if (backgroundState.imagePath && enabled)
            {
              await window.ipcApi.setBgImage(backgroundState.imagePath)
            }
        } catch (error) {
            console.error('切换背景开关失败:', error)
        }
    }, [])

    // 设置背景透明度
    const setBackgroundTransparency = useCallback(async (theme, value) => {
        try {
            await window.ipcApi.setBgTransparency(theme, value)
            setBackgroundState(prev => ({
                ...prev,
                transparency: {
                    ...prev.transparency,
                    [theme]: value
                }
            }))
        } catch (error) {
            console.error('设置背景透明度失败:', error)
        }
    }, [])

    return {
        backgroundState,
        hasBackground,
        selectBackgroundImage,
        toggleBackground,
        setBackgroundTransparency
    }
}
