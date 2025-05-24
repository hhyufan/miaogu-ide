import { useState, useEffect } from 'react'
import { Layout, ConfigProvider, theme, Button } from 'antd'
import { SunOutlined, MoonFilled } from '@ant-design/icons'
import './App.scss'
import AppHeader from './components/AppHeader'
import TabBar from './components/TabBar'
import Console from './components/Console'
const { Content } = Layout
import { FileProvider, useFile } from './contexts/FileContext'
import EditorWithFileContext from './components/EditorWithFileContext'
import JavaScriptRunner from './components/JavaScriptRunner'
import EditorStatusBar from './components/EditorStatusBar'

// 内部组件，用于访问文件上下文
// eslint-disable-next-line react/prop-types
const AppContent = ({ isDarkMode, toggleTheme, onRunCode, consoleVisible }) => {
  const { currentFile } = useFile()
  // 检查文件是否为JavaScript文件
  const isJavaScriptFile = (fileName) => {
    if (!fileName) return false
    const ext = fileName.toLowerCase().split('.').pop()
    return ['js', 'jsx', 'mjs', 'cjs'].includes(ext)
  }

  return (
    <>
      <div className="theme-toggle">
        <Button
          type="text"
          icon={isDarkMode ? <MoonFilled /> : <SunOutlined />}
          onClick={toggleTheme}
          title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
          className="theme-toggle-btn"
        />
      </div>
      {/* JavaScript运行按钮 - 只在当前文件为JS文件时显示 */}
      {currentFile && currentFile.name && isJavaScriptFile(currentFile.name) && (
        <div className="js-runner-container">
          <JavaScriptRunner
            code={currentFile.content || ''}
            onOutput={onRunCode}
            disabled={false}
          />
        </div>
      )}
      <div className="content-container">
        <div className={`code-editor-container ${consoleVisible ? 'with-console' : ''}`}>
          <EditorWithFileContext isDarkMode={isDarkMode} />
        </div>
      </div>
    </>
  )
}

const App = () => {
  // 控制台状态
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [consoleOutputs, setConsoleOutputs] = useState([])

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

  // 处理代码运行输出
  const handleRunCode = (output) => {
    if (output.type === 'clear') {
      setConsoleOutputs([])
    } else {
      setConsoleOutputs((prev) => [...prev, output])
    }

    // 显示控制台
    if (!consoleVisible) {
      setConsoleVisible(true)
    }
  }

  // 清空控制台
  const handleClearConsole = () => {
    setConsoleOutputs([])
  }

  // 关闭控制台
  const handleCloseConsole = () => {
    setConsoleVisible(false)
    setConsoleOutputs([])
  }
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
          <TabBar onRunCode={handleRunCode} />
          <Layout className="main-layout">
            <Content className={`app-content ${consoleVisible ? 'with-console' : ''}`}>
              <AppContent
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onRunCode={handleRunCode}
                consoleVisible={consoleVisible}
              />
            </Content>
            {consoleVisible && (
              <div className="console-layout">
                <Console
                  outputs={consoleOutputs}
                  onClear={handleClearConsole}
                  onClose={handleCloseConsole}
                  visible={consoleVisible}
                />
              </div>
            )}
            <EditorStatusBar />
          </Layout>
        </Layout>
      </ConfigProvider>
    </FileProvider>
  )
}

export default App
