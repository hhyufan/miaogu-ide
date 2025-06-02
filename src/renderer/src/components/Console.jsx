import './Console.scss'

import MarkdownRenderer from './MarkdownRenderer'

import { useEffect, useRef, useState } from 'react'
import { CloseOutlined, ClearOutlined } from '@ant-design/icons'
import { useBackgroundManager } from '../hooks/useBackgroundManager'
import { Button, Card } from 'antd'
// eslint-disable-next-line react/prop-types
const Console = ({ outputs = [], onClear, onClose, visible = false }) => {
    const outputRef = useRef(null)
    const [fontFamily, setFontFamily] = useState('JetBrains Mono')
    const { hasBackground } = useBackgroundManager()

    useEffect(() => {
        const initFamily = async () => {
            const setting = await window.ipcApi.getSetting()
            setFontFamily(setting.fontFamily || 'JetBrains Mono')
        }
        initFamily().catch(console.error)
    }, [])

    useEffect(() => {
        const handleFontFamilyChange = (event, newFontFamily) => {
            setFontFamily(newFontFamily)
        }
        window.ipcApi.onFontFamilyChange(handleFontFamilyChange)
        return () => {
            window.ipcApi.removeFontFamilyChange(handleFontFamilyChange)
        }
    }, [])

    // 自动滚动到底部
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [outputs])

    if (!visible) {
        return null
    }

    const getOutputClass = (type) => {
        switch (type) {
            case 'error':
                return 'console-output-error'
            case 'warn':
                return 'console-output-warn'
            case 'info':
                return 'console-output-info'
            case 'success':
                return 'console-output-success'
            case 'result':
                return 'console-output-result'
            case 'markdown':
                return 'console-output-markdown'
            default:
                return 'console-output-log'
        }
    }

    const getOutputPrefix = (type) => {
        switch (type) {
            case 'error':
                return '❌'
            case 'warn':
                return '⚠️'
            case 'info':
                return 'ℹ️'
            case 'success':
                return '✅'
            case 'result':
                return '📤'
            case 'markdown':
                return '📄'
            default:
                return '📝'
        }
    }
    return (
        <div className={`console-container ${hasBackground ? 'with-background' : ''}`}>
            <Card
                size="small"
                title={
                    <div className="console-header">
                        <span>控制台</span>
                        <div className="console-actions">
                            <Button
                                type="text"
                                size="small"
                                icon={<ClearOutlined />}
                                onClick={onClear}
                                title="清空控制台"
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={onClose}
                                title="关闭控制台"
                            />
                        </div>
                    </div>
                }
                className="console-card"
            >
                {
                    <div className="console-content">
                        <div
                            className="console-outputs"
                            style={{ fontFamily: `'${fontFamily}', monospace` }}
                            ref={outputRef}
                        >
                            {outputs.length === 0 ? (
                                <div className="console-empty">控制台已准备就绪</div>
                            ) : (
                                outputs.map((output, index) => (
                                    <div
                                        key={index}
                                        className={`console-output ${getOutputClass(output.type)}`}
                                    >
                                        <span className="console-prefix">
                                            {getOutputPrefix(output.type)}
                                        </span>
                                        {output.type === 'markdown' ? (
                                            <div className="console-content-markdown">
                                                <MarkdownRenderer content={output.content} />
                                            </div>
                                        ) : (
                                            <span className="console-content-text">
                                                {output.content}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                }
            </Card>
        </div>
    )
}

export default Console
