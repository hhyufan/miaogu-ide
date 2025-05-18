import { useState, useEffect } from 'react'
import { Layout, ConfigProvider, theme, Button } from 'antd'
import { SunOutlined, MoonFilled } from '@ant-design/icons'
import './App.scss'
import AppHeader from './components/AppHeader'
import TabBar from './components/TabBar'
const { Content } = Layout
import { FileProvider } from './contexts/FileContext'
import EditorWithFileContext from './components/EditorWithFileContext'
const App = () => {
  // 主题设置
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

  // 切换主题
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    // 保存到localStorage（向后兼容）
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')

    // 同时保存到electron-store
    if (window.ipcApi && window.ipcApi.setTheme) {
      window.ipcApi.setTheme(newTheme ? 'dark' : 'light').catch((error) => {
        console.error('保存主题设置失败:', error)
      })
    }

    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
  }

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // 从electron-store加载保存的主题
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
  return (
    <FileProvider>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 4,
            fontFamily:
              '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }
        }}
      >
        <Layout className="app-layout">
          <AppHeader />
          <TabBar />
          <Layout>
            <Content className="app-content">
              <div className="theme-toggle">
                <Button
                  type="text"
                  icon={isDarkMode ? <MoonFilled /> : <SunOutlined />}
                  onClick={toggleTheme}
                  title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
                  className="theme-toggle-btn"
                />
              </div>
              <div className="content-container">
                <div className="code-editor-container">
                  <EditorWithFileContext isDarkMode={isDarkMode} />
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </FileProvider>
  )
}

export default App
