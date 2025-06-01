import { useState, useEffect } from 'react'

/**
 * 自定义 Hook 用于管理背景图片状态
 * @returns {boolean} hasBackground - 是否有背景图片
 */
export const useBackgroundStatus = () => {
  const [hasBackground, setHasBackground] = useState(false)

  useEffect(() => {
    const checkBackgroundStatus = async () => {
      try {
        const bgImgPath = await window.ipcApi.getBgImage()
        setHasBackground(bgImgPath && bgImgPath !== '')
      } catch (error) {
        console.error('获取背景图片状态失败:', error)
        setHasBackground(false)
      }
    }

    // 初始检查
    checkBackgroundStatus().catch(console.error)

    // 监听背景图片变化
    const handleBgImageChange = async (event, filePath) => {
      setHasBackground(filePath && filePath !== '')
    }

    window.ipcApi.onBgImageChange(handleBgImageChange)
    return () => window.ipcApi.removeBgImageChange(handleBgImageChange)
  }, [])

  return hasBackground
}