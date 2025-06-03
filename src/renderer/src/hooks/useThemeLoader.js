import { useEffect } from 'react'

/**
 * 自定义Hook：用于加载保存的主题设置
 * @param {Function} setIsDarkMode - 设置暗色模式状态的函数
 */
const useThemeLoader = (setIsDarkMode) => {
  useEffect(() => {
    ;(async () => {
      if (window.ipcApi && window.ipcApi.getTheme) {
        try {
          const savedTheme = await window.ipcApi.getTheme()
          if (savedTheme) {
            const isDark = savedTheme === 'dark'
            setIsDarkMode(isDark)
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
          }
        } catch (error) {
          console.error('加载保存的主题设置失败:', error)
        }
      }
    })()
  }, [])
}

export default useThemeLoader