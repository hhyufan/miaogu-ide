import './Setting.scss'

import { useState, useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import SettingMenu from './components/setting/SettingMenu'
import SettingHeader from './components/setting/SettingHeader'
import useThemeLoader from './hooks/useThemeLoader'

const Setting = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 首先尝试从localStorage获取（向后兼容）
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    // 如果没有，尝试从electron-store获取
    if (window.ipcApi && window.ipcApi.getTheme) {
      // 由于useState不能直接使用异步函数，我们先返回系统默认值
      // 然后在useEffect中异步加载保存的主题
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    // 如果都没有，使用系统默认值
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // 监听主题变化事件，同步主窗口的主题状态
  useEffect(() => {
    const handleToggleTheme = async () => {
        // 从electron-store获取当前实际的主题状态
        const currentTheme = await window.ipcApi.getTheme()
        const isDark = currentTheme === 'dark'
        setIsDarkMode(isDark)
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    // 添加事件监听器
    window.ipcApi.onToggleTheme(handleToggleTheme)

    // 清理事件监听器
    return () => {
      window.ipcApi.removeToggleTheme(handleToggleTheme)
    }
  }, [])

  // 使用自定义hook加载保存的主题
  useThemeLoader(setIsDarkMode)

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#177ddc' : '#1677ff',
          colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
          colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
          colorText: isDarkMode ? '#f0f0f0' : '#333333',
          colorTextSecondary: isDarkMode ? '#a0a0a0' : '#666666',
          colorBorder: isDarkMode ? '#303030' : '#e8e8e8',
          colorBgLayout: isDarkMode ? '#1e1f22' : '#f5f5f5',
        },
      }}
    >
      <div className="setting-container">
        <SettingHeader />
        <div className="setting-content" style={{ height: '100vh', width: '100%' }}>
          <SettingMenu />
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Setting
