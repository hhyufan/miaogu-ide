import { useEffect, useState,useRef } from 'react'
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
const AppContent = ({ isDarkMode, toggleTheme, onRunCode, consoleVisible, onCloseConsole }) => {
  const { currentFile } = useFile()
  const [previousFilePath, setPreviousFilePath] = useState(null)

  // 监听文件切换，自动关闭控制台
  useEffect(() => {
    if (currentFile && currentFile.path !== previousFilePath) {
      // 如果文件路径发生变化且控制台是打开的，则关闭控制台
      if (consoleVisible && previousFilePath !== null) {
        onCloseConsole()
      }
      setPreviousFilePath(currentFile.path)
    }
  }, [currentFile, previousFilePath, consoleVisible, onCloseConsole])
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

  useEffect(() => {
    const loadInitBgTransparency = async () => {
      const transparencySetting = await window.ipcApi.getBgTransparency();
      document.documentElement.style.setProperty(
        '--editor-background', 
        `rgba(${isDarkMode ? '0, 0, 0,' : '255, 255, 255,'} ${isDarkMode ?  transparencySetting.dark / 100 : transparencySetting.light / 100})`);
    }
    loadInitBgTransparency();
  }, [isDarkMode]);

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // 监听切换主题快捷键 (Ctrl+T)
  useEffect(() => {
    // 监听来自主进程的toggle-theme事件
    const handleToggleTheme = () => {
      toggleTheme()
    }

    // 添加事件监听器
    window.ipcApi.onToggleTheme(handleToggleTheme)

    // 清理事件监听器
    return () => {
      window.ipcApi.removeToggleTheme(handleToggleTheme)
    }
  }, [toggleTheme])

  // 从electron-store加载保存的主题
  useEffect(() => {
    ; (async () => {
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

  useEffect(() => {
    const handleBgImageChange = async (event, filePath) => {
      const randomBackground = await window.ipcApi.getState('randomBackground')
      const imgPath = await window.electron.nativeImage.createFromPath(filePath)
      document.documentElement.style.setProperty(
        '--editor-background-image',
        `url(${randomBackground ? filePath : imgPath.toDataURL()})`);
    };
  
    window.ipcApi.onBgImageChange(handleBgImageChange);
    return () => window.ipcApi.removeBgImageChange(handleBgImageChange);
  }, []);

  const isDarkModeRef = useRef(isDarkMode);

    // 更新 ref 的值
    useEffect(() => {
      isDarkModeRef.current = isDarkMode;
    }, [isDarkMode]);

    useEffect(() => {
      const handleBgTransparencyChange = (event, theme, transparency) => {
        
        // 使用 ref 获取最新 isDarkMode
        if (theme === 'dark' && isDarkModeRef.current) {
          document.documentElement.style.setProperty(
            '--editor-background', 
            `rgba(0, 0, 0, ${transparency / 100})`
          );
        } 
        else if (theme === 'light' && !isDarkModeRef.current) {
          document.documentElement.style.setProperty(
            '--editor-background', 
            `rgba(255, 255, 255, ${transparency / 100})`
          );
        }
      };
      // 注册监听（只运行一次）
      window.ipcApi.onBgTransparencyChange(handleBgTransparencyChange);
      
      return () => {
        // 确保移除的是同一个函数
        window.ipcApi.removeBgTransparencyChange(handleBgTransparencyChange);
      };
    }, []); // 空依赖，避免重复绑定
      

  useEffect(() => {
    // 这里写你要执行的方法
    const loadInitialData = async () => {
      try {
        const bgImgPath = await window.ipcApi.getBgImage();
        const randomBackground = await window.ipcApi.getState('randomBackground')
        const img = await window.electron.nativeImage.createFromPath(bgImgPath);
        document.documentElement.style.setProperty(
          '--editor-background-image',
          `url(${randomBackground ? 'https://t.alcy.cc/moez' : img.toDataURL()})`
        )
        const transparencySetting = await window.ipcApi.getBgTransparency();
        document.documentElement.style.setProperty(
          '--editor-background', 
          `rgba(${isDarkMode ? '0, 0, 0,' : '255, 255, 255,'} ${isDarkMode ?  transparencySetting.dark / 100 :  transparencySetting.light / 100})`);
        }
      // 其他初始化操作...
      catch (error) {
        console.error('加载初始数据失败:', error);
      }
    };

    loadInitialData();  // 调用这个方法
  }, []); // 空数组表示只在组件挂载时执行一次

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
                onCloseConsole={handleCloseConsole}
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
