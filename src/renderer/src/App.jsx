/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Button, ConfigProvider, Layout, theme, App as AntdApp } from 'antd'
import { MoonFilled, SunOutlined } from '@ant-design/icons'
import './App.scss'
import AppHeader from './components/AppHeader'
import TabBar from './components/TabBar'
import Console from './components/Console'
import { useFileManager, useCurrentFile } from './hooks/useFileManager'
import EditorWithFileContext from './components/EditorWithFileContext'
import CodeRunner from './components/CodeRunner'
import EditorStatusBar from './components/EditorStatusBar'
import useThemeLoader from './hooks/useThemeLoader'
import { isJavaScriptFileOptimized, isHTMLFileOptimized } from './utils/fileNameUtils'

const { Content } = Layout

// 内部组件，用于访问文件上下文
// eslint-disable-next-line react/prop-types
const AppContent = ({ isDarkMode, toggleTheme, onRunCode, consoleVisible, onCloseConsole, fileManager }) => {
    const currentFile = useCurrentFile(fileManager)
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
    // 检查文件是否为JavaScript文件 - 使用 useMemo 优化
    const fileTypeCheckers = useMemo(() => ({
        isJavaScript: (fileName) => isJavaScriptFileOptimized(fileName),
        isHTML: (fileName) => isHTMLFileOptimized(fileName)
    }), [])

    const isJavaScriptFile = fileTypeCheckers.isJavaScript
    const isHTMLFile = fileTypeCheckers.isHTML

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
                    <EditorWithFileContext
                        isDarkMode={isDarkMode}
                        onRunCode={onRunCode}
                        consoleVisible={consoleVisible}
                        onCloseConsole={onCloseConsole}
                        fileManager={fileManager}
                    />
                </div>
            </div>
        </>
    )
}

