import { useState, useEffect } from 'react'
import SettingsHead from './components/Settings/SettingsHead'
import SettingsMenu from './components/Settings/SettingsMenu'

const Settings = () => {
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
  }, [localStorage.getItem('theme')])

  return (
    <div className="settings-container">
      <SettingsHead />
      <div className="settings-content" style={{ height: '100vh', width: '100%' }}>
        <SettingsMenu />
      </div>
    </div>
  )
}

export default Settings
