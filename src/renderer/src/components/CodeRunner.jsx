import { useState, useCallback, useMemo } from 'react'
import { Button, message } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import * as Babel from '@babel/standalone'

// 配置Babel预设和插件（浏览器兼容版本）
Babel.registerPreset('browser-safe', {
    presets: [['env', { targets: { browsers: ['last 2 versions'] } }]],
    plugins: []
})

// eslint-disable-next-line react/prop-types
const CodeRunner = ({ code, filePath, onOutput, disabled = false, fileType = 'javascript' }) => {
    const [isRunning, setIsRunning] = useState(false)
    // HTML执行函数
    const executeHTML = useCallback(async () => {
        // eslint-disable-next-line react/prop-types
        if (!code || !code.trim()) {
            message.warning('没有HTML代码可以执行')
            return
        }

        setIsRunning(true)

        try {
            // 清空之前的输出
            onOutput && onOutput({ type: 'clear' })

            onOutput &&
                onOutput({
                    type: 'info',
                    content: '正在在浏览器中打开HTML文件...'
                })

            // 优先使用内存中的content内容，而不是文件系统中的内容
            const result = await window.ipcApi.runHtmlFile(filePath, code, false)

            if (result.success) {
                onOutput &&
                    onOutput({
                        type: 'log',
                        content: `✅ ${result.message}`
                    })

                if (result.filePath) {
                    const isTemp = result.filePath.includes('temp_')
                    onOutput &&
                        onOutput({
                            type: 'info',
                            content: `文件路径: ${result.filePath}${isTemp ? ' (临时文件)' : ''}`
                        })
                }
            } else {
                onOutput &&
                    onOutput({
                        type: 'error',
                        content: `${result.message}`
                    })
                message.error(result.message)
            }
        } catch (error) {
            const errorMessage = `运行HTML文件失败: ${error.message}`
            onOutput &&
                onOutput({
                    type: 'error',
                    content: `${errorMessage}`
                })
            message.error(errorMessage)
        } finally {
            setIsRunning(false)
        }
    }, [code, filePath, onOutput])

    const executeCode = useCallback(async () => {
        // eslint-disable-next-line react/prop-types
        if (!code || !code.trim()) {
            message.warning('没有代码可以执行')
            return
        }

        setIsRunning(true)

        try {
            // 清空之前的输出
            onOutput && onOutput({ type: 'clear' })

            // 创建沙箱环境
            const sandbox = {
                console: {
                    log: (...args) => {
                        const output = args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' ')
                        onOutput && onOutput({ type: 'log', content: output })
                    },
                    error: (...args) => {
                        const output = args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' ')
                        onOutput && onOutput({ type: 'error', content: output })
                    },
                    warn: (...args) => {
                        const output = args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' ')
                        onOutput && onOutput({ type: 'warn', content: output })
                    },
                    info: (...args) => {
                        const output = args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' ')
                        onOutput && onOutput({ type: 'info', content: output })
                    },
                    md: (...args) => {
                        const output = args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' ')
                        onOutput && onOutput({ type: 'markdown', content: output })
                    }
                },
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Promise,
                fetch: window.fetch?.bind(window),
                Math,
                Date,
                JSON,
                Array,
                Object,
                String,
                Number,
                Boolean,
                RegExp,
                Error,
                TypeError,
                ReferenceError,
                SyntaxError
            }

            // 创建函数并执行
            const sandboxKeys = Object.keys(sandbox)
            const sandboxValues = Object.values(sandbox)

            // 包装代码以捕获返回值
            const wrappedCode = `
                try {
                    ${code}
                } catch (error) {
                    console.error('运行时错误:', error.message)
                    throw error
                }
            `

            const func = new Function(...sandboxKeys, wrappedCode)

            // 在Promise中执行以捕获异步错误
            await new Promise((resolve, reject) => {
                try {
                    const result = func(...sandboxValues)

                    // 如果返回Promise，等待其完成
                    if (result && typeof result.then === 'function') {
                        result
                            .then(() => {
                                resolve()
                            })
                            .catch((error) => {
                                onOutput &&
                                    onOutput({
                                        type: 'error',
                                        content: `异步错误: ${error.message}`
                                    })
                                reject(error)
                            })
                    } else {
                        // 如果有返回值，显示它
                        if (result !== undefined) {
                            onOutput &&
                                onOutput({
                                    type: 'result',
                                    content:
                                        typeof result === 'object'
                                            ? JSON.stringify(result, null, 2)
                                            : String(result)
                                })
                        }
                        resolve()
                    }
                } catch (error) {
                    onOutput &&
                        onOutput({
                            type: 'error',
                            content: `执行错误: ${error.message}`
                        })
                    reject(error)
                }
            })
        } catch (error) {
            onOutput &&
                onOutput({
                    type: 'error',
                    content: `执行失败: ${error.message}`
                })
        } finally {
            setIsRunning(false)
        }
    }, [code, onOutput])

    // 根据文件类型选择执行函数
    const handleExecute = fileType === 'html' ? executeHTML : executeCode

    // 根据文件类型设置按钮样式和提示
    const getButtonConfig = useMemo(() => {
        switch (fileType) {
            case 'html':
                return {
                    text: '运行 HTML',
                    icon: '🌐',
                    action: executeHTML
                }
            case 'python':
                return {
                    text: '运行 Python',
                    icon: '🐍',
                    action: executeCode
                }
            case 'javascript':
            default:
                return {
                    text: '运行 JavaScript',
                    icon: '⚡',
                    action: executeCode
                }
        }
    }, [fileType, executeHTML, executeCode])

    const buttonConfig = getButtonConfig()

    return (
        <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={isRunning}
            disabled={disabled}
            style={{
                color: buttonConfig.color
            }}
            title={buttonConfig.title}
        />
    )
}

export default CodeRunner