const App = () => {
    // 文件管理器
    const fileManager = useFileManager()

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

    // 切换主题 - 使用 useCallback 优化
    const toggleTheme = useCallback(() => {
        // 同时保存到electron-store
        if (window.ipcApi && window.ipcApi.setTheme) {
            window.ipcApi.setTheme(!isDarkMode ? 'dark' : 'light').catch((error) => {
                console.error('保存主题设置失败:', error)
            })
        }
    }, [isDarkMode])

    const changeTheme = useCallback(() => {
        const newTheme = !isDarkMode
        setIsDarkMode(newTheme)
        // 保存到localStorage（向后兼容）
        localStorage.setItem('theme', newTheme ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
    }, [isDarkMode])
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
            const { dark, light } = transparencySetting;
            const colors = isDarkMode ? '0, 0, 0' : '255, 255, 255';
            const alpha = isDarkMode ? dark : light;

            document.documentElement.style.setProperty(
                `--editor-background-${isDarkMode ? 'dark' : 'light'}`,
                `rgba(${colors}, ${alpha / 100})`
            );
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

    // 使用自定义hook加载保存的主题
    useThemeLoader(setIsDarkMode)

    useEffect(() => {
        const handleBgImageChange = async (event, filePath) => {

            try {
                const bgEnabled = await window.ipcApi.getBgEnabled()

                // 如果背景未开启或背景图片路径为空，设置为透明色
                if (!bgEnabled) {
                    requestAnimationFrame(() => {
                        document.documentElement.style.setProperty('--editor-background-light', 'transparent')
                        document.documentElement.style.setProperty('--editor-background-dark', 'transparent')
                        document.documentElement.style.setProperty('--editor-background-image', 'none')
                    })
                    return
                }

                // 先设置背景滤镜（透明度）
                const transparencySetting = await window.ipcApi.getBgTransparency()

                // 然后加载背景图片
                const imgPath = await window.electron.nativeImage.createFromPath(filePath)
                const backgroundImage = `url(${imgPath.toDataURL()})`

                // 批量更新CSS变量，减少重绘次数
                requestAnimationFrame(() => {
                    document.documentElement.style.setProperty(
                        '--editor-background-light',
                        `rgba(255, 255, 255, ${transparencySetting.light / 100})`
                    )
                    document.documentElement.style.setProperty(
                        '--editor-background-dark',
                        `rgba(0, 0, 0, ${transparencySetting.dark / 100})`
                    )
                    document.documentElement.style.setProperty(
                        '--editor-background-image',
                        backgroundImage
                    )
                })
            } catch (error) {
                console.error('背景图片更新失败:', error)
            }
        }

        window.ipcApi.onBgImageChange(handleBgImageChange)
        return () => window.ipcApi.removeBgImageChange(handleBgImageChange)
    }, [])

    const isDarkModeRef = useRef(isDarkMode)

    // 更新 ref 的值
    useEffect(() => {
        isDarkModeRef.current = isDarkMode
    }, [isDarkMode])

    useEffect(() => {
        const handleBgTransparencyChange = async (event, theme, transparency) => {
            const [bgEnabled, bgImage] = await Promise.all([
                window.ipcApi.getBgEnabled(),
                window.ipcApi.getBgImage()
            ])
            // 如果背景未开启或背景图片路径为空，不改变透明度
            if (!bgEnabled || !bgImage || bgImage === '') {
                return
            }
            const colors = theme === 'dark' ? '0, 0, 0' : '255, 255, 255';
            document.documentElement.style.setProperty(
                `--editor-background-${theme}`,
                `rgba(${colors}, ${transparency / 100})`
            );
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
                            '--editor-background-light',
                            'transparent'
                        )
                        document.documentElement.style.setProperty(
                            '--editor-background-dark',
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

                    // 然后加载背景图片
                    const img = await window.electron.nativeImage.createFromPath(bgImage)
                    const backgroundImage = `url(${img.toDataURL()})`

                    // 批量更新CSS变量，减少重绘次数
                    requestAnimationFrame(() => {
                        document.documentElement.style.setProperty(
                            '--editor-background-light',
                            `rgba(255, 255, 255, ${transparencySetting.light / 100})`
                        )
                        document.documentElement.style.setProperty(
                            '--editor-background-dark',
                            `rgba(0, 0, 0, ${transparencySetting.dark / 100})`
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

            const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
            setConsoleHeight(clampedHeight)

            // 直接设置高度，不使用动画
            if (consoleLayoutRef.current) {
                consoleLayoutRef.current.style.height = `${clampedHeight}px`
                document.documentElement.style.setProperty('--console-layout-height', `${clampedHeight}px`)
            }
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
            if (consoleLayoutRef.current) {
                const containerHeight = consoleLayoutRef.current.parentElement.clientHeight;
                // 如果编辑器高度小于margin * 2常量，隐藏console
                if (containerHeight < CONSOLE_MARGIN * 2) {
                    if (consoleVisible) {
                        setConsoleVisible(false);
                    }
                    return;
                }

                // 重新计算控制台高度限制（仅在console可见时）
                if (consoleVisible) {
                    const maxHeight = containerHeight - CONSOLE_MARGIN;
                    const minHeight = CONSOLE_MIN_HEIGHT;

                    // 如果当前控制台高度超出了新的最大高度限制，则调整到最大允许高度
                    if (consoleHeight > maxHeight) {
                        setConsoleHeight(maxHeight);
                    } else if (consoleHeight < minHeight) {
                        setConsoleHeight(minHeight);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);

        // 初始检查一次
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [consoleHeight, consoleVisible]);

    // 控制台高度动画函数
    const animateConsoleHeight = (fromHeight, toHeight, duration, onComplete) => {
        const startTime = performance.now()
        const heightDiff = toHeight - fromHeight

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // 使用easeOutCubic缓动函数
            const easeOutCubic = 1 - Math.pow(1 - progress, 3)
            const currentHeight = fromHeight + heightDiff * easeOutCubic

            if (consoleLayoutRef.current) {
                consoleLayoutRef.current.style.height = `${currentHeight}px`
                document.documentElement.style.setProperty('--console-layout-height', `${currentHeight}px`)
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                // 动画完成，更新状态
                setConsoleHeight(toHeight)
                if (onComplete) {
                    onComplete()
                }
            }
        }

        requestAnimationFrame(animate)
    }

    // 处理代码运行输出 - 使用 useCallback 优化
    const handleRunCode = useCallback((output) => {
        if (output.type === 'clear') {
            setConsoleOutputs([])
        } else {
            setConsoleOutputs((prev) => [...prev, output])
        }

        // 显示控制台
        if (!consoleVisible) {
            // 直接显示控制台，不使用动画
            setConsoleHeight(276)
            setConsoleVisible(true)
        }
    }, [consoleVisible])

    // 拖拽控制台高度 - 使用 useCallback 优化
    const handleDragConsole = useCallback((event) => initConsoleDragEvent(event), [])

    // 清空控制台 - 使用 useCallback 优化
    const handleClearConsole = useCallback(() => {
        setConsoleOutputs([])
    }, [])

    // 关闭控制台 - 使用 useCallback 优化
    const handleCloseConsole = useCallback(() => {
        // 使用JavaScript动画控制height
        animateConsoleHeight(consoleHeight, 0, 300, () => {
            setConsoleVisible(false)
            setConsoleOutputs([])
        })
    }, [consoleHeight])
    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                    wireframe: false
                }
            }}
        >
            <AntdApp>
                <Layout className="app-layout">
                    <AppHeader fileManager={fileManager} />
                    <TabBar onRunCode={handleRunCode} fileManager={fileManager} />
                    <Layout className="main-layout">
                        <Content className={`app-content ${consoleVisible ? 'with-console' : ''}`}>
                            <AppContent
                                isDarkMode={isDarkMode}
                                toggleTheme={toggleTheme}
                                onRunCode={handleRunCode}
                                consoleVisible={consoleVisible}
                                onCloseConsole={handleCloseConsole}
                                fileManager={fileManager}
                            />
                        </Content>
                        {consoleVisible && (
                            <div
                                className="console-layout"
                                ref={consoleLayoutRef}
                                style={{ height: `${consoleHeight}px` }}
                            >
                                <div className="console__drag-bar" onMouseDown={handleDragConsole}></div>
                                <Console
                                    outputs={consoleOutputs}
                                    onClear={handleClearConsole}
                                    onClose={handleCloseConsole}
                                    visible={consoleVisible}
                                />
                            </div>
                        )}
                        <EditorStatusBar fileManager={fileManager} />
                    </Layout>
                </Layout>
            </AntdApp>
        </ConfigProvider>
    )
}

export default App
