/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react'
import { Layout, ConfigProvider, theme, Button } from 'antd'
import { SunOutlined, MoonFilled } from '@ant-design/icons'
import './App.scss'
import AppHeader from './components/AppHeader'
import TabBar from './components/TabBar'
import Console from './components/Console'
const { Content } = Layout
import { FileProvider, useFile } from './contexts/FileContext'
import EditorWithFileContext from './components/EditorWithFileContext'
import CodeRunner from './components/CodeRunner'
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

    // 检查文件是否为HTML文件
    const isHTMLFile = (fileName) => {
        if (!fileName) return false
        const ext = fileName.toLowerCase().split('.').pop()
        return ['html', 'htm'].includes(ext)
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
            {/* 代码运行按钮 - 支持JavaScript和HTML文件 */}
            {currentFile &&
                currentFile.name &&
                (isJavaScriptFile(currentFile.name) || isHTMLFile(currentFile.name)) && (
                    <div className="code-runner-container">
                        <CodeRunner
                            code={currentFile.content || ''}
                            filePath={currentFile.path}
                            onOutput={onRunCode}
                            disabled={false}
                            fileType={isHTMLFile(currentFile.name) ? 'html' : 'javascript'}
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

    const consoleLayoutRef = useRef(null);
    const [consoleHeight, setConsoleHeight] = useState(276);

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
        // 同时保存到electron-store
        if (window.ipcApi && window.ipcApi.setTheme) {
            window.ipcApi.setTheme(!isDarkMode ? 'dark' : 'light').catch((error) => {
                console.error('保存主题设置失败:', error)
            })
        }
    }

    const changeTheme = () => {
        const newTheme = !isDarkMode
        setIsDarkMode(newTheme)
        // 保存到localStorage（向后兼容）
        localStorage.setItem('theme', newTheme ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
    }
    useEffect(() => {
        const loadInitBgTransparency = async () => {
            const [transparencySetting, bgEnabled, bgImage] = await Promise.all([
                window.ipcApi.getBgTransparency(),
                window.ipcApi.getBgEnabled(),
                window.ipcApi.getBgImage()
            ])
            // 如果背景未开启或背景图片路径为空，不改变透明度
            if (!bgEnabled || !bgImage || bgImage === '') {
                return
            }
            document.documentElement.style.setProperty(
                '--editor-background',
                `rgba(${isDarkMode ? '0, 0, 0,' : '255, 255, 255,'} ${isDarkMode ? transparencySetting.dark / 100 : transparencySetting.light / 100})`
            )
        }
        loadInitBgTransparency().catch(console.error)
    }, [isDarkMode])

    // 初始化主题
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    // 监听切换主题快捷键 (Ctrl+T)
    useEffect(() => {
        // 监听来自主进程的toggle-theme事件
        const handleToggleTheme = () => {
            changeTheme()
        }

        // 添加事件监听器
        window.ipcApi.onToggleTheme(handleToggleTheme)

        // 清理事件监听器
        return () => {
            window.ipcApi.removeToggleTheme(handleToggleTheme)
        }
    }, [toggleTheme]) // Now safe to include toggleTheme since it's memoized with useCallback

    // 从electron-store加载保存的主题
    useEffect(() => {
        ; (async () => {
            if (window.ipcApi && window.ipcApi.getTheme) {
                try {
                    const savedTheme = await window.ipcApi.getTheme()
                    if (savedTheme) {
                        const isDark = savedTheme === 'dark'
                        setIsDarkMode(isDark)
                        document.documentElement.setAttribute(
                            'data-theme',
                            isDark ? 'dark' : 'light'
                        )
                    }
                } catch (error) {
                    console.error('加载保存的主题设置失败:', error)
                }
            }
        })()
    }, [])

    // 添加状态锁定，防止频闪
    const [isUpdatingBackground, setIsUpdatingBackground] = useState(false)

    useEffect(() => {
        const handleBgImageChange = async (event, filePath) => {
            // 防止重复更新
            if (isUpdatingBackground) return
            setIsUpdatingBackground(true)

            try {
                const bgEnabled = await window.ipcApi.getBgEnabled()

                // 如果背景未开启或背景图片路径为空，设置为透明色
                if (!bgEnabled) {
                    document.documentElement.style.setProperty('--editor-background', 'transparent')
                    document.documentElement.style.setProperty('--editor-background-image', 'none')
                    return
                }

                // 先设置背景滤镜（透明度）
                const transparencySetting = await window.ipcApi.getBgTransparency()
                const backgroundRgba = `rgba(${isDarkMode ? '0, 0, 0,' : '255, 255, 255,'} ${isDarkMode ? transparencySetting.dark / 100 : transparencySetting.light / 100})`

                // 然后加载背景图片
                const imgPath = await window.electron.nativeImage.createFromPath(filePath)
                const backgroundImage = `url(${imgPath.toDataURL()})`

                // 批量更新CSS变量，减少重绘次数
                requestAnimationFrame(() => {
                    document.documentElement.style.setProperty(
                        '--editor-background',
                        backgroundRgba
                    )
                    document.documentElement.style.setProperty(
                        '--editor-background-image',
                        backgroundImage
                    )
                })
            } catch (error) {
                console.error('背景图片更新失败:', error)
            } finally {
                // 添加短暂延迟，确保更新完成
                setTimeout(() => {
                    setIsUpdatingBackground(false)
                }, 100)
            }
        }

        window.ipcApi.onBgImageChange(handleBgImageChange)
        return () => window.ipcApi.removeBgImageChange(handleBgImageChange)
    }, [isDarkMode])

    const isDarkModeRef = useRef(isDarkMode)

    // 更新 ref 的值
    useEffect(() => {
        isDarkModeRef.current = isDarkMode
    }, [isDarkMode])

    useEffect(() => {
        const handleBgTransparencyChange = async (event, theme, transparency) => {
            // 如果正在更新背景图片，跳过透明度更新，避免冲突
            if (isUpdatingBackground) return
            const [bgEnabled, bgImage] = await Promise.all([
                window.ipcApi.getBgEnabled(),
                window.ipcApi.getBgImage()
            ])
            // 如果背景未开启或背景图片路径为空，不改变透明度
            if (!bgEnabled || !bgImage || bgImage === '') {
                return
            }
            // 使用 ref 获取最新 isDarkMode
            if (theme === 'dark' && isDarkModeRef.current) {
                requestAnimationFrame(() => {
                    document.documentElement.style.setProperty(
                        '--editor-background',
                        `rgba(0, 0, 0, ${transparency / 100})`
                    )
                })
            } else if (theme === 'light' && !isDarkModeRef.current) {
                requestAnimationFrame(() => {
                    document.documentElement.style.setProperty(
                        '--editor-background',
                        `rgba(255, 255, 255, ${transparency / 100})`
                    )
                })
            }
        }
        // 注册监听（只运行一次）
        window.ipcApi.onBgTransparencyChange(handleBgTransparencyChange)

        return () => {
            // 确保移除的是同一个函数
            window.ipcApi.removeBgTransparencyChange(handleBgTransparencyChange)
        }
    }, [])

    useEffect(() => {
        // 初始化背景数据
        const loadInitialData = async () => {
            try {
                const [bgEnabled, bgImage] = await Promise.all([
                    window.ipcApi.getBgEnabled(),
                    window.ipcApi.getBgImage()
                ])

                // 如果背景未开启或背景图片路径为空，设置为透明色
                if (!bgEnabled || !bgImage || bgImage === '') {
                    requestAnimationFrame(() => {
                        document.documentElement.style.setProperty(
                            '--editor-background',
                            'transparent'
                        )
                        document.documentElement.style.setProperty(
                            '--editor-background-image',
                            'none'
                        )
                    })
                } else {
                    // 背景图片开启时，先设置背景滤镜（透明度）
                    const transparencySetting = await window.ipcApi.getBgTransparency()
                    const backgroundRgba = `rgba(${isDarkMode ? '0, 0, 0,' : '255, 255, 255,'} ${isDarkMode ? transparencySetting.dark / 100 : transparencySetting.light / 100})`

                    // 然后加载背景图片
                    const img = await window.electron.nativeImage.createFromPath(bgImage)
                    const backgroundImage = `url(${img.toDataURL()})`

                    // 批量更新CSS变量，减少重绘次数
                    requestAnimationFrame(() => {
                        document.documentElement.style.setProperty(
                            '--editor-background',
                            backgroundRgba
                        )
                        document.documentElement.style.setProperty(
                            '--editor-background-image',
                            backgroundImage
                        )
                    })
                }
            } catch (error) {
                console.error('加载初始数据失败:', error)
            }
        }

        loadInitialData().catch(console.error) // 调用这个方法
    }, [])

    useEffect(() => {
        document.documentElement.style.setProperty('--console-layout-height', `${consoleHeight}px`)
    }, [consoleHeight])

    // 控制台高度限制常量
    const CONSOLE_MIN_HEIGHT = 125;
    const CONSOLE_MARGIN = 125;

    function initConsoleDragEvent(event) {
        event.preventDefault();

        const startY = event.clientY;
        const startHeight = parseInt(document.defaultView.getComputedStyle(consoleLayoutRef.current).height, 10);

        const containerHeight = consoleLayoutRef.current.parentElement.clientHeight;

        function doDrag(event) {
            const newHeight = startHeight + (startY - event.clientY);

            const minHeight = CONSOLE_MIN_HEIGHT;
            const maxHeight = containerHeight - CONSOLE_MARGIN;

            setConsoleHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
        }

        function stopDrag() {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        }

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    // 监听窗口大小变化，重新计算控制台高度限制
    useEffect(() => {
        const handleResize = () => {
            if (consoleLayoutRef.current && consoleVisible) {
                const containerHeight = consoleLayoutRef.current.parentElement.clientHeight;
                const maxHeight = containerHeight - CONSOLE_MARGIN;
                const minHeight = CONSOLE_MIN_HEIGHT;

                // 如果当前控制台高度超出了新的最大高度限制，则调整到最大允许高度
                if (consoleHeight > maxHeight) {
                    setConsoleHeight(maxHeight);
                } else if (consoleHeight < minHeight) {
                    setConsoleHeight(minHeight);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [consoleHeight, consoleVisible]);

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

    // 拖拽控制台高度
    const handleDragConsole = (event) => initConsoleDragEvent(event);

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
                            <div className="console-layout" ref={consoleLayoutRef}>
                                <div className="console__drag-bar" onMouseDown={handleDragConsole}></div>
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
